const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fetch = require('node-fetch');

// Keep a global reference of the window object
let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'client', 'preload.js')
    }
  });

  // Load the index.html file
  await mainWindow.loadFile(path.join(__dirname, 'solar-system', 'index.html'));
  
  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers

// Handle offline Q&A requests
ipcMain.handle('offline-ask', async (event, question) => {
  try {
    // Read the Q&A database
    const qaPath = path.join(__dirname, 'solar-system', 'offline_qa.json');
    const qaData = await fs.readFile(qaPath, 'utf8');
    const qa = JSON.parse(qaData);

    // Simple substring matching (can be improved with better search)
    const match = qa.find(item => 
      question.toLowerCase().includes(item.question.toLowerCase()) ||
      item.keywords.some(kw => question.toLowerCase().includes(kw.toLowerCase()))
    );

    return match ? match.answer : "I'm sorry, I don't have an answer for that question in offline mode.";
  } catch (error) {
    console.error('Error in offline-ask:', error);
    return "Sorry, there was an error accessing the offline Q&A database.";
  }
});

// Handle local audio playback requests
ipcMain.handle('play-local-audio', async (event, relPath) => {
  try {
    const audioPath = path.join(__dirname, 'solar-system', relPath);
    // Check if file exists
    await fs.access(audioPath);
    // Return success with file:// URL
    return {
      ok: true,
      path: 'file://' + audioPath.replace(/\\/g, '/') // Ensure proper URL format on Windows
    };
  } catch (error) {
    console.error('Error in play-local-audio:', error);
    return {
      ok: false,
      error: 'not-found',
      details: error.message
    };
  }
});

// Helper to resolve audio key to file path
ipcMain.handle('resolve-audio-key', async (event, { lang = 'en', key }) => {
  const relPath = `audio/${lang}/${key}.mp3`;
  return ipcMain.handle('play-local-audio', event, relPath);
});

// Handle Sarvam TTS generation requests
ipcMain.handle('gen-sarvam-tts', async (event, { text, lang, key }) => {
  try {
    const SARVAM_API = process.env.SARVAM_API;
    if (!SARVAM_API) {
      throw new Error('SARVAM_API environment variable not set');
    }

    const response = await fetch(SARVAM_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        language: lang,
        response_type: 'audio_base64'
      })
    });

    if (!response.ok) {
      throw new Error(`Sarvam API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.audio) {
      throw new Error('No audio data received from Sarvam');
    }

    // Save the audio file
    const audioDir = path.join(__dirname, 'solar-system', 'audio', lang);
    await fs.mkdir(audioDir, { recursive: true });
    
    const audioPath = path.join(audioDir, `${key}.mp3`);
    await fs.writeFile(audioPath, Buffer.from(data.audio, 'base64'));

    return 'file://' + audioPath;
  } catch (error) {
    console.error('Error in gen-sarvam-tts:', error);
    return null;
  }
});
