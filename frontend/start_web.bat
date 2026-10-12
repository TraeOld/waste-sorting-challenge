@echo off
rem Serve this folder over HTTP, then open the game.
rem A plain double-click on index.html will not work: the game uses ES modules
rem and fetches JSON, and browsers block that on file:// URLs.
setlocal
cd /d "%~dp0"

set PYTHON=python
where python >nul 2>nul || set PYTHON=py

echo Serving %CD% at http://localhost:5500
echo Close this window to stop the server.
start "" "http://localhost:5500/index.html"
%PYTHON% -m http.server 5500
