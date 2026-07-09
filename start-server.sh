#!/bin/bash

# SolarLearn VR Server Startup Script
# This script starts the HTTPS server with proper environment configuration

echo "🚀 Starting SolarLearn VR Server..."
echo "📁 Working directory: $(pwd)"

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "❌ Error: server/.env file not found!"
    echo "Please make sure the .env file exists with the Sarvam API key."
    exit 1
fi

# Check if Sarvam API key is configured
if ! grep -q "SARVAM_KEY=" server/.env; then
    echo "❌ Error: SARVAM_KEY not found in server/.env file!"
    echo "Please add the Sarvam API key to the .env file."
    exit 1
fi

echo "✅ Environment configuration found"
echo "🔑 Sarvam API key configured"

# Kill any existing server processes
echo "🔄 Stopping any existing server processes..."
pkill -f "server-https.js" 2>/dev/null || true
sleep 2

# Start the server
echo "🌟 Starting HTTPS server on port 8040..."
cd server && HTTPS_PORT=8040 node server-https.js
