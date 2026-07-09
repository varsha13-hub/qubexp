@echo off
echo 🏛️  Starting Indus Valley Civilization WebXR Server...
echo.
echo This will start a local web server for the WebXR experience.
echo Make sure you have Node.js installed.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo 📡 Starting server on http://localhost:8080
echo 🥽 Open this URL in Chrome or Firefox for VR experience
echo.

node server.js
