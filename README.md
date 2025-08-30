# SolarLearn VR - Solar System Educational Experience

A virtual reality educational experience for learning about the solar system with multi-language support and voice interaction.

## Features

- 🌟 **3D Solar System**: Interactive 3D models of planets and the Sun
- 🗣️ **Voice Commands**: Speech recognition for navigation and information
- 🌍 **Multi-language Support**: Translation and TTS in multiple Indian languages
- 🎧 **VR Ready**: Compatible with VR headsets via HTTPS
- 📱 **Web-based**: Runs in any modern web browser

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Modern web browser with WebXR support
- VR headset (optional, for VR experience)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd QubeXP
```

2. Install dependencies:
```bash
cd server
npm install
```

3. Configure environment:
   - The `.env` file is already configured with the Sarvam API key
   - No additional setup required for basic functionality

### Running the Server

#### Option 1: Using the startup script (Recommended)
```bash
./start-server.sh
```

#### Option 2: Manual startup
```bash
cd server
HTTPS_PORT=8040 node server-https.js
```

### Accessing the Application

- **Main Experience**: https://localhost:8040
- **VR Mode**: https://localhost:8040/vr

⚠️ **Note**: Accept the self-signed certificate warning in your browser/VR headset.

## API Configuration

### Sarvam AI Integration

The application uses Sarvam AI for:
- **Translation**: English to Indian languages (Hindi, Kannada, Tamil, Telugu, Marathi, Bengali, Gujarati, Urdu)
- **Text-to-Speech**: High-quality voice synthesis in Indian languages

**API Key**: Already configured in `server/.env`
```env
SARVAM_KEY=sk_9f49gjcz_3CI1R2e6fHW6jNFL9YV7NX7m
```

### Supported Languages

- **English** (en)
- **Hindi** (hi) - हिंदी
- **Kannada** (kn) - ಕನ್ನಡ
- **Tamil** (ta) - தமிழ்
- **Telugu** (te) - తెలుగు
- **Marathi** (mr) - मराठी
- **Bengali** (bn) - বাংলা
- **Gujarati** (gu) - ગુજરાતી
- **Urdu** (ur) - اردو

## Project Structure

```
QubeXP/
├── client/                 # Frontend VR application
│   ├── index.html         # Main VR scene
│   └── assets/            # 3D models and textures
│       └── planets/       # Planet 3D models
├── server/                # Backend API server
│   ├── src/
│   │   └── routes/        # API endpoints
│   │       ├── translate.js # Translation service
│   │       └── tts.js     # Text-to-speech service
│   ├── .env              # Environment configuration
│   └── server-https.js   # HTTPS server
├── start-server.sh       # Server startup script
└── README.md            # This file
```

## Development

### Adding New Languages

1. Update language mapping in `server/src/routes/translate.js`
2. Add language support in `server/src/routes/tts.js`
3. Update frontend language selector

### Customizing 3D Models

- Replace models in `client/assets/planets/`
- Update model references in `client/index.html`
- Ensure models are in GLB/GLTF format

## Troubleshooting

### Common Issues

1. **"Sarvam API key not configured" error**
   - Ensure `server/.env` file exists and contains `SARVAM_KEY`
   - Restart the server after making changes

2. **3D models not loading**
   - Check browser console for errors
   - Verify model files exist in `client/assets/planets/`
   - Ensure models are in supported format (GLB/GLTF)

3. **VR not working**
   - Use HTTPS (required for WebXR)
   - Accept self-signed certificate
   - Ensure browser supports WebXR

### Server Logs

The server provides detailed logging for:
- Translation requests and responses
- TTS requests and audio generation
- Model loading status
- Error messages and debugging info

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]

## Support

For issues and questions:
- Check the troubleshooting section
- Review server logs for error details
- Create an issue in the repository