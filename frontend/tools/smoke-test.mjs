/* =============================================================================
   smoke-test.mjs — walks the whole frontend flow in a real browser and writes
   screenshots for the demo evidence (spec §15: 测试与完善 / 演示与留证).

   Usage:
     1. start the local server:   python -m http.server 5500   (or start_web.bat)
     2. npm install playwright-core
     3. node tools/smoke-test.mjs

   It uses the installed Chrome/Edge, so no browser download is required.
   Screenshots land in tools/screenshots/.
   ========================================================================== */

import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createStubServer } from "./dev-stub-server.mjs";

const require = createRequire(import.meta.url);

let chromium;
try {
  ({ chromium } = require("playwright-core"));
} catch {
  console.error("This script needs playwright-core. Run:  npm install playwright-core");
  process.exit(1);
}

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:5500/index.html";
const here = path.dirname(fileURLToPath(import.meta.url));
const shotDir = path.resolve(here, "screenshots");

const BROWSER_CANDIDATES = [
  process.env.BROWSER_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);

const results = [];
const record = (ok, label, detail = "") => {
  results.push({ ok, label, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

async function launchBrowser() {
  for (const executablePath of BROWSER_CANDIDATES) {
    try {
      return await chromium.launch({ executablePath, headless: true });
    } catch {
      // try the next candidate
    }
  }
  throw new Error("No Chrome or Edge executable found. Set BROWSER_PATH.");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(check, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await check()) return true;
    if (Date.now() > deadline) return false;
    await sleep(80);
  }
}

async function main() {
  await mkdir(shotDir, { recursive: true });
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));
  page.on("requestfailed", (request) => consoleErrors.push(`request failed: ${request.url()}`));

  // Small pause so entry animations have finished in the saved screenshots.
  const shot = async (name) => {
    await sleep(450);
    await page.screenshot({ path: path.join(shotDir, `${name}.png`) });
  };
  const text = (selector) => page.locator(selector).innerText();
  const hud = async () => ({
    score: Number(await text("#hud-score")),
    health: await page.locator("#hud-health").getAttribute("aria-label")
  });
  const bin = (value) => page.locator(`.bin[data-value="${value}"]`);

  // ---------------------------------------------------------------- HOME
  await page.goto(BASE, { waitUntil: "load" });
  record(!(await page.locator("#offline-warning").isVisible()), "HOME: no file:// warning over HTTP");
  record((await text("#home-title")) === "Waste Sorting Challenge", "HOME: title");
  record(
    (await text(".disclaimer")).includes("simplified four-category"),
    "HOME: simplified-classification disclaimer"
  );
  record((await page.locator("#category-list-home li").count()) === 4, "HOME: four bins listed");
  await shot("01-home");

  // ---------------------------------------------------------------- GAME
  await page.locator("#start-btn").click();
  record(await waitFor(async () => !(await page.locator("#screen-game").isHidden())), "GAME: entered");
  record((await text("#waste-name")) === "Button Battery", "GAME: first item rendered");
  record(
    (await page.locator("#waste-image").getAttribute("src")).endsWith("button_battery.png"),
    "GAME: image path uses imageKey"
  );
  const startHud = await hud();
  record(startHud.score === 0 && startHud.health === "Health: 3 of 3", "GAME: starts at 0 points, 3 hearts", JSON.stringify(startHud));
  record((await page.locator(".bin").count()) === 4, "GAME: four bin buttons");
  record((await page.locator(".bin:disabled").count()) === 0, "GAME: bins enabled after start");
  await shot("02-game");

  // -------------------------------------------------- locking and feedback
  await bin("recyclable").click();
  record(await waitFor(async () => (await page.locator(".bin:disabled").count()) === 4, 1000), "GAME: bins locked during request and feedback");
  record(await waitFor(async () => !(await page.locator("#feedback-layer").isHidden())), "GAME: feedback shown");
  record((await text("#feedback-title")) === "Correct!", "FEEDBACK: Correct!");
  record((await text("#feedback-sub")) === "+10 Points", "FEEDBACK: +10 Points");
  record(
    (await text("#feedback-tip")).includes("Batteries should be collected separately"),
    "FEEDBACK: Eco Tip from the response"
  );
  record(await page.locator("#continue-btn").isDisabled(), "FEEDBACK: Continue locked for the first 1.5 s");
  const afterCorrect = await hud();
  record(afterCorrect.score === 10 && afterCorrect.health === "Health: 3 of 3", "FEEDBACK: HUD uses returned score/health", JSON.stringify(afterCorrect));
  await shot("03-feedback-correct");

  record(await waitFor(async () => !(await page.locator("#continue-btn").isDisabled()), 4000), "FEEDBACK: Continue unlocks after 1.5 s");
  await page.locator("#continue-btn").click();
  record(await waitFor(async () => (await text("#waste-name")) === "Banana Peel"), "GAME: next item after Continue");
  record((await page.locator(".bin:disabled").count()) === 0, "GAME: bins re-enabled for the next item");

  // keyboard path: press 2 to answer
  await page.keyboard.press("2");
  record(await waitFor(async () => !(await page.locator("#feedback-layer").isHidden())), "KEYBOARD: number keys answer");
  await waitFor(async () => !(await page.locator("#continue-btn").isDisabled()), 4000);
  await page.locator("#continue-btn").click();

  // ----------------------------------------------------- wrong answer scene
  await page.goto(`${BASE}?scene=wrong`, { waitUntil: "load" });
  await page.locator("#start-btn").click();
  await waitFor(async () => !(await page.locator("#screen-game").isHidden()));
  await bin("kitchen").click();
  record(await waitFor(async () => !(await page.locator("#feedback-layer").isHidden())), "WRONG: feedback shown");
  record((await text("#feedback-title")) === "Not Quite!", "WRONG: Not Quite!");
  record((await text("#feedback-sub")) === "−1 Heart", "WRONG: heart loss shown");
  record((await text("#feedback-answer")).includes("Hazardous Waste"), "WRONG: correct answer named");
  const wrongHud = await hud();
  record(wrongHud.score === 0 && wrongHud.health === "Health: 2 of 3", "WRONG: HUD follows the response", JSON.stringify(wrongHud));
  await shot("04-feedback-wrong");

  // --------------------------------------------------------- game over scene
  await page.goto(`${BASE}?scene=gameover`, { waitUntil: "load" });
  await page.locator("#start-btn").click();
  await waitFor(async () => !(await page.locator("#screen-game").isHidden()));
  await bin("other").click();
  await waitFor(async () => !(await page.locator("#feedback-layer").isHidden()));
  record((await text("#continue-btn")) === "See Results", "GAME OVER: feedback first, button says See Results");
  await waitFor(async () => !(await page.locator("#continue-btn").isDisabled()), 4000);
  await page.locator("#continue-btn").click();
  record(await waitFor(async () => !(await page.locator("#screen-result").isHidden())), "RESULT: reached after the last feedback");
  const stats = {
    score: await text("#result-score"),
    correct: await text("#stat-correct"),
    wrong: await text("#stat-wrong"),
    accuracy: await text("#stat-accuracy")
  };
  record(
    stats.score === "120" && stats.correct === "12" && stats.wrong === "3" && stats.accuracy === "80%",
    "RESULT: final score and stats",
    JSON.stringify(stats)
  );
  await shot("05-result");

  // Play Again starts a brand new session
  await page.locator("#play-again-btn").click();
  record(await waitFor(async () => !(await page.locator("#screen-game").isHidden())), "RESULT: PLAY AGAIN starts a new game");
  const againHud = await hud();
  record(againHud.score === 0 && againHud.health === "Health: 3 of 3", "RESULT: new game resets the HUD", JSON.stringify(againHud));

  // ------------------------------------------------------------ error scenes
  await page.goto(`${BASE}?scene=invalid-category`, { waitUntil: "load" });
  await page.locator("#start-btn").click();
  await waitFor(async () => !(await page.locator("#screen-game").isHidden()));
  await bin("other").click();
  record(await waitFor(async () => !(await page.locator("#toast").isHidden())), "ERROR 400: toast shown");
  record((await text("#toast-title")) === "That answer was not accepted", "ERROR 400: input-rejected title");
  const rejectedHud = await hud();
  record(rejectedHud.score === 0 && rejectedHud.health === "Health: 3 of 3", "ERROR 400: HUD unchanged", JSON.stringify(rejectedHud));
  record((await page.locator(".bin:disabled").count()) === 0, "ERROR 400: player may answer the same question again");
  await shot("06-error-invalid-category");

  await page.goto(`${BASE}?scene=invalid-game`, { waitUntil: "load" });
  await page.locator("#start-btn").click();
  await waitFor(async () => !(await page.locator("#screen-game").isHidden()));
  await bin("other").click();
  record(await waitFor(async () => !(await page.locator("#toast").isHidden())), "ERROR 404: toast shown");
  record((await text("#toast-title")) === "Game session not found", "ERROR 404: restart guidance");
  record(await page.locator("#toast-action").isVisible(), "ERROR 404: offers a New game action");
  await shot("07-error-invalid-game");

  // -------------------------------------------------- live API path (stub)
  const stub = createStubServer();
  await stub.listen(8080);

  const health = await (await fetch("http://127.0.0.1:8080/api/health")).json();
  record(health.status === "ok", "LIVE: GET /api/health answers ok");

  await page.goto(`${BASE}?api=live`, { waitUntil: "load" });
  record((await text("#mode-badge")) === "Live API", "LIVE: USE_MOCK switched off by ?api=live");
  await page.locator("#start-btn").click();
  record(await waitFor(async () => !(await page.locator("#screen-game").isHidden())), "LIVE: POST /game/start");
  record((await text("#waste-name")) === "Button Battery", "LIVE: first item from the server");
  await bin("hazardous").click();
  record(await waitFor(async () => !(await page.locator("#feedback-layer").isHidden())), "LIVE: POST /game/answer");
  record((await text("#feedback-title")) === "Correct!", "LIVE: server judged the answer as correct");
  record(stub.stats.preflight >= 1, "LIVE: browser sent the CORS preflight", `OPTIONS count ${stub.stats.preflight}`);
  record(stub.stats.answer === 1, "LIVE: exactly one answer request reached the server", `count ${stub.stats.answer}`);
  await shot("08-live-api");

  await waitFor(async () => !(await page.locator("#continue-btn").isDisabled()), 4000);
  await page.locator("#continue-btn").click();

  // Backend restart in the middle of a game → INVALID_GAME_ID → restart advice.
  stub.dropSessions();
  await bin("recyclable").click();
  record(await waitFor(async () => !(await page.locator("#toast").isHidden())), "LIVE 404: session loss is reported");
  record((await text("#toast-title")) === "Game session not found", "LIVE 404: restart guidance shown");
  record(await page.locator("#toast-action").isVisible(), "LIVE 404: New game action offered");
  await stub.close();

  // ------------------------------------------------------------- responsive
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "load" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  record(overflow <= 1, "MOBILE: no horizontal scrolling", `overflow ${overflow}px`);
  await page.locator("#start-btn").click();
  await waitFor(async () => !(await page.locator("#screen-game").isHidden()));
  const columns = await page.evaluate(
    () => getComputedStyle(document.getElementById("bin-grid")).gridTemplateColumns.split(" ").length
  );
  record(columns === 1, "MOBILE: bins stack in a single column", `${columns} column(s)`);
  record((await text("#waste-name")).length > 0, "MOBILE: item name still readable");
  await shot("09-mobile-game");

  // ---------------------------------------------------------------- summary
  // The session-loss check above deliberately triggers one 404, which the
  // browser reports as a console error; everything else must be clean.
  const unexpectedErrors = consoleErrors.filter((message) => !/status of 404/.test(message));
  record(
    unexpectedErrors.length === 0,
    "No unexpected console or network errors",
    unexpectedErrors.slice(0, 3).join(" | ") ||
      `${consoleErrors.length} expected 404 from the session-loss check`
  );

  const failed = results.filter((entry) => !entry.ok);
  await browser.close();

  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  console.log(`Screenshots: ${shotDir}`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
