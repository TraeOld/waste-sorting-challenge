#include "api/ApiServer.h"

#include <algorithm>
#include <cctype>
#include <iostream>
#include <string>

#include "httplib.h"
#include "json.hpp"
#include "model/GameError.h"

using json = nlohmann::json;

namespace {

const char* kInvalidCategoryMessage =
    "Answer must be recyclable, kitchen, hazardous or other.";

void applyCors(httplib::Response& response) {
    response.set_header("Access-Control-Allow-Origin", "*");
    response.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.set_header("Access-Control-Allow-Headers", "Content-Type");
}

void sendJson(httplib::Response& response, int status, const json& body) {
    response.status = status;
    response.set_content(body.dump(), "application/json; charset=utf-8");
    applyCors(response);
}

void sendError(httplib::Response& response, int status, const std::string& code,
               const std::string& message) {
    json body;
    body["error"] = true;
    body["code"] = code;
    body["message"] = message;
    sendJson(response, status, body);
}

int statusForCode(const std::string& code) {
    if (code == "INVALID_GAME_ID") return 404;
    if (code == "GAME_ALREADY_OVER") return 409;
    return 400;
}

std::string lowerCase(std::string value) {
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });
    return value;
}

// Accepts "application/json" with any optional parameters, case-insensitively.
bool isJsonContentType(const std::string& header) {
    if (header.empty()) return false;
    const std::string lowered = lowerCase(header);
    const size_t separator = lowered.find(';');
    const std::string mediaType =
        separator == std::string::npos ? lowered : lowered.substr(0, separator);
    std::string trimmed = mediaType;
    while (!trimmed.empty() && std::isspace(static_cast<unsigned char>(trimmed.front()))) {
        trimmed.erase(trimmed.begin());
    }
    while (!trimmed.empty() && std::isspace(static_cast<unsigned char>(trimmed.back()))) {
        trimmed.pop_back();
    }
    return trimmed == "application/json";
}

json publicItemJson(const PublicItem& item) {
    json body;
    body["id"] = item.id;
    body["name"] = item.name;
    body["imageKey"] = item.imageKey;
    return body;
}

}  // namespace

ApiServer::ApiServer(GameService& service)
    : service_(service),
      server_(new httplib::Server()),
      server6_(new httplib::Server()) {
    registerRoutes(*server_);
    registerRoutes(*server6_);
}

ApiServer::~ApiServer() = default;

void ApiServer::registerRoutes(httplib::Server& server) {
    // Every response, including errors, carries the CORS headers of section 10.
    server.set_post_routing_handler([](const httplib::Request&, httplib::Response& response) {
        applyCors(response);
    });

    server.Get("/api/health",
               [this](const httplib::Request& request, httplib::Response& response) {
                   handleHealth(request, response);
               });

    // One line per request, so a demo or a test run leaves evidence that the
    // browser really talked to this server.
    server.set_logger([](const httplib::Request& request, const httplib::Response& response) {
        std::cout << request.method << " " << request.path << " host="
                  << request.get_header_value("Host") << " origin="
                  << request.get_header_value("Origin") << " -> " << response.status
                  << " allow-origin=" << response.get_header_value("Access-Control-Allow-Origin")
                  << std::endl;
    });

    server.Post("/api/game/start",
                [this](const httplib::Request& request, httplib::Response& response) {
                    handleStart(request, response);
                });

    server.Post("/api/game/answer",
                [this](const httplib::Request& request, httplib::Response& response) {
                    handleAnswer(request, response);
                });

    server.Options(R"(/api/.*)",
                   [this](const httplib::Request& request, httplib::Response& response) {
                       handleOptions(request, response);
                   });

    // Undefined paths and methods use the specification's own error code.
    // This handler runs for every error status, so a response that already
    // carries our JSON body is left untouched.
    server.set_error_handler([](const httplib::Request&, httplib::Response& response) {
        if (!response.body.empty()) return;
        sendError(response, 400, "INVALID_REQUEST",
                  "Request path or method is not defined by this API.");
    });

    server.set_exception_handler(
        [](const httplib::Request&, httplib::Response& response, std::exception_ptr ep) {
            std::string message = "Unexpected server error.";
            try {
                if (ep) std::rethrow_exception(ep);
            } catch (const std::exception& error) {
                message = "Unexpected server error.";
                (void)error;
            } catch (...) {
            }
            sendError(response, 500, "INTERNAL_ERROR", message);
        });
}

