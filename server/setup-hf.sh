#!/bin/bash

# Hugging Face AI Integration Setup Script

echo "🤖 Setting up Hugging Face AI Integration for SolarLearn VR..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it and add your Hugging Face API token."
    echo "   Set HF_TOKEN=your_actual_token_here"
else
    echo "✅ .env file already exists"
fi

# Check if HF_TOKEN is set
if grep -q "HF_TOKEN=your_huggingface_token_here" .env; then
    echo "⚠️  Please update your .env file with your actual Hugging Face API token:"
    echo "   HF_TOKEN=your_huggingface_token_here"
    echo ""
    echo "   You can edit the .env file manually or run:"
    echo "   sed -i '' 's/HF_TOKEN=your_huggingface_token_here/HF_TOKEN=your_actual_token_here/' .env"
else
    echo "✅ Hugging Face API token appears to be configured"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your .env file has the correct HF_TOKEN"
echo "2. Start the server: npm start"
echo "3. Test the AI integration: http://localhost:8080/hf-ai-test"
echo ""
echo "Available endpoints:"
echo "  - /api/ai/asr - Speech-to-Text"
echo "  - /api/ai/translate - Translation"
echo "  - /api/ai/tts - Text-to-Speech"
echo "  - /api/ai/health - Health check"
echo "  - /api/ai/models - Available models"
