# Mock scenes

Fixed responses from specification V1.0, used while the C++ backend is not
running. Each scene replays one scripted outcome — it does **not** judge answers,
score points or pick random items. That logic only exists in the backend.

| File | Source in the spec | What the frontend must show |
| --- | --- | --- |
| `start.json` | §7 start response | First item, score 0, 3 hearts, no `category` or `ecoTip` |
| `answer-correct.json` | §8 scene A | `Correct!`, `+10 Points`, Eco Tip, next item |
| `answer-wrong.json` | §9 scene B | `Not Quite!`, correct category, `−1 Heart`, next item |
| `game-over.json` | §9 scene C | Feedback first, then RESULT with stats and **no** `nextItem` |
| `invalid-category.json` | §10 error shape, HTTP 400 | Input rejected, hearts and score unchanged |
| `invalid-game.json` | §10 error shape, HTTP 404 | "Game session not found", prompt to start a new game |

Pick a scene with `MOCK_SCENE` in `../api.js`, then reload the page:

```js
export const MOCK_SCENE = "wrong"; // "correct" | "wrong" | "gameover"
                                  // "invalid-category" | "invalid-game"
```

Or override it per visit without editing the file:

```
http://localhost:5500/index.html?scene=wrong
http://localhost:5500/index.html?scene=gameover
http://localhost:5500/index.html?scene=invalid-category
http://localhost:5500/index.html?scene=invalid-game
```

Switch `USE_MOCK` to `false` to talk to the real API at
`http://localhost:8080/api`.
