cmake_minimum_required(VERSION 3.16)

project(WasteSortingChallenge CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_executable(waste_backend
    backend/data/WasteData.cpp
    backend/service/GameService.cpp
    backend/api/ApiServer.cpp
    backend/main.cpp
)

target_include_directories(waste_backend PRIVATE backend external)

if(WIN32)
    # cpp-httplib v0.57.1 requires Windows 10 or later APIs.
    target_compile_definitions(waste_backend PRIVATE
        _WIN32_WINNT=0x0A00
        WINVER=0x0A00
        NOMINMAX
    )
    target_link_libraries(waste_backend PRIVATE ws2_32)
endif()

find_package(Threads REQUIRED)
target_link_libraries(waste_backend PRIVATE Threads::Threads)

