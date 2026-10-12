/* =============================================================================
   game.js — screen state, rendering and interaction.
   Spec: §11 pages and UI, §12 interaction + request flow, §13 mock switch.

   Three screen states: HOME → GAME → RESULT.
   Main flow functions: startGame, submitAnswer, renderWaste, updateHUD,
   showFeedback, showGameOver (§12).

   The frontend never computes score, hearts or accuracy. Every number shown in
   the HUD and on the result screen comes from the backend response (§2).
   ========================================================================== */

import {
  API_BASE,
  ApiError,
  UNCONFIRMED_CODE,
  USE_MOCK,
  api,
  describeError,
  describeMode
} from "./api.js";

/** Minimum time the feedback stays on screen before Continue unlocks (§11). */
const FEEDBACK_MIN_MS = 1500;

/** Fallback picture when assets/waste/<imageKey>.png is missing (§11). */
const PLACEHOLDER_IMAGE = "./assets/waste/_placeholder.png";

const IMAGE_DIR = "./assets/waste";

const HEART_TOTAL = 3;

/** The four bins. `value` is the API value from §3 and is sent unchanged. */
const BINS = [
  {
    value: "recyclable",
    label: "Recyclable Waste",
    zh: "可回收物",
    accent: "var(--bin-recyclable)",
    tint: "var(--bin-recyclable-tint)",
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 4.6a7.4 7.4 0 1 1-7 4.9" />
      <path d="M4.3 5.2v4.6h4.6" />
    </svg>`
  },
  {
    value: "kitchen",
    label: "Kitchen Waste",
    zh: "厨余垃圾",
    accent: "var(--bin-kitchen)",
    tint: "var(--bin-kitchen-tint)",
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 8.6c-1.9-2.4-5.6-1.6-5.6 1.9 0 3.2 2.4 7 4.1 7 .6 0 1-.4 1.5-.4s.9.4 1.5.4c1.7 0 4.1-3.8 4.1-7 0-3.5-3.7-4.3-5.6-1.9z" />
      <path d="M12 8.6V5.4" />
      <path d="M12.3 6.4c1.1-.9 2.6-1 3.4-.5-.6 1-2.2 1.4-3.4.5z" />
    </svg>`
  },
  {
    value: "hazardous",
    label: "Hazardous Waste",
    zh: "有害垃圾",
    accent: "var(--bin-hazardous)",
    tint: "var(--bin-hazardous-tint)",
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 4.4 3.6 19h16.8z" />
      <path d="M12 9.8v4.4" />
      <circle cx="12" cy="16.7" r="0.95" fill="currentColor" stroke="none" />
    </svg>`
  },
  {
    value: "other",
    label: "Other Waste",
    zh: "其他垃圾",
    accent: "var(--bin-other)",
    tint: "var(--bin-other-tint)",
    icon: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 7h14" />
      <path d="M9.5 7V4.8h5V7" />
      <path d="M6.7 7l.9 12.2h8.8L17.3 7" />
      <path d="M10.4 10.6v5.6" />
      <path d="M13.6 10.6v5.6" />
    </svg>`
  }
];

const BIN_BY_VALUE = new Map(BINS.map((bin) => [bin.value, bin]));

const ICON_CHECK = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
  stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.8l4.4 4.4L19 6.6" /></svg>`;

const ICON_CROSS = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor"
  stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7l10 10" /><path d="M17 7 7 17" /></svg>`;

const ICON_HEART = `<svg class="heart" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
  focusable="false"><path d="M12 20.3S3.9 15 3.9 9.6A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 8.1 2.3c0 5.4-8.1 10.7-8.1 10.7z" /></svg>`;

const el = (id) => document.getElementById(id);

