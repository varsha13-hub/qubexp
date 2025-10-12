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
      const relPath = `${AUDIO_BASE_PATH}/${lang}/${planet}.mp3`;
      console.log('[TTS] _loadAudioFile:', { planet, lang, relPath });
      
      // Verify path contains the planet key
      if (!relPath.includes(planet)) {
        console.warn('[TTS] resolved path does not include planet key — possible mapping bug', { planet, lang, relPath });
      }
      
      // 1) If running under file:// and we have an Electron API, try to resolve
      if (location.protocol === 'file:' && window.api && window.api.playLocalAudio) {
        console.log('[TTS] trying Electron API for:', relPath);
        const res = await window.api.playLocalAudio(relPath);
        if (res.ok && res.path) {
          console.log('[TTS] got file path from Electron:', res.path);
          return res.path; // file://...
        }
        console.warn('[TTS] playLocalAudio did not return file:', res);
      }

      // 2) Otherwise try relative fetch from same origin
      let base = window.location.pathname;
      // remove trailing index.html or filename
      base = base.substring(0, base.lastIndexOf('/'));
      const url = `${base}/${relPath}`.replace(/\/\//g,'/');
      
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Audio file not found: ${url}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        console.warn(`[Offline TTS] Failed to load audio file: ${url}`, error);
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
      console.log('[TTS] speak requested:', { text, lang, opts });
      window.__LAST_TTS_CALL__ = { time: Date.now(), text, lang, opts };

      // Get planet key from opts or try to extract from text
      const planet = opts.planetKey || (() => {
        // Try to get from current tour step
        if (window.currentPlanet && window.currentPlanet.id) {
          console.log('[TTS] using current planet key:', window.currentPlanet.id);
          return window.currentPlanet.id;
        }
        // Fallback to extraction from text
        const planetMatch = text.toLowerCase().match(/\b(sun|mercury|venus|earth|mars|jupiter|saturn|uranus|neptune|overview|conclusion)\b/);
        const key = planetMatch ? planetMatch[1] : 'overview';
        console.log('[TTS] extracted planet key from text:', key);
        return key;
      })();
      console.log('[TTS] using planet key:', planet);

      try {
        // Try to get audio file path from Electron API first
        if (window.api && window.api.resolveAudioKey) {
          const result = await window.api.resolveAudioKey({ lang, key: planet });
          if (result.ok) {
            return this.playPath(result.path);
          }
        }

        // Fallback to web mode
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
    },

    // Play audio directly from a file:// path
    playPath: async function(filePath) {
      console.log('[TTS] playPath:', filePath);
      window.__LAST_TTS_CALL__ = { time: Date.now(), path: filePath };

      try {
        this.stop();
        
        const audio = new Audio(filePath);
        audio.preload = 'auto';

        await new Promise((resolve, reject) => {
          audio.onended = () => {
            console.log('[TTS] audio ended:', filePath);
            this._cleanup();
            resolve();
          };

          audio.onerror = (e) => {
            console.error('[TTS] audio error:', e, 'currentSrc=', audio.currentSrc);
            this._cleanup();
            reject(e);
          };

          audio.oncanplay = () => {
            console.log('[TTS] audio ready to play:', filePath);
          };

          audio.play().catch(err => {
            console.error('[TTS] Playback error:', err, 'currentSrc=', audio.currentSrc);
            reject(err);
          });

          this._audioEl = audio;
          console.log('[TTS] audio element created:', { src: audio.src, currentSrc: audio.currentSrc });
        });
      } catch (error) {
        console.error('[TTS] playPath error:', error);
        throw error;
      }
    }
  };

  // Expose globally for compatibility
  window.SarvamTTS = OfflineTTS;
  window.TTSManager = OfflineTTS;
  window.ttsManager = OfflineTTS;
  
  console.log('[Offline TTS] ✅ Offline-first TTS Manager loaded');
})(window);
