// tts-sarvam.js — pure Sarvam-only version (no robust wrapper, no fallback)

window.TTSManager = window.ttsManager = {
  speakTextSarvam: async function (text, opts = {}) {
    const language = opts.language || opts.lang || 'hi';
    const speaker = 'meera'; // Sarvam female Hindi voice

    console.log('[Sarvam TTS] Speaking:', text.substring(0, 50) + '...', 'Language:', language);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, speaker })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.audio) {
        console.error('[Sarvam TTS] Invalid response:', data);
        return;
      }

      // Play audio directly from base64
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      await audio.play();
      
      console.log('[Sarvam TTS] ✅ Played successfully');
    } catch (error) {
      console.error('[Sarvam TTS] ❌ Error:', error.message);
    }
  },

  // Aliases for compatibility
  speak: async function(text, opts = {}) {
    return this.speakTextSarvam(text, opts);
  },

  speakText: async function(text, opts = {}) {
    return this.speakTextSarvam(text, opts);
  },

  speakAndWait: async function(text, opts = {}) {
    return this.speakTextSarvam(text, opts);
  },

  // Legacy methods for vr-scene.js compatibility
  fetchServerTTSAudio: async function(text, language) {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language, speaker: 'meera' })
    });

    const data = await response.json();
    return data.audio;
  },

  playServerTTSAudio: async function(audioBase64) {
    const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
    await audio.play();
  },

  fetchServerTTS: async function(text, language) {
    return this.speakTextSarvam(text, { language });
  },

  isAvailable: function() {
    return true;
  },

  cancel: function() {
    // Simple cancel - stop all audio
    document.querySelectorAll('audio').forEach(a => {
      a.pause();
      a.src = '';
    });
  }
};

console.log('[Sarvam TTS] ✅ Simple Sarvam-only TTS Manager loaded (meera voice)');
