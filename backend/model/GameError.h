#pragma once

#include <stdexcept>
#include <string>

// Business error raised by GameService and translated into HTTP by ApiServer.
struct GameError {
    std::string code;
    std::string message;
};

class GameException : public std::runtime_error {
public:
    explicit GameException(GameError error)
        : std::runtime_error(error.message), error_(std::move(error)) {}

    const GameError& error() const { return error_; }

private:
    GameError error_;
};

