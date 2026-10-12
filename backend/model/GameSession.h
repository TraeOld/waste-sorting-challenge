#pragma once

#include <string>

#include "model/WasteItem.h"

// State of a single play-through (spec V1.0, section 6).
struct GameSession {
    std::string gameId;
    int score = 0;
    int health = 3;
    int correctAnswers = 0;
    int wrongAnswers = 0;
    int totalAnswers = 0;
    WasteItem currentWaste;
};

