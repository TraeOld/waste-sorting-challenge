#pragma once

#include <mutex>
#include <random>
#include <string>
#include <unordered_map>

#include "model/GameResults.h"
#include "model/GameSession.h"

// Owns every piece of game state. The browser never calculates a score.
class GameService {
public:
    GameService();

    StartResult startGame();
    AnswerResult submitAnswer(const std::string& gameId, const std::string& answer);

    // True for the four internal category values of section 3.
    static bool isSupportedCategory(const std::string& value);

    // Correct answers as a percentage with one decimal; 0 when nothing was
    // answered yet.
    static double calculateAccuracy(const GameSession& session);

private:
    // The caller must already hold mutex_.
    const WasteItem& drawWaste(int previousId);
    std::string createGameId();

    std::unordered_map<std::string, GameSession> sessions_;
    std::mutex mutex_;
    std::mt19937 rng_;
    long long counter_ = 0;
};

