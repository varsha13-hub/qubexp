@echo off
echo 🌐 Starting HTTP Server for Indus Valley Civilization...
echo.
echo 📁 Your Indus Valley Civilization will be available at:
echo    http://localhost:8080/offline-demo.html
echo    http://127.0.0.1:8080/offline-demo.html
echo.
echo ✅ No security warnings - works immediately!
echo.
python -m http.server 8080
pause