const dom = {
  screens: {
    home: el("screen-home"),
    game: el("screen-game"),
    result: el("screen-result")
  },
  categoryList: el("category-list-home"),
  startBtn: el("start-btn"),
  playAgainBtn: el("play-again-btn"),
  homeBtn: el("home-btn"),
  hudScore: el("hud-score"),
  hudHealth: el("hud-health"),
  binGrid: el("bin-grid"),
  answersLabel: el("answers-label"),
  wasteImage: el("waste-image"),
  wasteName: el("waste-name"),
  wasteKicker: el("waste-kicker"),
  feedbackLayer: el("feedback-layer"),
  feedbackCard: el("feedback-card"),
  feedbackIcon: el("feedback-icon"),
  feedbackTitle: el("feedback-title"),
  feedbackSub: el("feedback-sub"),
  feedbackAnswer: el("feedback-answer"),
  feedbackTip: el("feedback-tip"),
  continueBtn: el("continue-btn"),
  resultScore: el("result-score"),
  statCorrect: el("stat-correct"),
  statWrong: el("stat-wrong"),
  statAccuracy: el("stat-accuracy"),
  resultNote: el("result-note"),
  modeBadge: el("mode-badge"),
  apiEndpoint: el("api-endpoint"),
  toast: el("toast"),
  toastTitle: el("toast-title"),
  toastText: el("toast-text"),
  toastAction: el("toast-action"),
  toastClose: el("toast-close")
};

const state = {
  screen: "home",
  gameId: null,
  currentItem: null,
  score: 0,
  health: HEART_TOTAL,
  isSubmitting: false,
  /** Session token: responses from a replaced game are ignored (§12). */
  token: 0,
  /** Answer response waiting behind the feedback panel. */
  pendingAnswer: null,
  lastFocusedBin: null
};

let feedbackTimer = null;
let onToastAction = null;

// ------------------------------------------------------------------- helpers

