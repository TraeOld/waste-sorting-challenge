# Test report - Waste Sorting Challenge backend

Scope: the C++ API in `backend/`, driven over real HTTP by
`tests/api_tests.py`. The script starts nothing itself: build the backend, run
`run_backend.bat`, then run the script.

```
python tests/api_tests.py
```

## Result

```
25 / 25 checks passed
```

## What is covered

| Area | Check |
| --- | --- |
| Health | `GET /api/health` returns 200 and `{"status":"ok"}`, sets the CORS header, and creates no session |
| Start | `POST /api/game/start` returns 200 with `gameId`, `score` 0, `health` 3 |
| Contract | The question object exposes only `id`, `name` and `imageKey`; no `category`, `correctAnswer` or `ecoTip` is leaked |
| Answer | The response carries `correct`, `correctCategory`, `score`, `health`, `ecoTip`, `gameOver` and `stats` |
| Scoring | `totalAnswers = correctAnswers + wrongAnswers`, `score = correctAnswers * 10`, `health = 3 - wrongAnswers` hold on every response |
| Flow | Every non-final response includes `nextItem`; the final response omits it; a game ends within the expected number of answers |
| Game over | The final `health` is 0 and answering again returns `409 GAME_ALREADY_OVER` |
| Errors | `404 INVALID_GAME_ID`, `400 INVALID_CATEGORY` (with the fixed message), `400 INVALID_JSON`, `400 INVALID_REQUEST` for extra fields, `415 UNSUPPORTED_MEDIA_TYPE`, `400 INVALID_REQUEST` for an undefined route |
| CORS | `OPTIONS` preflight returns 204 with `Access-Control-Allow-Origin`, `-Methods` and `-Headers` |
| Sessions | A second game receives a different `gameId` and starts with fresh score and health |

## Notes

- The database is validated at start-up: 24 items, IDs 1-24, unique image keys,
  six items per category. The server refuses to start if the rules are broken.
- Sessions live in memory. Restarting the server ends every game, and a stale
  `gameId` then returns `404 INVALID_GAME_ID`, which the frontend turns into a
  restart prompt.
- The server prints one line per request, for example
  `POST /api/game/answer host=127.0.0.1:8080 origin=http://localhost:5500 -> 200`,
  so a demo or a test run leaves evidence that the browser really talked to the
  C++ backend.
