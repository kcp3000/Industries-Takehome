@echo off
setlocal

set "NPM_CMD=C:\Program Files\nodejs\npm.cmd"
if not exist "%NPM_CMD%" set "NPM_CMD=C:\Program Files (x86)\nodejs\npm.cmd"
if not exist "%NPM_CMD%" set "NPM_CMD=%APPDATA%\npm\npm.cmd"

if not exist "%NPM_CMD%" (
  echo Unable to find npm.cmd. Install Node.js or add npm to PATH.
  exit /b 1
)

for %%I in ("%NPM_CMD%") do set "NODE_BIN=%%~dpI"
set "PATH=%NODE_BIN%;%PATH%"

call "%NPM_CMD%" %*
exit /b %ERRORLEVEL%
