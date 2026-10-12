#include "service/GameService.h"

#include <cmath>
#include <vector>

#include "data/WasteData.h"
#include "model/GameError.h"

namespace {

PublicItem toPublicItem(const WasteItem& item) {
    PublicItem result;
    result.id = item.id;
    result.name = item.name;
    result.imageKey = item.imageKey;
    return result;
}

GameStats toStats(const GameSession& session) {
    GameStats stats;
    stats.correctAnswers = session.correctAnswers;
    stats.wrongAnswers = session.wrongAnswers;
    stats.totalAnswers = session.totalAnswers;
    stats.accuracy = GameService::calculateAccuracy(session);
    return stats;
}

}  // namespace

GameService::GameService() : rng_(std::random_device{}()) {}

bool GameService::isSupportedCategory(const std::string& value) {
    return value == "recyclable" || value == "kitchen" || value == "hazardous" ||
           value == "other";
}

double GameService::calculateAccuracy(const GameSession& session) {
    if (session.totalAnswers <= 0) return 0.0;
    const double raw = static_cast<double>(session.correctAnswers) /
                       static_cast<double>(session.totalAnswers) * 100.0;
    return std::round(raw * 10.0) / 10.0;
}

const WasteItem& GameService::drawWaste(int previousId) {
    const std::vector<WasteItem>& items = WasteData::allItems();

    // Every item not equal to the previous one has the same probability.
    std::vector<const WasteItem*> candidates;
    candidates.reserve(items.size());
    for (const WasteItem& item : items) {
        if (item.id != previousId) candidates.push_back(&item);
    }
    if (candidates.empty()) candidates.push_back(&items.front());

    std::uniform_int_distribution<size_t> distribution(0, candidates.size() - 1);
    return *candidates[distribution(rng_)];
}

std::string GameService::createGameId() {
    for (;;) {
        ++counter_;
        std::string candidate = "game-";
        const std::string digits = std::to_string(counter_);
        for (size_t i = digits.size(); i < 4; ++i) candidate.push_back('0');
        candidate += digits;
        if (sessions_.find(candidate) == sessions_.end()) return candidate;
    }
}

StartResult GameService::startGame() {
    std::lock_guard<std::mutex> lock(mutex_);

    GameSession session;
    session.gameId = createGameId();
    session.score = 0;
    session.health = 3;
    session.correctAnswers = 0;
    session.wrongAnswers = 0;
    session.totalAnswers = 0;
    session.currentWaste = drawWaste(0);

    StartResult result;
    result.gameId = session.gameId;
    result.score = session.score;
    result.health = session.health;
    result.item = toPublicItem(session.currentWaste);

    sessions_.emplace(session.gameId, session);
    return result;
}

AnswerResult GameService::submitAnswer(const std::string& gameId,
                                       const std::string& answer) {
    std::lock_guard<std::mutex> lock(mutex_);

    auto found = sessions_.find(gameId);
    if (found == sessions_.end()) {
        throw GameException({"INVALID_GAME_ID", "Game session does not exist."});
    }
    if (found->second.health <= 0) {
        throw GameException({"GAME_ALREADY_OVER", "This game is already over."});
    }

    // Work on a copy, then commit it, so a failure cannot leave half a change.
    GameSession session = found->second;
    const WasteItem answered = session.currentWaste;

    const bool correct = (answered.category == answer);
    if (correct) {
        session.correctAnswers += 1;
        session.score += 10;
    } else {
        session.wrongAnswers += 1;
        session.health = 3 - session.wrongAnswers;
        if (session.health < 0) session.health = 0;
    }
    session.totalAnswers = session.correctAnswers + session.wrongAnswers;

    AnswerResult result;
    result.correct = correct;
    result.correctCategory = answered.category;
    result.score = session.score;
    result.health = session.health;
    result.ecoTip = answered.ecoTip;
    result.gameOver = (session.health <= 0);
    result.stats = toStats(session);

    if (!result.gameOver) {
        const WasteItem& next = drawWaste(answered.id);
        session.currentWaste = next;
        result.hasNextItem = true;
        result.nextItem = toPublicItem(next);
    }

    found->second = session;
    return result;
}
