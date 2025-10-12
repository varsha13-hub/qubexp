# QubeXP SolarLearn VR - Electron App

A native desktop application for the SolarLearn VR experience with offline support.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the app:
```bash
npm start
```

## Environment Variables

- `SARVAM_API`: (Optional) URL to the Sarvam TTS API for generating new audio files

## Troubleshooting

- If the window is blank or content doesn't load, open DevTools (Ctrl/Cmd + Shift + I) to check for errors
- Make sure all paths in electron-main.js match your project structure
- For offline audio generation, ensure the audio directory exists and is writable

## Features

- Loads the VR experience in a native window
- Offline Q&A support using local JSON database
- Local audio playback for pre-generated TTS files
- Optional Sarvam TTS integration for generating new audio files
