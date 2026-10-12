# Waste Sorting Challenge — frontend

The browser half of the Week 5 Green Tech Hackathon project, built to
specification V1.0 §11–§14. Plain HTML, CSS and JavaScript: no framework, no
build step, no dependencies to install.

```
frontend/
├── index.html            HOME / GAME / RESULT markup (spec §11)
├── style.css             palette, layout, responsive rules, feedback styles
├── game.js               screen state, rendering, keyboard, flow (§12)
├── api.js                the only place that talks to the backend (§7, §8, §10)
├── mocks/                fixed JSON scenes for backend-free development (§13)
├── assets/waste/         24 PNG illustrations + _placeholder.png (§3, §11)
├── tools/                art source, asset renderer, browser smoke test
└── start_web.bat         serve this folder on http://localhost:5500
```

## Run it

Double-click **`start_web.bat`**, then open <http://localhost:5500>.

The page must be served over HTTP — opening `index.html` directly shows a
warning instead of the game, because ES modules and `fetch` are blocked on
`file://` URLs (spec §10).

Any static server works, for example:

```
python -m http.server 5500
npx serve -l 5500 .
```

## Mock mode and the real backend

`api.js` holds the only two switches that matter:

```js
export const API_BASE = "http://localhost:8080/api";
export const USE_MOCK  = true;   // false = talk to the C++ backend
```

While `USE_MOCK` is `true` the app replays the fixed scenes in `mocks/`. Add
`?scene=` to the URL to check a specific scripted outcome without editing code:

| URL | Shows |
| --- | --- |
| `index.html?scene=correct` | `Correct!`, +10 points, Eco Tip, next item |
| `index.html?scene=wrong` | `Not Quite!`, correct category, −1 heart |
| `index.html?scene=gameover` | last feedback, then the RESULT screen |
| `index.html?scene=invalid-category` | HTTP 400 handling, no HUD change |
| `index.html?scene=invalid-game` | HTTP 404 handling, restart guidance |

Before integration (spec §13): set `USE_MOCK = false`, make sure the backend is
on `http://localhost:8080`, and confirm `GET /api/health` answers first. The
frontend never keeps a copy of the answer bank — categories, Eco Tips and every
score live in C++.

## Controls

| Input | Action |
| --- | --- |
| Click a bin, or press <kbd>1</kbd>–<kbd>4</kbd> | Answer the current item |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd>, then <kbd>Enter</kbd> | Move focus between bins and answer |
| <kbd>Enter</kbd> on HOME / RESULT | Start or restart the game |

Answer buttons are locked from the moment a request starts until the next item
is on screen, so double clicks cannot send two answers (spec §12).

## Behaviour the frontend guarantees (spec §10, §12)

- Only `{ gameId, answer }` is ever sent to `POST /game/answer`.
- `score`, `health` and `stats` are displayed exactly as returned; the browser
  never adds 10 points or removes a heart itself.
- `nextItem` is shown only after the feedback for the finished item, and the
  feedback stays on screen for at least 1.5 s before Continue appears.
- A timeout, network failure, unreadable body or HTTP 500 means **result not
  confirmed**: the answer is never resent automatically, and the player is
  offered a new game instead.
- `INVALID_JSON`, `INVALID_REQUEST`, `INVALID_CATEGORY` and
  `UNSUPPORTED_MEDIA_TYPE` keep the current question playable;
  `INVALID_GAME_ID` and `GAME_ALREADY_OVER` ask for a restart.
- Responses from a game that was replaced by a newer one are ignored.

## Artwork

`assets/waste/<imageKey>.png` — 512 × 512, transparent, flat vector, soft
shadow, one file per `imageKey` from the data table. The placeholder
`_placeholder.png` appears whenever a file is missing, and the item name stays
visible.

To redraw them: edit `tools/waste-art.mjs`, then

```
npm install sharp
node tools/render-assets.mjs
```

Member 3 can drop real illustrations over the same file names at any time; no
code changes are needed.

## Browser smoke test

Walks the whole flow in headless Chrome and saves screenshots to
`tools/screenshots/`:

```
python -m http.server 5500      # in another window
npm install playwright-core
node tools/smoke-test.mjs
```

Current status: 53 / 53 checks pass, no unexpected console or network errors.

## Checking the live path before the C++ server exists

`tools/dev-stub-server.mjs` is a throwaway Node stub of the three routes, with
CORS headers and the §10 error shape. It is **not** the deliverable backend and
it is not the answer bank — it only ships four sample items.

```
python -m http.server 5500               # window 1
node tools/dev-stub-server.mjs           # window 2
# then open http://localhost:5500/index.html?api=live
```

`?api=live` points one visit at `http://localhost:8080/api` without touching
`USE_MOCK` in `api.js`, so the default demo stays on mocks.
