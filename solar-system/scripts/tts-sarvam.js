/* tts-sarvam.js - Sarvam-only TTS Manager (drop-in replacement) */
(function (window) {
  const SARVAM_ENDPOINT = '/api/tts'; // <-- set to your Sarvam server endpoint if different
  const DEFAULT_TIMEOUT_MS = 60000; // Increased for pause scenarios

  // language -> voice map (adjust if your server uses other voice names)
  const VOICE_BY_LANG = {
    en: 'Meera',   // example
    hi: 'Lekha',   // earlier logs showed Lekha for hi
    kn: 'Lekha',
    ta: 'Lekha',
    te: 'Lekha',
    bn: 'Lekha'
  };

  function mimeForFormat(format) {
    if (!format) return 'audio/mpeg';
    format = format.toLowerCase();
    if (format.includes('mp3')) return 'audio/mpeg';
    if (format.includes('wav')) return 'audio/wav';
    if (format.includes('ogg')) return 'audio/ogg';
    return 'audio/mpeg';
  }

  function base64ToBlob(base64, mime) {
    const bin = atob(base64);
    const len = bin.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  const SarvamTTS = {
    _audioEl: null,
    _audioUrl: null,
    _onEnd: null,
    _onError: null,
    _lastRequest: null,

    // low-level server fetch; tries to force base64 return with response_type param
    async fetchServerTTS(text, lang = 'hi', voice = null, opts = {}) {
      if (!text) throw new Error('No text for TTS');

      const payload = {
        text,
        language: lang,
        voice: voice || VOICE_BY_LANG[lang] || undefined,
        // Ask server explicitly for base64 audio - adapt if your server expects other key
        response_type: 'audio_base64',
        ...(opts.extra || {})
      };

      const res = await fetch(SARVAM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('TTS server HTTP error: ' + res.status);
      const json = await res.json();
      return json;
    },

    // low-level play a base64 payload
    _playBase64(base64, format = 'mp3') {
      // stop previous
      this.stop();

      const mime = mimeForFormat(format);
      const blob = base64ToBlob(base64, mime);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';

      audio.onended = () => {
        if (this._onEnd) this._onEnd();
        this._cleanup();
      };
      audio.onerror = (e) => {
        if (this._onError) this._onError(e);
        this._cleanup();
      };

      // try autoplay (your unlock flow should already have been run)
      audio.play().catch(err => {
        // bubble error through handler
        if (this._onError) this._onError(err);
        this._cleanup();
      });

      this._audioEl = audio;
      this._audioUrl = url;
      return audio;
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

    // speak (fire and forget) - still stops previous to prevent overlap
    async speak(text, lang = 'hi', opts = {}) {
      try {
        const json = await this.fetchServerTTS(text, lang, opts.voice || undefined);
        // if server returned audio base64
        if (json && json.audio) {
          this._playBase64(json.audio, json.format || 'mp3');
        } else {
          // If server returned {format: 'browser', audio: null}, try a retry to force base64
          if (json && json.format === 'browser') {
            const retry = await this.fetchServerTTS(text, lang, opts.voice || undefined, { extra: { response_type: 'audio_base64' } });
            if (retry && retry.audio) this._playBase64(retry.audio, retry.format || 'mp3');
            else throw new Error('TTS did not return base64 audio.');
          } else {
            throw new Error('Invalid TTS response');
          }
        }
      } catch (e) {
        console.error('[Sarvam TTS] speak error', e);
        throw e;
      }
    },

    // speak and wait for end (returns promise)
    async speakAndWait(text, lang = 'hi', opts = { timeoutMs: DEFAULT_TIMEOUT_MS }) {
      // Stop current audio to avoid overlap
      if (this.isSpeaking()) this.stop();

      this._lastRequest = { text, lang, opts };

      // Fetch audio first
      const json = await this.fetchServerTTS(text, lang, opts.voice || undefined);
      if (!json || !json.audio) {
        // try explicit base64 request if server responded with browser format
        if (json && json.format === 'browser') {
          const retry = await this.fetchServerTTS(text, lang, opts.voice || undefined, { extra: { response_type: 'audio_base64' } });
          if (!retry || !retry.audio) throw new Error('Invalid TTS response from Sarvam (no base64 audio).');
          return this._playAndWait(retry.audio, retry.format || 'mp3', opts.timeoutMs || DEFAULT_TIMEOUT_MS);
        }
        throw new Error('Invalid TTS response from Sarvam (no audio).');
      }
      return this._playAndWait(json.audio, json.format || 'mp3', opts.timeoutMs || DEFAULT_TIMEOUT_MS);
    },

    _playAndWait(base64, format, timeoutMs) {
      return new Promise((resolve, reject) => {
        let timedOut = false;
        const timeoutId = setTimeout(() => {
          timedOut = true;
          this._cleanup();
          reject(new Error('TTS timeout'));
        }, timeoutMs);

        this._onEnd = () => {
          if (timedOut) return;
          clearTimeout(timeoutId);
          resolve();
        };
        this._onError = (e) => {
          if (timedOut) return;
          clearTimeout(timeoutId);
          reject(e || new Error('TTS playback error'));
        };

        try {
          this._playBase64(base64, format);
        } catch (e) {
          clearTimeout(timeoutId);
          reject(e);
        }
      });
    },

    // Preload (fetch and hold base64 in memory) — useful to fetch next narration while camera moves
    async preload(text, lang = 'hi') {
      try {
        const json = await this.fetchServerTTS(text, lang, VOICE_BY_LANG[lang] || undefined);
        if (!json || !json.audio) return null;
        return json; // caller can store this object { audio, format, ... }
      } catch (e) {
        console.warn('[Sarvam TTS] preload failed', e);
        return null;
      }
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

    // Expose a small debug helper
    lastRequest() { return this._lastRequest; },

    // Legacy compatibility methods for existing code
    speakTextSarvam: async function (text, opts = {}) {
      const language = opts.language || opts.lang || 'hi';
      return this.speakAndWait(text, language, opts);
    },

    playServerTTSAudio: async function(audioBase64) {
      this._playBase64(audioBase64, 'mp3');
    },

    fetchServerTTSAudio: async function(text, language) {
      const json = await this.fetchServerTTS(text, language, VOICE_BY_LANG[language] || undefined);
      return json.audio;
    },

    cancel: function() {
      this.stop();
    },

    isAvailable: function() {
      return true;
    }
  };

  // Expose globally for compatibility
  window.SarvamTTS = SarvamTTS;
  window.TTSManager = SarvamTTS;
  window.ttsManager = SarvamTTS;
  
  console.log('[Sarvam TTS] ✅ Simple Sarvam-only TTS Manager loaded');
})(window);