/* =============================================================================
   api.js — the only place that talks to the backend.
   Spec: §7 API overview, §8 answer contract, §10 errors + CORS, §12 request
   helper, §13 mock strategy.

   Frontend rules implemented here:
   - The API address lives in exactly one place (§7, §10, §12).
   - The frontend never judges an answer, never adds score, never removes a
     heart. It sends { gameId, answer } and displays what comes back (§2).
   - A timeout, a network failure, an unreadable body or HTTP 500 mean the
     result is UNCONFIRMED: the backend may already have processed the answer,
     so the request is never retried automatically (§12).
   ========================================================================== */

/** Backend base URL. Change this single line to point at another host (§7).
 *  IPv4 is used on purpose: on Windows "localhost" also resolves to ::1, and a
 *  browser that tries the IPv6 address first can stall until the request times
 *  out, which the game then reports as "Result not confirmed". */
export const API_BASE = "http://127.0.0.1:8080/api";

/** true  = use the fixed JSON scenes in ./mocks (development, backend offline).
 *  false = use the real C++ backend. Turn this off before integration (§13).
 *  A `?api=live` query parameter overrides it for one visit, which is handy for
 *  checking the real backend (or tools/dev-stub-server.mjs) without editing. */
const USE_MOCK_DEFAULT = true;
const API_PARAM = new URLSearchParams(location.search).get("api");
export const USE_MOCK = API_PARAM === "live" ? false : API_PARAM === "mock" ? true : USE_MOCK_DEFAULT;

/** Which fixed scene the mock adapter replays (§13 scene list).
 *  "correct" | "wrong" | "gameover" | "invalid-category" | "invalid-game"
 *  A `?scene=wrong` query parameter overrides it, so every scene can be checked
 *  in the browser without editing this file. */
const SCENE_PRESETS = ["correct", "wrong", "gameover", "invalid-category", "invalid-game"];
const SCENE_PARAM = new URLSearchParams(location.search).get("scene");
export const MOCK_SCENE = SCENE_PRESETS.includes(SCENE_PARAM) ? SCENE_PARAM : "correct";

/** Fake latency for mock mode, so the request lock and disabled buttons are
 *  visible while developing. Set to 0 for instant feedback. */
export const MOCK_LATENCY_MS = 400;

/** Live request timeout. A network problem must never freeze the UI. */
export const REQUEST_TIMEOUT_MS = 10000;

/** Error codes where the submitted answer was not accepted, so the player may
 *  simply try again on the same question (§12). */
export const RECOVERABLE_CODES = [
  "INVALID_JSON",
  "INVALID_REQUEST",
  "INVALID_CATEGORY",
  "UNSUPPORTED_MEDIA_TYPE"
];

/** Error codes where the session cannot continue and a new game is required (§12). */
export const RESTART_CODES = ["INVALID_GAME_ID", "GAME_ALREADY_OVER"];

/** Code used locally when the answer may or may not have reached the backend. */
export const UNCONFIRMED_CODE = "RESULT_UNCONFIRMED";

/** Code used locally when a mock JSON scene cannot be loaded. */
export const MOCK_LOAD_FAILED_CODE = "MOCK_LOAD_FAILED";

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{code?: string, status?: number, unconfirmed?: boolean}} [details]
   */
  constructor(message, { code = "UNKNOWN_ERROR", status = 0, unconfirmed = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.unconfirmed = unconfirmed;
  }
}

const START_ENDPOINT = "/game/start";
const ANSWER_ENDPOINT = "/game/answer";
export const HEALTH_ENDPOINT = "/health";

/** Fixed scenes are always loaded relative to index.html, so the folder can be
 *  served from any host or port. */
const MOCK_BASE = "./mocks";

// ---------------------------------------------------------------- live client

/**
 * Single request entry point (§12). Throws ApiError for every failure mode.
 * @param {string} path
 * @param {RequestInit} [options]
 */
async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(API_BASE + path, { ...options, signal: controller.signal });
  } catch (cause) {
    // Offline, DNS failure, server not started, or timeout: unconfirmed.
    const timedOut = cause && cause.name === "AbortError";
    throw new ApiError(
      timedOut
        ? "The server did not answer in time."
        : "Could not reach the server. Is the backend running on port 8080?",
      { code: UNCONFIRMED_CODE, status: 0, unconfirmed: true }
    );
  } finally {
    clearTimeout(timer);
  }

  const raw = await response.text().catch(() => {
    throw new ApiError("The server response could not be read.", {
      code: UNCONFIRMED_CODE,
      status: response.status,
      unconfirmed: true
    });
  });

  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      // A broken body carries no trustworthy game state.
      const unconfirmed = response.ok || response.status >= 500;
      throw new ApiError(`Request failed (HTTP ${response.status}).`, {
        code: unconfirmed ? UNCONFIRMED_CODE : "INTERNAL_ERROR",
        status: response.status,
        unconfirmed
      });
    }
  }

  if (!response.ok) {
    const code = (data && data.code) || "INTERNAL_ERROR";
    // Spec §10: a 500 may mean the answer was already applied by the backend.
    const unconfirmed = response.status >= 500 || code === "INTERNAL_ERROR";
    throw new ApiError((data && data.message) || `Request failed (HTTP ${response.status}).`, {
      code,
      status: response.status,
      unconfirmed
    });
  }

  if (!data) {
    throw new ApiError("The server returned an empty response.", {
      code: UNCONFIRMED_CODE,
      status: response.status,
      unconfirmed: true
    });
  }

  return data;
}

