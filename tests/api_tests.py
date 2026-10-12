import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8080/api"
results = []


def call(method, path, body=None, content_type="application/json", raw=None):
    url = BASE + path
    data = None
    if raw is not None:
        data = raw.encode("utf-8")
    elif body is not None:
        data = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(url, data=data, method=method)
    if data is not None and content_type is not None:
        request.add_header("Content-Type", content_type)
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, dict(response.headers), response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers), error.read().decode("utf-8")


def check(name, condition, detail=""):
    results.append((name, condition))
    print(("PASS  " if condition else "FAIL  ") + name + ("   " + detail if detail else ""))


status, headers, body = call("GET", "/health")
check("GET /api/health is 200", status == 200, f"status={status} body={body.strip()}")
check("health body is {status: ok}", json.loads(body) == {"status": "ok"}, body.strip())
check("health sets the CORS header", headers.get("Access-Control-Allow-Origin") == "*")

status, headers, body = call("POST", "/game/start")
start = json.loads(body)
check("POST /api/game/start is 200", status == 200, f"status={status}")
check("start exposes only id, name, imageKey",
      set(start["item"].keys()) == {"id", "name", "imageKey"},
      str(sorted(start["item"].keys())))
check("start begins at score 0, health 3",
      start["score"] == 0 and start["health"] == 3,
      f"score={start['score']} health={start['health']}")
check("start leaks no category or ecoTip",
      "category" not in json.dumps(start) and "ecoTip" not in json.dumps(start))

game_id = start["gameId"]

status, headers, body = call("POST", "/game/answer", {"gameId": game_id, "answer": "recyclable"})
answer = json.loads(body)
check("POST /api/game/answer is 200", status == 200, f"status={status}")
check("answer response carries the documented fields",
      set(answer.keys()) >= {"correct", "correctCategory", "score", "health", "ecoTip",
                             "gameOver", "stats"},
      str(sorted(answer.keys())))
check("stats follow the formulas",
      answer["stats"]["totalAnswers"] == answer["stats"]["correctAnswers"] + answer["stats"]["wrongAnswers"]
      and answer["score"] == answer["stats"]["correctAnswers"] * 10
      and answer["health"] == 3 - answer["stats"]["wrongAnswers"],
      json.dumps(answer["stats"]))

guard = 0
missing_next = 0
while (not answer["gameOver"]) and guard < 60:
    guard += 1
    status, headers, body = call("POST", "/game/answer", {"gameId": game_id, "answer": "recyclable"})
    answer = json.loads(body)
    if (not answer["gameOver"]) and ("nextItem" not in answer):
        missing_next += 1
check("a game ends within 60 answers", answer["gameOver"], f"extra answers sent={guard}")
check("every non-final response includes nextItem", missing_next == 0, f"missing={missing_next}")
check("final response omits nextItem", "nextItem" not in answer, str(sorted(answer.keys())))
check("final health is 0", answer["health"] == 0, f"health={answer['health']}")

status, headers, body = call("POST", "/game/answer", {"gameId": game_id, "answer": "other"})
check("answering a finished game is 409 GAME_ALREADY_OVER",
      status == 409 and json.loads(body).get("code") == "GAME_ALREADY_OVER",
      f"status={status} body={body.strip()}")

status, headers, body = call("POST", "/game/answer", {"gameId": "game-nope", "answer": "other"})
check("unknown gameId is 404 INVALID_GAME_ID",
      status == 404 and json.loads(body).get("code") == "INVALID_GAME_ID", f"status={status}")

status, headers, body = call("POST", "/game/answer", {"gameId": game_id, "answer": "food"})
message = json.loads(body)
check("invalid category is 400 INVALID_CATEGORY",
      status == 400 and message.get("code") == "INVALID_CATEGORY", f"status={status}")
check("invalid category uses the fixed message",
      message.get("message") == "Answer must be recyclable, kitchen, hazardous or other.",
      str(message.get("message")))

status, headers, body = call("POST", "/game/answer", raw="{not json")
check("unparseable body is 400 INVALID_JSON",
      status == 400 and json.loads(body).get("code") == "INVALID_JSON", f"status={status}")

status, headers, body = call("POST", "/game/answer",
                             {"gameId": game_id, "answer": "other", "score": 999})
check("extra fields are 400 INVALID_REQUEST",
      status == 400 and json.loads(body).get("code") == "INVALID_REQUEST", f"status={status}")

status, headers, body = call("POST", "/game/answer", {"gameId": game_id, "answer": "other"},
                             content_type="text/plain")
check("wrong content type is 415 UNSUPPORTED_MEDIA_TYPE",
      status == 415 and json.loads(body).get("code") == "UNSUPPORTED_MEDIA_TYPE",
      f"status={status}")

status, headers, body = call("OPTIONS", "/game/answer", content_type=None, raw="")
check("OPTIONS preflight is 204", status == 204, f"status={status}")
check("preflight carries the three CORS headers",
      headers.get("Access-Control-Allow-Origin") == "*"
      and "POST" in (headers.get("Access-Control-Allow-Methods") or "")
      and "content-type" in (headers.get("Access-Control-Allow-Headers") or "").lower(),
      f"methods={headers.get('Access-Control-Allow-Methods')}")

status, headers, body = call("GET", "/nope")
check("undefined route is 400 INVALID_REQUEST",
      status == 400 and json.loads(body).get("code") == "INVALID_REQUEST", f"status={status}")

status, headers, body = call("POST", "/game/start")
second = json.loads(body)
check("a second game gets its own id and fresh state",
      second["gameId"] != game_id and second["score"] == 0 and second["health"] == 3,
      f"{game_id} vs {second['gameId']}")

failed = [name for name, ok in results if not ok]
print()
print(f"{len(results) - len(failed)} / {len(results)} checks passed")
if failed:
    print("failed: " + "; ".join(failed))
    sys.exit(1)