function imageUrl(imageKey) {
  return `${IMAGE_DIR}/${imageKey}.png`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function labelForCategory(value) {
  return BIN_BY_VALUE.get(value)?.label ?? value;
}

/** A response we cannot trust is handled like an unconfirmed result (§12). */
function assertStartResponse(data) {
  const ok =
    data &&
    typeof data.gameId === "string" &&
    data.gameId.length > 0 &&
    typeof data.score === "number" &&
    typeof data.health === "number" &&
    data.item &&
    typeof data.item.name === "string";
  if (!ok) {
    throw new ApiError("The start response did not match the agreed contract.", {
      code: UNCONFIRMED_CODE,
      unconfirmed: true
    });
  }
  return data;
}

function assertAnswerResponse(data) {
  const ok =
    data &&
    typeof data.correct === "boolean" &&
    typeof data.correctCategory === "string" &&
    typeof data.score === "number" &&
    typeof data.health === "number" &&
    typeof data.gameOver === "boolean" &&
    data.stats &&
    (data.gameOver || data.nextItem);
  if (!ok) {
    throw new ApiError("The answer response did not match the agreed contract.", {
      code: UNCONFIRMED_CODE,
      unconfirmed: true
    });
  }
  return data;
}

function showScreen(name) {
  state.screen = name;
  Object.entries(dom.screens).forEach(([key, node]) => {
    node.hidden = key !== name;
  });
}

function setBinsEnabled(enabled) {
  dom.binGrid.querySelectorAll("button").forEach((button) => {
    button.disabled = !enabled;
  });
}

function setAnswersLabel(text) {
  dom.answersLabel.textContent = text;
}

function setBusy(button, busy, busyLabel) {
  button.disabled = busy;
  button.setAttribute("aria-busy", String(busy));
  if (busyLabel) {
    if (!button.dataset.label) button.dataset.label = button.textContent;
    button.textContent = busy ? busyLabel : button.dataset.label;
  }
}

// -------------------------------------------------------------------- toasts

function hideToast() {
  dom.toast.hidden = true;
  dom.toastAction.hidden = true;
  onToastAction = null;
}

function showToast({ title, message, actionLabel, onAction }) {
  dom.toastTitle.textContent = title;
  dom.toastText.textContent = message;
  onToastAction = onAction ?? null;
  dom.toastAction.hidden = !(actionLabel && onToastAction);
  dom.toastAction.textContent = actionLabel ?? "";
  dom.toast.hidden = false;
}

// ------------------------------------------------------------------ rendering

function renderStaticContent() {
  const mode = describeMode();
  dom.modeBadge.textContent = mode.label;
  dom.modeBadge.dataset.mode = mode.mode;
  dom.apiEndpoint.textContent = USE_MOCK ? "mocks/*.json (fixed scenes)" : API_BASE;

  dom.categoryList.innerHTML = BINS.map(
    (bin) => `<li style="--accent:${bin.accent};--tint:${bin.tint}">
        <span class="dot">${bin.icon}</span>
        <span>${escapeHtml(bin.label)}</span>
        <span class="zh">${escapeHtml(bin.zh)}</span>
      </li>`
  ).join("");

  dom.binGrid.innerHTML = BINS.map(
    (bin, index) => `<button class="bin" type="button" data-value="${bin.value}"
        style="--accent:${bin.accent};--tint:${bin.tint}">
        <span class="bin-icon" aria-hidden="true">${bin.icon}</span>
        <span class="bin-text">
          <span class="bin-name">${escapeHtml(bin.label)}</span>
          <span class="bin-zh">${escapeHtml(bin.zh)}</span>
        </span>
        <span class="bin-key" aria-hidden="true">${index + 1}</span>
      </button>`
  ).join("");

  dom.hudHealth.innerHTML = ICON_HEART.repeat(HEART_TOTAL);
}

/** Render the current item. Only the public fields id / name / imageKey exist. */
function renderWaste(item) {
  state.currentItem = item ?? null;
  if (!item) return;

  dom.wasteName.textContent = item.name;
  dom.wasteKicker.textContent = `Waste item #${item.id}`;
  dom.wasteImage.classList.remove("is-missing");
  dom.wasteImage.alt = `Illustration of ${item.name}`;
  dom.wasteImage.src = imageUrl(item.imageKey);

  // Missing picture: fall back to the placeholder, keep the name visible (§11).
  dom.wasteImage.onerror = () => {
    if (state.currentItem?.id !== item.id) return;
    dom.wasteImage.onerror = null;
    dom.wasteImage.classList.add("is-missing");
    dom.wasteImage.src = PLACEHOLDER_IMAGE;
  };
}

/** HUD always mirrors the numbers the backend returned (§2, §8). */
function updateHUD(score, health) {
  if (typeof score === "number") {
    if (state.score !== score) {
      dom.hudScore.textContent = String(score);
      dom.hudScore.classList.remove("is-bumped");
      void dom.hudScore.offsetWidth;
      dom.hudScore.classList.add("is-bumped");
    }
    state.score = score;
  }

  if (typeof health === "number") {
    const clamped = Math.max(0, Math.min(HEART_TOTAL, health));
    const lostHeart = clamped < state.health;
    state.health = clamped;

    dom.hudHealth.querySelectorAll(".heart").forEach((heart, index) => {
      heart.classList.toggle("is-lost", index >= clamped);
    });
    dom.hudHealth.setAttribute("aria-label", `Health: ${clamped} of ${HEART_TOTAL}`);
    dom.hudHealth.classList.toggle("is-hit", lostHeart);
    setTimeout(() => dom.hudHealth.classList.remove("is-hit"), 450);
  }
}

function preloadImage(imageKey) {
  if (!imageKey) return;
  const image = new Image();
  image.src = imageUrl(imageKey);
}

// -------------------------------------------------------------- feedback view

/**
 * Show the feedback for the answer the backend just graded.
 * @param {object} data answer response from §8
 */
function showFeedback(data) {
  const correct = Boolean(data.correct);
  const categoryLabel = labelForCategory(data.correctCategory);

  dom.feedbackCard.dataset.correct = String(correct);
  dom.feedbackIcon.innerHTML = correct ? ICON_CHECK : ICON_CROSS;
  dom.feedbackTitle.textContent = correct ? "Correct!" : "Not Quite!";
  dom.feedbackSub.textContent = correct ? "+10 Points" : "−1 Heart";
  dom.feedbackAnswer.innerHTML = correct
    ? `It belongs in <strong>${escapeHtml(categoryLabel)}</strong>.`
    : `Correct Answer: <strong>${escapeHtml(categoryLabel)}</strong>`;
  dom.feedbackTip.textContent = data.ecoTip ?? "";
  dom.continueBtn.textContent = data.gameOver ? "See Results" : "Continue";
  dom.continueBtn.disabled = true;
  dom.feedbackLayer.hidden = false;

  // Keep the feedback readable for at least FEEDBACK_MIN_MS, then allow Continue.
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    dom.continueBtn.disabled = false;
    dom.continueBtn.focus();
  }, FEEDBACK_MIN_MS);
}

