@echo off
rem Build the C++ backend without CMake, using the MinGW g++ that ships with
rem CodeBlocks. Static linking keeps the .exe self-contained: no extra DLLs are
rem needed next to it, so it can be copied to any Windows machine.
setlocal
cd /d "%~dp0"

set GXX=g++
set MINGW_BIN=D:\CodeBlocks\MinGW\bin
if exist "%MINGW_BIN%\g++.exe" (
  set GXX=%MINGW_BIN%\g++.exe
  rem The compiler back end needs its own DLLs on PATH.
  set PATH=%MINGW_BIN%;%PATH%
)

if not exist "backend\build" mkdir "backend\build"

echo Building with %GXX%
"%GXX%" -std=c++17 -O2 -Wall ^
  -D_WIN32_WINNT=0x0A00 -DWINVER=0x0A00 -DNTDDI_VERSION=0x0A000000 ^
  -Ibackend -Iexternal ^
  backend\data\WasteData.cpp ^
  backend\service\GameService.cpp ^
  backend\api\ApiServer.cpp ^
  backend\main.cpp ^
  -o backend\build\waste_backend.exe ^
  -lws2_32 -static -static-libgcc -static-libstdc++

if errorlevel 1 (
  echo.
  echo Build failed.
  exit /b 1
)

echo.
echo Built backend\build\waste_backend.exe
endlocal

