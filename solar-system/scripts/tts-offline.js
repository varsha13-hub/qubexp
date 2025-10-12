/* tts-offline.js - Offline-first TTS Manager with pre-recorded audio */
(function (window) {
  const AUDIO_BASE_PATH = 'audio'; // relative to solar-system directory

  const OfflineTTS = {
    _audioEl: null,
    _audioUrl: null,
    _onEnd: null,
    _onError: null,
    _lastRequest: null,

    async _loadAudioFile(planet, lang) {
      const audioPath = `${AUDIO_BASE_PATH}/${lang}/${planet}.mp3`;
      
      try {
        const response = await fetch(audioPath);
        if (!response.ok) throw new Error(`Audio file not found: ${audioPath}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        console.warn(`[Offline TTS] Failed to load audio file: ${audioPath}`, error);
        return null;
      }
    },

    _cleanup() {
      try {
        if (this._audioEl) {
          this._audioEl.onended = null;
          this._audioEl.onerror = null;
          try { this._audioEl.pause(); } catch (e) {}
          this._audioEl = null;
        }
        if (this._audioUrl) {
          try { URL.revokeObjectURL(this._audioUrl); } catch(e) {}
          this._audioUrl = null;
        }
      } catch(e){}
      this._onEnd = null;
      this._onError = null;
    },

    async speak(text, lang = 'hi', opts = {}) {
      // Extract planet name from the current context
      const planetMatch = text.toLowerCase().match(/\b(sun|mercury|venus|earth|mars|jupiter|saturn|uranus|neptune|overview|conclusion)\b/);
      const planet = planetMatch ? planetMatch[1] : 'overview';

      try {
        const audioUrl = await this._loadAudioFile(planet, lang);
        if (!audioUrl) {
          console.warn(`[Offline TTS] No audio file for ${planet} in ${lang}, falling back to browser TTS`);
          // Fallback to browser TTS
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = lang;
          window.speechSynthesis.speak(utterance);
          return;
        }

        // Stop any current audio
        this.stop();

        // Play the audio file
        const audio = new Audio(audioUrl);
        audio.preload = 'auto';

        audio.onended = () => {
          if (this._onEnd) this._onEnd();
          this._cleanup();
        };

        audio.onerror = (e) => {
          if (this._onError) this._onError(e);
          this._cleanup();
        };

        audio.play().catch(err => {
          console.warn('[Offline TTS] Playback error:', err);
          if (this._onError) this._onError(err);
          this._cleanup();
        });

        this._audioEl = audio;
        this._audioUrl = audioUrl;
      } catch (e) {
        console.error('[Offline TTS] speak error', e);
        throw e;
      }
    },

    async speakAndWait(text, lang = 'hi', opts = {}) {
      return new Promise((resolve, reject) => {
        this._onEnd = resolve;
        this._onError = reject;
        this.speak(text, lang, opts).catch(reject);
      });
    },

    pause() {
      if (this._audioEl && !this._audioEl.paused) {
        try { this._audioEl.pause(); } catch(e) { console.warn('pause error', e); }
      }
    },

    resume() {
      if (this._audioEl && this._audioEl.paused) {
        this._audioEl.play().catch(e => console.warn('resume error', e));
      }
    },

    stop() {
      try {
        if (this._audioEl) {
          try { this._audioEl.pause(); this._audioEl.currentTime = 0; } catch(e){}
          this._cleanup();
        }
      } catch(e) { console.warn('stop error', e); }
    },

    isSpeaking() {
      return !!(this._audioEl && !this._audioEl.paused);
    },

    // Legacy compatibility methods
    speakTextSarvam: async function (text, opts = {}) {
      const language = opts.language || opts.lang || 'hi';
      return this.speakAndWait(text, language, opts);
    },

    cancel: function() {
      this.stop();
    },

    isAvailable: function() {
      return true;
    }
  };

  // Expose globally for compatibility
  window.SarvamTTS = OfflineTTS;
  window.TTSManager = OfflineTTS;
  window.ttsManager = OfflineTTS;
  
  console.log('[Offline TTS] ✅ Offline-first TTS Manager loaded');
})(window);
