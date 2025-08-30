#!/bin/bash

echo "🚀 Starting Enhanced SolarLearn VR with Indian Language TTS Support"
echo "================================================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down services..."
    kill $AI_PID $SERVER_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "📦 Starting Enhanced AI Service (Port 8090)..."
cd ai-service
python3 main.py &
AI_PID=$!
cd ..

echo "⏳ Waiting for AI service to start..."
sleep 3

echo "🌐 Starting Main Server (Port 8080)..."
cd server
npm start &
SERVER_PID=$!
cd ..

echo "✅ Services started successfully!"
echo ""
echo "🌍 Main Application: http://localhost:8080"
echo "🎮 VR Experience: http://localhost:8080/vr"
echo "🤖 AI Service: http://localhost:8090"
echo ""
echo "🇮🇳 Indian Language TTS Support:"
echo "   - Hindi (हिंदी)"
echo "   - Kannada (ಕನ್ನಡ)"
echo "   - Tamil (தமிழ்)"
echo "   - Telugu (తెలుగు)"
echo "   - Marathi (मराठी)"
echo "   - Bengali (বাংলা)"
echo "   - And more..."
echo ""
echo "🎤 Voice Commands:"
echo "   - 'Tell me about Mars' (English)"
echo "   - 'मंगल के बारे में बताओ' (Hindi)"
echo "   - 'ಮಂಗಳದ ಬಗ್ಗೆ ಹೇಳು' (Kannada)"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