export const liveApi = {
  mode: "live",
  /** POST /game/start — no request body (§7). */
  start: () => request(START_ENDPOINT, { method: "POST" }),
  /** POST /game/answer — only gameId and answer are sent (§8). */
  answer: (gameId, answer) =>
    request(ANSWER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, answer })
    })
};

// ----------------------------------------------------------------- mock client

const SCENE_FILES = {
  correct: "answer-correct.json",
  wrong: "answer-wrong.json",
  gameover: "game-over.json"
};

const SCENE_ERRORS = {
  "invalid-category": { file: "invalid-category.json", status: 400 },
  "invalid-game": { file: "invalid-game.json", status: 404 }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadScene(file) {
  let response;
  try {
    response = await fetch(`${MOCK_BASE}/${file}`, { cache: "no-store" });
  } catch {
    throw new ApiError(
      `Could not load mocks/${file}. Serve this folder over HTTP (run start_web.bat) instead of opening index.html directly.`,
      { code: MOCK_LOAD_FAILED_CODE }
    );
  }
  if (!response.ok) {
    throw new ApiError(`Missing mock scene mocks/${file} (HTTP ${response.status}).`, {
      code: MOCK_LOAD_FAILED_CODE,
      status: response.status
    });
  }
  return response.json();
}

/**
 * The mock adapter replays fixed scenes only. It performs no judging, no
 * scoring and no random selection — those stay in C++ (§13).
 */
export const mockApi = {
  mode: "mock",
  start: async () => {
    await sleep(MOCK_LATENCY_MS);
    return structuredClone(await loadScene("start.json"));
  },
  // gameId and answer are intentionally ignored: a fixed scene always replays
  // the same scripted outcome. Judging belongs to the backend (§2, §13).
  answer: async () => {
    await sleep(MOCK_LATENCY_MS);

    const errorScene = SCENE_ERRORS[MOCK_SCENE];
    if (errorScene) {
      const payload = await loadScene(errorScene.file);
      throw new ApiError(payload.message || "Request failed.", {
        code: payload.code || "INVALID_REQUEST",
        status: errorScene.status
      });
    }

    const file = SCENE_FILES[MOCK_SCENE] || SCENE_FILES.correct;
    const scene = await loadScene(file);
    return structuredClone(scene);
  }
};

/** The adapter the UI uses. Flip USE_MOCK above to change backends. */
export const api = USE_MOCK ? mockApi : liveApi;

/** Human readable label for the header badge. */
export function describeMode() {
  return USE_MOCK
    ? { mode: "mock", label: MOCK_SCENE === "correct" ? "Mock mode" : `Mock · ${MOCK_SCENE}` }
    : { mode: "live", label: "Live API" };
}

// -------------------------------------------------------------- error handling

/**
 * Turn any thrown value into the decision the player needs (§12).
 * @param {unknown} error
 * @returns {{title: string, message: string, action: "retry"|"restart"|"none", actionLabel: string, restart: boolean}}
 */
export function describeError(error) {
  const apiError = error instanceof ApiError ? error : null;
  const code = apiError ? apiError.code : "UNKNOWN_ERROR";

  if (apiError?.unconfirmed) {
    return {
      title: "Result not confirmed",
      message:
        "The answer was not confirmed, so it will not be sent again — the server may or may not have counted it. Start a new game.",
      action: "restart",
      actionLabel: "New game",
      restart: true
    };
  }

  if (RESTART_CODES.includes(code)) {
    return {
      title: code === "GAME_ALREADY_OVER" ? "This game is already over" : "Game session not found",
      message:
        code === "GAME_ALREADY_OVER"
          ? "This session has no hearts left. Start a new game to keep playing."
          : "The server no longer knows this session (it may have restarted). Start a new game.",
      action: "restart",
      actionLabel: "New game",
      restart: true
    };
  }

  if (RECOVERABLE_CODES.includes(code)) {
    return {
      title: "That answer was not accepted",
      message: `${apiError?.message || "The server rejected the request."} Please choose a bin again.`,
      action: "retry",
      actionLabel: "",
      restart: false
    };
  }

  if (code === MOCK_LOAD_FAILED_CODE) {
    return {
      title: "Mock scene unavailable",
      message: apiError?.message || "A mock JSON file could not be loaded.",
      action: "none",
      actionLabel: "",
      restart: false
    };
  }

  return {
    title: "Something went wrong",
    message: apiError?.message || "An unexpected error happened. Please start a new game.",
    action: "restart",
    actionLabel: "New game",
    restart: true
  };
}

export { request };
