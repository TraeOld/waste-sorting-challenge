/* =============================================================================
   dev-stub-server.mjs — THROWAWAY stub of the C++ API, for frontend checks only.

   This is NOT the deliverable backend and not the answer bank. It exists so the
   frontend can be tested against real HTTP (POST + JSON + CORS preflight) while
   member 5 is still writing ApiServer.cpp. It implements exactly the three
   routes from spec §7 with the response shapes from §7–§10, using four sample
   items instead of the 24-item data table.

   Run it:
     node tools/dev-stub-server.mjs          # listens on http://localhost:8080
   then open:  http://localhost:5500/index.html?api=live

   The real backend must follow §10: CORS headers on every response, 204 for the
   OPTIONS preflight, and the error shape { error, code, message }.
   ========================================================================== */

import http from "node:http";

/** Four samples — one per category. The full 24-item table stays in C++. */
const SAMPLE_ITEMS = [
  { id: 13, name: "Button Battery", category: "hazardous", imageKey: "button_battery",
    ecoTip: "Batteries should be collected separately because they may contain harmful materials." },
  { id: 7, name: "Banana Peel", category: "kitchen", imageKey: "banana_peel",
    ecoTip: "Banana peels belong with food scraps in this game." },
  { id: 1, name: "Plastic Bottle", category: "recyclable", imageKey: "plastic_bottle",
    ecoTip: "Empty plastic bottles can become new plastic products." },
  { id: 19, name: "Used Tissue", category: "other", imageKey: "used_tissue",
    ecoTip: "Used tissues belong to other waste in this game." }
];

const CATEGORIES = ["recyclable", "kitchen", "hazardous", "other"];
const START_ITEM = SAMPLE_ITEMS[0];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const publicItem = (item) => ({ id: item.id, name: item.name, imageKey: item.imageKey });

export function createStubServer() {
  const sessions = new Map();
  const stats = { preflight: 0, start: 0, answer: 0, errors: 0 };
  let nextId = 1;

  const send = (res, status, payload) => {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": Buffer.byteLength(body)
    });
    res.end(body);
  };

  const fail = (res, status, code, message) => {
    stats.errors += 1;
    send(res, status, { error: true, code, message });
  };

  const readBody = (req) =>
    new Promise((resolve) => {
      let raw = "";
      req.on("data", (chunk) => {
        raw += chunk;
      });
      req.on("end", () => resolve(raw));
    });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "OPTIONS") {
      stats.preflight += 1;
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/health") {
      send(res, 200, { status: "ok" });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/game/start") {
      const session = {
        gameId: `game-${String(nextId++).padStart(3, "0")}`,
        score: 0,
        health: 3,
        correctAnswers: 0,
        wrongAnswers: 0,
        totalAnswers: 0,
        currentWaste: START_ITEM
      };
      sessions.set(session.gameId, session);
      stats.start += 1;
      send(res, 200, {
        gameId: session.gameId,
        score: session.score,
        health: session.health,
        item: publicItem(session.currentWaste)
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/game/answer") {
      if (!(req.headers["content-type"] || "").includes("application/json")) {
        fail(res, 415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json.");
        return;
      }

      const raw = await readBody(req);
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        fail(res, 400, "INVALID_JSON", "Request body is not valid JSON.");
        return;
      }

      const gameId = typeof body?.gameId === "string" ? body.gameId : "";
      const answer = typeof body?.answer === "string" ? body.answer : "";
      if (!gameId || !answer) {
        fail(res, 400, "INVALID_REQUEST", "gameId and answer are required.");
        return;
      }

      const session = sessions.get(gameId);
      if (!session) {
        fail(res, 404, "INVALID_GAME_ID", "Game session does not exist.");
        return;
      }
      if (session.health <= 0) {
        fail(res, 409, "GAME_ALREADY_OVER", "This game is already over.");
        return;
      }
      if (!CATEGORIES.includes(answer)) {
        fail(res, 400, "INVALID_CATEGORY", "Answer must be recyclable, kitchen, hazardous or other.");
        return;
      }

      const graded = session.currentWaste;
      const correct = graded.category === answer;
      session.totalAnswers += 1;
      if (correct) {
        session.correctAnswers += 1;
        session.score = session.correctAnswers * 10;
      } else {
        session.wrongAnswers += 1;
        session.health = Math.max(0, 3 - session.wrongAnswers);
      }
      const gameOver = session.health === 0;

      const pool = SAMPLE_ITEMS.filter((item) => item.id !== graded.id);
      const nextItem = pool[Math.floor(Math.random() * pool.length)];
      if (!gameOver) session.currentWaste = nextItem;

      stats.answer += 1;
      send(res, 200, {
        correct,
        correctCategory: graded.category,
        score: session.score,
        health: session.health,
        ecoTip: graded.ecoTip,
        gameOver,
        stats: {
          correctAnswers: session.correctAnswers,
          wrongAnswers: session.wrongAnswers,
          totalAnswers: session.totalAnswers,
          accuracy: Number(((session.correctAnswers / session.totalAnswers) * 100).toFixed(1))
        },
        ...(gameOver ? {} : { nextItem: publicItem(nextItem) })
      });
      return;
    }

    fail(res, 404, "INVALID_REQUEST", "Unknown route.");
  });

  return {
    server,
    stats,
    /** Drop every session, to reproduce a backend restart (INVALID_GAME_ID). */
    dropSessions: () => sessions.clear(),
    listen: (port = 8080) =>
      new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(port))),
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

if (process.argv[1] && process.argv[1].endsWith("dev-stub-server.mjs")) {
  const stub = createStubServer();
  await stub.listen(8080);
  console.log("Stub API listening on http://localhost:8080/api");
  console.log("Open http://localhost:5500/index.html?api=live");
}
