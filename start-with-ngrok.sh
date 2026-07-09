#!/bin/bash

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down services..."
    kill $SERVER_PID $NGROK_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the HTTPS server
echo "🚀 Starting HTTPS server..."
cd server && HTTPS_PORT=8040 node server-https.js &
SERVER_PID=$!
cd ..

# Wait for server to start
echo "⏳ Waiting for HTTPS server to start..."
sleep 3

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel..."
ngrok http https://localhost:8040 --log=stdout &
NGROK_PID=$!

echo "✅ Services started!"
echo "📱 Local HTTPS: https://localhost:8040"
echo "🌍 Check ngrok URL in the output above"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
