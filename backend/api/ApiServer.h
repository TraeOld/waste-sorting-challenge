#pragma once

#include <memory>
#include <string>
#include <thread>

#include "service/GameService.h"

namespace httplib {
class Server;
struct Request;
struct Response;
}  // namespace httplib

// Translates HTTP and JSON into calls on GameService, and business results
// back into the response shapes of specification V1.0, sections 7 to 10.
class ApiServer {
public:
    explicit ApiServer(GameService& service);
    ~ApiServer();

    bool listen(const std::string& host, int port);

private:
    void registerRoutes(httplib::Server& server);
    void handleHealth(const httplib::Request& request, httplib::Response& response);
    void handleStart(const httplib::Request& request, httplib::Response& response);
    void handleAnswer(const httplib::Request& request, httplib::Response& response);
    void handleOptions(const httplib::Request& request, httplib::Response& response);

    GameService& service_;
    std::unique_ptr<httplib::Server> server_;
    // Second listener for the IPv6 loopback, so a browser that resolves
    // "localhost" to ::1 first cannot stall before reaching this API.
    std::unique_ptr<httplib::Server> server6_;
    std::thread ipv6Thread_;
};

