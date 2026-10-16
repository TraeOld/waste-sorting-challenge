# Waste Sorting Challenge

A browser game for the Week 5 Green Tech Hackathon. The player sorts randomly
generated waste into four bins and reads one environmental tip after every
answer. The C++ backend owns all game state, so the browser never decides a
score or a heart.

| | |
| --- | --- |
| Theme | Sustainability and Green Tech |
| Frontend | HTML, CSS, JavaScript (no framework, no build step) |
| Backend | C++17, cpp-httplib, nlohmann/json |
| Game rules | 24 items, four categories, 3 hearts, +10 per correct answer |

## Repository layout

```
frontend/     game screens, response handling, 24 illustrations, mock scenes, tooling
backend/      C++17 API: waste database, game service, HTTP layer
external/     cpp-httplib v0.57.1 and nlohmann/json v3.12.0, vendored for offline builds
tests/        api_tests.py - end-to-end checks against the running API
CMakeLists.txt, build_backend.bat, run_backend.bat
```

`ApiServer -> GameService -> GameSession / WasteData`. The service layer never
touches JSON or HTTP, and the answer key never leaves the server.

## Run it

1. Build the backend: double-click `build_backend.bat` (uses the MinGW g++ that
   ships with CodeBlocks and produces a self-contained .exe), or use CMake when a
   full toolchain is installed.
2. Start the API: double-click `run_backend.bat`. It listens on
   `http://127.0.0.1:8080/api` and prints one line per request.
3. Serve the frontend: double-click `frontend\start_web.bat`, which serves the
   folder on `http://localhost:5500`.
4. Play against the real backend:
   `http://localhost:5500/index.html?api=live`.
   Without `?api=live` the page replays the fixed mock scenes in
   `frontend/mocks/`, which is how the UI was developed before the API existed.

The server listens on the IPv4 and IPv6 loopback addresses. On Windows
`localhost` resolves to both `::1` and `127.0.0.1`, and a client that reaches
only one of them can stall until its request times out, which the game reports as
"Result not confirmed".

## Game rules

- Categories are `recyclable`, `kitchen`, `hazardous` and `other`, lower case and
  case sensitive in the API.
- A game starts at score 0 with 3 hearts. A correct answer adds 10 points; a
  wrong answer costs one heart. The game continues either way.
- `score = correctAnswers * 10`, `health = 3 - wrongAnswers`,
  `accuracy = correctAnswers / totalAnswers * 100` to one decimal place.
- Each question is drawn from the 24 items; the next question is never the same
  item as the previous one.
- When health reaches 0 the game ends and `nextItem` is omitted from the
  response. Answering again returns `409 GAME_ALREADY_OVER`.

## API

| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/health` | none |
| POST | `/api/game/start` | none |
| POST | `/api/game/answer` | `{"gameId": "...", "answer": "..."}` |
| OPTIONS | `/api/*` | none (204 preflight) |

Errors use `{"error":true,"code":"...","message":"..."}` with the codes
`INVALID_JSON`, `INVALID_REQUEST`, `INVALID_CATEGORY`, `INVALID_GAME_ID`,
`GAME_ALREADY_OVER`, `UNSUPPORTED_MEDIA_TYPE` and `INTERNAL_ERROR`.

## Tests

With the backend running:

```
python tests/api_tests.py
```

The script drives the real HTTP API and checks response shapes, the scoring
formulas, game-over behaviour, every error code, the CORS preflight and session
isolation. Current status: 25 / 25 checks pass. Details are in `TEST_REPORT.md`.

## Team and contributions

The group specification assigns one area per member. Names are added by each
member; the remaining rows can be filled in by the rest of the team.

| Member | Area | Delivered in this repository |
| --- | --- | --- |
| 1 - Hu Suyang | UI design and HOME screen | `frontend/style.css`, HOME screen |
| 2 | Game frontend and interaction | `frontend/game.js`, `frontend/index.html` |
| 3 | Waste data and artwork | 24 items and the PNG illustrations |
| 4 | Game logic | `backend/model/`, `backend/data/`, `backend/service/` |
| 5 | API and integration | `backend/api/`, `frontend/api.js` |
| 6 | Testing and demo | `tests/api_tests.py`, `TEST_REPORT.md`, demo materials |

## Artwork and data sources

The 24 illustrations in `frontend/assets/waste/` follow the flat vector style of
`frontend/tools/waste-art.mjs` and are rendered to PNG by
`frontend/tools/render-assets.mjs`; no third-party images are bundled. The waste
names, categories and environmental tips come from the group's V1.0
specification. The game uses a simplified four-category model for educational
purposes and does not replace local collection rules.

