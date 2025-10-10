// tts-manager-compat.js (improved, replace your current file)
(function () {
  const DEFAULT_SARVAM_VOICE = 'Lekha'; // keep Sarvam voice locked to Lekha (change only if needed)
  const LOG_PREFIX = '[TTSManagerCompat]';

  // Quick no-op logger to avoid errors in environments that block console
  const log = (...args) => { try { console.log(LOG_PREFIX, ...args); } catch(e) {} };
  const warn = (...args) => { try { console.warn(LOG_PREFIX, ...args); } catch(e) {} };
  const err = (...args) => { try { console.error(LOG_PREFIX, ...args); } catch(e) {} };

  // Ensure robust player exists; if not, create a failing shim that explains the problem.
  if (!window.TTS) {
    warn('window.TTS not found. Creating shim that throws until robust player is loaded.');
    window.TTS = {
      speak: () => Promise.reject(new Error('Robust TTS player (window.TTS) not loaded')),
      cancel: () => { /* noop */ }
    };
  }

  const normalizeOpts = (opts = {}) => {
    return {
      lang: opts.lang || opts.language || 'en',
      voice: opts.voice || DEFAULT_SARVAM_VOICE,
      timeoutMs: typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 20000
    };
  };

  const createMgr = () => {
    return {
      speak: function (text, opts = {}) {
        const cfg = normalizeOpts(opts);
        // Always return a Promise
        return Promise.resolve()
          .then(() => window.TTS.speak(text, cfg))
          .then((r) => ({ success: true, provider: 'sarvam', meta: r }))
          .catch(e => {
            err('speak error', e);
            throw e;
          });
      },

      speakAndWait: function (text, opts = {}) { return this.speak(text, opts); },

      speakText: function (text, opts = {}) { return this.speak(text, opts); },

      speakTextSarvam: function (text, opts = {}) {
        opts = Object.assign({}, opts, { voice: opts.voice || DEFAULT_SARVAM_VOICE });
        return this.speak(text, opts);
      },

      // availability helpers used by some code paths
      isAvailable: function () {
        return !!(window.TTS && typeof window.TTS.speak === 'function');
      },

      cancel: function () {
        try {
          if (window.TTS && typeof window.TTS.cancel === 'function') {
            window.TTS.cancel();
          }
        } catch (e) {
          warn('cancel failed', e);
        }
        return Promise.resolve();
      },

      // Legacy methods that vr-scene.js expects
      fetchServerTTSAudio: async function (text, language) {
        const cfg = normalizeOpts({ lang: language });
        // Fetch TTS audio from server - this is now handled by TTS.speak internally
        // Return a promise that resolves with base64 audio data
        try {
          const resp = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language: cfg.lang, voice: cfg.voice })
          });
          if (!resp.ok) throw new Error(`TTS server error ${resp.status}`);
          const json = await resp.json();
          if (!json || !json.success || !json.audio) {
            throw new Error('Invalid TTS response from server');
          }
          return json.audio; // return base64 audio data
        } catch (e) {
          err('fetchServerTTSAudio error', e);
          throw e;
        }
      },

      playServerTTSAudio: async function (audioData) {
        // Play base64 audio using robust player
        if (window.TTS && window.TTS._playBase64) {
          return window.TTS._playBase64(audioData, 15000);
        }
        throw new Error('Robust TTS player _playBase64 not available');
      },

      fetchServerTTS: async function (text, language) {
        // Combined fetch + play (legacy method)
        const cfg = normalizeOpts({ lang: language });
        return this.speak(text, cfg);
      }
    };
  };

  // Install manager
  const mgr = createMgr();

  // Expose under many names (to cover all checks in the app)
  window.TTSManager = mgr;
  window.ttsManager = mgr; // lowercase version (vr-scene.js uses this)
  window.sarvamTTSManager = mgr;
  window.tourTTSManager = mgr;
  window.TTS_MAN = mgr;
  // Also set a boolean flag some code might check
  window.__TTS_MANAGER_AVAILABLE__ = true;

  // Emit a window event so code waiting for TTS can pick it up
  try {
    window.dispatchEvent(new CustomEvent('tts-manager-ready', { detail: { voice: DEFAULT_SARVAM_VOICE } }));
  } catch (e) { /* ignore */ }

  log('Sarvam-only TTS Manager installed, voice:', DEFAULT_SARVAM_VOICE);
})();
