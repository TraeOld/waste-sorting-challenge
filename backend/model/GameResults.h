#pragma once

#include <string>

// The only fields a browser ever receives for a question (spec V1.0, section 7).
struct PublicItem {
    int id = 0;
    std::string name;
    std::string imageKey;
};

struct GameStats {
    int correctAnswers = 0;
    int wrongAnswers = 0;
    int totalAnswers = 0;
    double accuracy = 0.0;
};

struct StartResult {
    std::string gameId;
    int score = 0;
    int health = 3;
    PublicItem item;
};

struct AnswerResult {
    bool correct = false;
    std::string correctCategory;
    int score = 0;
    int health = 3;
    std::string ecoTip;
    bool gameOver = false;
    GameStats stats;
    bool hasNextItem = false;
    PublicItem nextItem;
};