function hideFeedback() {
  clearTimeout(feedbackTimer);
  dom.feedbackLayer.hidden = true;
}

function hasFeedbackOpen() {
  return !dom.feedbackLayer.hidden;
}

// ------------------------------------------------------------------ game flow

async function startGame() {
  if (state.isSubmitting) return;

  hideFeedback();
  hideToast();

  state.isSubmitting = true;
  state.token += 1;
  const token = state.token;

  setBusy(dom.startBtn, true, "STARTING…");
  setBusy(dom.playAgainBtn, true, "STARTING…");

  try {
    const data = assertStartResponse(await api.start());
    if (token !== state.token) return; // a newer game already replaced this one

    state.gameId = data.gameId;
    state.health = HEART_TOTAL;
    state.pendingAnswer = null;

    updateHUD(data.score, data.health);
    renderWaste(data.item);
    setAnswersLabel("Choose the right bin");
    setBinsEnabled(true);
    showScreen("game");
    dom.binGrid.querySelector("button")?.focus();
  } catch (error) {
    if (token !== state.token) return;
    const info = describeError(error);
    showToast({
      title: info.title,
      message: info.message,
      actionLabel: info.restart ? "Try again" : "",
      onAction: info.restart ? () => startGame() : null
    });
  } finally {
    if (token === state.token) {
      state.isSubmitting = false;
      setBusy(dom.startBtn, false, "STARTING…");
      setBusy(dom.playAgainBtn, false, "STARTING…");
    }
  }
}

/**
 * Send one answer. Only { gameId, answer } leaves the browser (§8).
 * @param {string} answer one of the four API values
 * @param {HTMLElement|null} sourceButton for focus restore after a rejection
 */
async function submitAnswer(answer, sourceButton = null) {
  if (state.isSubmitting || !state.gameId || hasFeedbackOpen()) return;

  state.isSubmitting = true;
  state.lastFocusedBin = sourceButton;
  const token = state.token;
  const gameId = state.gameId;

  // Lock the bins for the request AND the feedback period (§12).
  setBinsEnabled(false);
  setAnswersLabel("Sending answer…");

  try {
    const data = assertAnswerResponse(await api.answer(gameId, answer));
    if (token !== state.token) return; // stale response from an older game

    updateHUD(data.score, data.health);
    state.pendingAnswer = data;
    showFeedback(data);
    preloadImage(data.nextItem?.imageKey);
    setAnswersLabel("Answer sent");
  } catch (error) {
    if (token !== state.token) return;
    const info = describeError(error);

    if (info.restart) {
      // Includes "result not confirmed": never resend the answer (§12).
      setAnswersLabel("Game stopped");
      setBinsEnabled(false);
      showToast({
        title: info.title,
        message: info.message,
        actionLabel: "New game",
        onAction: () => startGame()
      });
    } else {
      setAnswersLabel("Choose the right bin");
      setBinsEnabled(true);
      showToast({ title: info.title, message: info.message });
      (state.lastFocusedBin ?? dom.binGrid.querySelector("button"))?.focus();
    }
  } finally {
    if (token === state.token) state.isSubmitting = false;
  }
}

/** Continue button: either show the next item or move to RESULT (§9). */
function advance() {
  const pending = state.pendingAnswer;
  state.pendingAnswer = null;
  hideFeedback();

  if (!pending) {
    setAnswersLabel("Choose the right bin");
    setBinsEnabled(Boolean(state.gameId));
    return;
  }

  if (pending.gameOver) {
    showGameOver(pending);
    return;
  }

  renderWaste(pending.nextItem);
  setAnswersLabel("Choose the right bin");
  setBinsEnabled(true);
  dom.binGrid.querySelector("button")?.focus();
}

