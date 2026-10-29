#!/bin/bash

# TelePrompter Studio - All-in-One Startup Script

echo "🎙️ Starting TelePrompter Pro Studio..."

# 1. Start Python Human Neural Voice Engine in the background
echo "🔊 Launching Free Human Neural Voice Engine on port 5055..."
python3 tts_server.py &
TTS_PID=$!

# Ensure Python TTS server terminates when script is stopped
trap "kill $TTS_PID 2>/dev/null" EXIT

# 2. Start Vite Frontend Dev Server
echo "🚀 Launching Vite Web App on http://localhost:3000..."
npm run dev

# Wait for background process
wait $TTS_PID
