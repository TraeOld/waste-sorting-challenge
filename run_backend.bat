@echo off
rem Start the API on http://localhost:8080/api
setlocal
cd /d "%~dp0"

if not exist "backend\build\waste_backend.exe" (
  echo The backend is not built yet. Run build_backend.bat first.
  exit /b 1
)

echo Starting the Waste Sorting Challenge backend on port 8080.
echo Keep this window open while the game is running.
backend\build\waste_backend.exe 8080 127.0.0.1
endlocal

