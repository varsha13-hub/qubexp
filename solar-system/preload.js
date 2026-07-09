const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    offlineAsk: (question) => 
      ipcRenderer.invoke('offline-ask', question),
    
    playLocalAudio: (relPath) => 
      ipcRenderer.invoke('play-local-audio', relPath),
    
    resolveAudioKey: ({ lang = 'en', key }) =>
      ipcRenderer.invoke('resolve-audio-key', { lang, key }),
    
    genSarvamTTS: (text, lang, key) => 
      ipcRenderer.invoke('gen-sarvam-tts', { text, lang, key })
  }
);
