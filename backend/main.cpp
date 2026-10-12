#include <cstdlib>
#include <exception>
#include <iostream>
#include <string>

#include "api/ApiServer.h"
#include "data/WasteData.h"
#include "service/GameService.h"

namespace {

bool parsePort(const std::string& text, int& port) {
    try {
        size_t consumed = 0;
        const int value = std::stoi(text, &consumed);
        if (consumed != text.size()) return false;
        if (value < 1 || value > 65535) return false;
        port = value;
        return true;
    } catch (const std::exception&) {
        return false;
    }
}

}  // namespace

int main(int argc, char** argv) {
    int port = 8080;
    std::string host = "127.0.0.1";

    if (argc > 1 && !parsePort(argv[1], port)) {
        std::cerr << "Invalid port: " << argv[1] << "\n"
                  << "Usage: waste_backend [port=8080] [host=127.0.0.1]\n";
        return 2;
    }
    if (argc > 2) host = argv[2];

    if (!WasteData::isValid()) {
        std::cerr << "Waste database failed its validation rules.\n";
        return 3;
    }

    GameService service;
    ApiServer server(service);

    std::cout << "Waste Sorting Challenge backend\n"
              << "  items: " << WasteData::allItems().size() << "\n"
              << "  listening on http://" << host << ":" << port << "/api\n"
              << "  press Ctrl+C to stop\n";
    std::cout.flush();

    if (!server.listen(host, port)) {
        std::cerr << "Failed to listen on " << host << ":" << port
                  << " (port in use or address unavailable).\n";
        return 4;
    }
    return 0;
}