void ApiServer::handleHealth(const httplib::Request&, httplib::Response& response) {
    json body;
    body["status"] = "ok";
    sendJson(response, 200, body);
}

void ApiServer::handleStart(const httplib::Request&, httplib::Response& response) {
    try {
        const StartResult result = service_.startGame();
        json body;
        body["gameId"] = result.gameId;
        body["score"] = result.score;
        body["health"] = result.health;
        body["item"] = publicItemJson(result.item);
        sendJson(response, 200, body);
    } catch (const GameException& error) {
        sendError(response, statusForCode(error.error().code), error.error().code,
                  error.error().message);
    } catch (const std::exception&) {
        sendError(response, 500, "INTERNAL_ERROR", "Unexpected server error.");
    }
}

void ApiServer::handleAnswer(const httplib::Request& request, httplib::Response& response) {
    // Validation order: content type, JSON, fields, category, session, state.
    if (!isJsonContentType(request.get_header_value("Content-Type"))) {
        sendError(response, 415, "UNSUPPORTED_MEDIA_TYPE",
                  "Content-Type must be application/json.");
        return;
    }

    json payload;
    try {
        payload = json::parse(request.body);
    } catch (const std::exception&) {
        sendError(response, 400, "INVALID_JSON", "Request body is not valid JSON.");
        return;
    }

    if (!payload.is_object()) {
        sendError(response, 400, "INVALID_REQUEST",
                  "Request body must be a JSON object with gameId and answer.");
        return;
    }

    for (auto it = payload.begin(); it != payload.end(); ++it) {
        if (it.key() != "gameId" && it.key() != "answer") {
            sendError(response, 400, "INVALID_REQUEST",
                      "Only gameId and answer may be sent to this endpoint.");
            return;
        }
    }

    if (!payload.contains("gameId") || !payload["gameId"].is_string() ||
        payload["gameId"].get<std::string>().empty()) {
        sendError(response, 400, "INVALID_REQUEST", "gameId must be a non-empty string.");
        return;
    }

    if (!payload.contains("answer") || !payload["answer"].is_string()) {
        sendError(response, 400, "INVALID_REQUEST", "answer must be a string.");
        return;
    }

    const std::string answer = payload["answer"].get<std::string>();
    if (!GameService::isSupportedCategory(answer)) {
        sendError(response, 400, "INVALID_CATEGORY", kInvalidCategoryMessage);
        return;
    }

    const std::string gameId = payload["gameId"].get<std::string>();

    try {
        const AnswerResult result = service_.submitAnswer(gameId, answer);

        json stats;
        stats["correctAnswers"] = result.stats.correctAnswers;
        stats["wrongAnswers"] = result.stats.wrongAnswers;
        stats["totalAnswers"] = result.stats.totalAnswers;
        stats["accuracy"] = result.stats.accuracy;

        json body;
        body["correct"] = result.correct;
        body["correctCategory"] = result.correctCategory;
        body["score"] = result.score;
        body["health"] = result.health;
        body["ecoTip"] = result.ecoTip;
        body["gameOver"] = result.gameOver;
        body["stats"] = stats;
        if (result.hasNextItem) {
            body["nextItem"] = publicItemJson(result.nextItem);
        }
        sendJson(response, 200, body);
    } catch (const GameException& error) {
        sendError(response, statusForCode(error.error().code), error.error().code,
                  error.error().message);
    } catch (const std::exception&) {
        sendError(response, 500, "INTERNAL_ERROR", "Unexpected server error.");
    }
}

void ApiServer::handleOptions(const httplib::Request&, httplib::Response& response) {
    // A preflight is never a game action.
    response.status = 204;
    response.set_content("", "text/plain");
    applyCors(response);
}

bool ApiServer::listen(const std::string& host, int port) {
    // Serve ::1 as well: on Windows "localhost" resolves to both ::1 and
    // 127.0.0.1, and a browser that tries the IPv6 address first would
    // otherwise stall until its request times out.
    ipv6Thread_ = std::thread([this, port]() { server6_->listen("::1", port); });

    const bool ok = server_->listen(host.c_str(), port);

    server6_->stop();
    if (ipv6Thread_.joinable()) ipv6Thread_.join();
    return ok;
}