function showGameOver(data) {
  const stats = data.stats ?? {};

  dom.resultScore.textContent = String(data.score ?? 0);
  dom.statCorrect.textContent = String(stats.correctAnswers ?? 0);
  dom.statWrong.textContent = String(stats.wrongAnswers ?? 0);
  dom.statAccuracy.textContent = `${Number(stats.accuracy ?? 0)}%`;
  dom.resultNote.textContent = noteForAccuracy(Number(stats.accuracy ?? 0));

  state.gameId = null;
  state.currentItem = null;
  setAnswersLabel("Game over");
  setBinsEnabled(false);
  showScreen("result");
  dom.playAgainBtn.focus();
}

function noteForAccuracy(accuracy) {
  if (accuracy >= 100) return "Perfect run — nothing got past you.";
  if (accuracy >= 80) return "Great sorting! You know your bins well.";
  if (accuracy >= 50) return "Solid start. Check the Eco Tips and try again for a higher score.";
  return "Recycling takes practice. Play again and read each Eco Tip.";
}

function goHome() {
  hideFeedback();
  hideToast();
  state.token += 1;
  state.gameId = null;
  state.currentItem = null;
  state.pendingAnswer = null;
  state.isSubmitting = false;
  setBinsEnabled(false);
  showScreen("home");
  dom.startBtn.focus();
}

// ------------------------------------------------------------------ keyboard

function focusBin(offset) {
  const buttons = [...dom.binGrid.querySelectorAll("button")];
  if (!buttons.length) return;
  const current = buttons.indexOf(document.activeElement);
  const start = current === -1 ? 0 : current;
  const next = (start + offset + buttons.length) % buttons.length;
  buttons[next].focus();
}

function onKeydown(event) {
  if (event.defaultPrevented) return;
  const activeIsButton = document.activeElement?.tagName === "BUTTON";

  if (state.screen === "game") {
    if (hasFeedbackOpen()) {
      if (event.key === "Enter" && !dom.continueBtn.disabled && !activeIsButton) {
        event.preventDefault();
        advance();
      }
      return;
    }

    if (state.isSubmitting) return;

    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= BINS.length) {
      event.preventDefault();
      const button = dom.binGrid.querySelectorAll("button")[digit - 1];
      button?.focus();
      submitAnswer(BINS[digit - 1].value, button ?? null);
      return;
    }

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusBin(1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusBin(-1);
        break;
      case "ArrowDown":
        event.preventDefault();
        focusBin(2);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusBin(-2);
        break;
      case "Home":
        event.preventDefault();
        dom.binGrid.querySelector("button")?.focus();
        break;
      case "End":
        event.preventDefault();
        focusBin(-1);
        break;
      default:
        break;
    }
    return;
  }

  if (activeIsButton) return;

  if (event.key === "Enter" && (state.screen === "home" || state.screen === "result")) {
    event.preventDefault();
    startGame();
  }
}

// ---------------------------------------------------------------------- wiring

function wireEvents() {
  dom.startBtn.addEventListener("click", () => startGame());
  dom.playAgainBtn.addEventListener("click", () => startGame());
  dom.homeBtn.addEventListener("click", () => goHome());
  dom.continueBtn.addEventListener("click", () => advance());
  dom.toastClose.addEventListener("click", () => hideToast());
  dom.toastAction.addEventListener("click", () => {
    const action = onToastAction;
    hideToast();
    action?.();
  });

  // One delegated listener keeps the bin buttons free of inline handlers (§12).
  dom.binGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button || button.disabled) return;
    submitAnswer(button.dataset.value, button);
  });

  document.addEventListener("keydown", onKeydown);
}

function init() {
  renderStaticContent();
  wireEvents();
  setBinsEnabled(false);
  showScreen("home");
}

init();
