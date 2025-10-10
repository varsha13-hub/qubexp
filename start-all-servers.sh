#!/bin/bash
# Start all servers for Solar System VR

echo "🚀 Starting Solar System VR Servers..."

# Kill existing processes
pkill -9 node 2>/dev/null
pkill ngrok 2>/dev/null
sleep 2

# Start HTTP server (port 8080)
cd server && node server.js > /tmp/http-server.log 2>&1 &
HTTP_PID=$!
echo "✅ HTTP Server started (PID: $HTTP_PID) - http://localhost:8080"

# Start HTTPS server (port 8443)
node server-https.js > /tmp/https-server.log 2>&1 &
HTTPS_PID=$!
echo "✅ HTTPS Server started (PID: $HTTPS_PID) - https://localhost:8443"

# Wait for servers to start
sleep 3

# Start ngrok tunnel
ngrok http 8443 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
echo "✅ Ngrok started (PID: $NGROK_PID)"

# Wait for ngrok to initialize
sleep 3

# Get ngrok public URL
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*"' | cut -d'"' -f4)

echo ""
echo "========================================="
echo "🎉 All Servers Running!"
echo "========================================="
echo ""
echo "📍 Local Access:"
echo "   HTTP:  http://localhost:8080"
echo "   HTTPS: https://localhost:8443"
echo ""
echo "🌍 Public Access (via ngrok):"
echo "   URL: $PUBLIC_URL"
echo ""
echo "🎮 VR Headset Setup:"
echo "   1. Open ngrok URL on your VR headset browser"
echo "   2. Accept the SSL certificate warning"
echo "   3. Click 'Start Tour' to begin"
echo ""
echo "📊 Monitor:"
echo "   HTTP logs:  tail -f /tmp/http-server.log"
echo "   HTTPS logs: tail -f /tmp/https-server.log"
echo "   Ngrok logs: tail -f /tmp/ngrok.log"
echo "   Ngrok dashboard: http://localhost:4040"
echo ""
echo "🛑 To stop all servers:"
echo "   pkill -9 node && pkill ngrok"
echo "========================================="

