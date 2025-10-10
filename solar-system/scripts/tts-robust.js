// tts.js - Robust Sarvam-only player using AudioContext + decodeAudioData
// Expects your server endpoint at /api/sarvam-tts to accept POST { text, lang, voice }
// and return JSON { success: true, audio: '<BASE64_MP3>' }

const TTS = (function () {
  const DEFAULT_TIMEOUT_MS = 15000;

  let audioUnlocked = false;
  let unlockInstalled = false;
  let ctx = null;
  let currentSource = null;
  let queue = []; // queued requests until ready/unlocked
  let playingPromise = null;

  // Create/resume AudioContext
  function ensureAudioContext() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) {
        throw new Error('Web Audio API not supported');
      }
      ctx = new C();
    }
    return ctx;
  }

  // Install a one-time unlock triggered by any user gesture (pointerdown or keydown)
  function installAudioUnlock() {
    if (unlockInstalled) return;
    unlockInstalled = true;

    const tryUnlock = async () => {
      try {
        ensureAudioContext();
        if (ctx.state === 'suspended') {
          await ctx.resume().catch(()=>{/* ignore */});
        }
        // Play a very short silent buffer to ensure browsers fully unlock audio
        const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        src.start(0);
        // Mark unlocked after a tiny timeout
        setTimeout(() => {
          audioUnlocked = true;
          flushQueue();
        }, 50);
      } catch (err) {
        console.warn('[TTS] unlock failed', err);
      } finally {
        window.removeEventListener('pointerdown', tryUnlock);
        window.removeEventListener('keydown', tryUnlock);
      }
    };

    window.addEventListener('pointerdown', tryUnlock, { once: true, passive: true });
    window.addEventListener('keydown', tryUnlock, { once: true, passive: true });
  }

  // flush queued requests after unlock
  function flushQueue() {
    if (!audioUnlocked) return;
    while (queue.length) {
      const q = queue.shift();
      _playBase64(q.base64, q.timeoutMs).then(q.resolve).catch(q.reject);
    }
  }

  // Cancel currently playing audio
  function cancelCurrent() {
    try {
      if (currentSource) {
        try { currentSource.stop(0); } catch (e) {}
        currentSource.disconnect();
      }
    } finally {
      currentSource = null;
      playingPromise = null;
    }
  }

  // Play base64 mp3 by decoding to AudioBuffer (more robust than <audio>)
  function _playBase64(base64, timeoutMs = DEFAULT_TIMEOUT_MS) {
    return new Promise(async (resolve, reject) => {
      try {
        ensureAudioContext();
      } catch (err) {
        return reject(err);
      }

      // If not unlocked yet, push into queue and return a promise that resolves later
      if (!audioUnlocked) {
        queue.push({
          base64,
          timeoutMs,
          resolve,
          reject,
        });
        // ensure unlock listeners are installed
        installAudioUnlock();
        return;
      }

      // decode base64 to ArrayBuffer
      let audioData;
      try {
        const byteString = atob(base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        audioData = ab;
      } catch (err) {
        return reject(new Error('Failed to decode base64 audio'));
      }

      let timeoutHandle = null;
      let settled = false;

      const cleanup = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        // stop and disconnect source
        try { if (currentSource) { currentSource.onended = null; currentSource.stop(0); currentSource.disconnect(); } } catch (e) {}
        currentSource = null;
        playingPromise = null;
      };

      // global timeout
      timeoutHandle = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Audio playback timeout'));
      }, timeoutMs);

      try {
        const audioBuffer = await ctx.decodeAudioData(audioData.slice(0));
        // Cancel any running playback (we want sequential)
        cancelCurrent();

        const src = ctx.createBufferSource();
        src.buffer = audioBuffer;
        src.connect(ctx.destination);
        currentSource = src;

        src.onended = () => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve();
        };

        // Start playback
        src.start(0);
        // store playingPromise
        playingPromise = new Promise((res, rej) => {
          // will resolve via onended
          const onFinish = () => res();
          const onErr = (e) => rej(e);
          // tie to the same resolve/reject
          playingPromise.then(onFinish).catch(onErr);
        });

      } catch (err) {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err);
      }
    });
  }

  // Speak text via Sarvam backend
  async function speakTextSarvam(text, opts = {}) {
    const { lang = 'en', voice = undefined, timeoutMs = DEFAULT_TIMEOUT_MS } = opts;
    
    // Map voice names to Sarvam speaker names
    const sarvamSpeaker = voice === 'Lekha' ? 'meera' : (voice || 'meera'); // Sarvam uses 'meera' for female Hindi voice
    
    // keep Sarvam-only: POST to your server route
    const payload = { 
      text, 
      language: lang, // Use 'language' instead of 'lang'
      speaker: sarvamSpeaker // Use 'speaker' for Sarvam API
    };

    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`TTS server error ${resp.status}: ${errorText}`);
      }
      const json = await resp.json();
      
      // Strict validation
      if (!json || json.success !== true || typeof json.audio !== 'string' || json.audio.trim() === '') {
        const short = JSON.stringify({
          success: json && json.success,
          audioLength: (json && json.audio) ? (json.audio.length) : 0,
          provider: json && json.provider
        });
        throw new Error('Invalid TTS response from server: ' + short);
      }
      
      const base64 = json.audio;

      // If not unlocked, _playBase64 will queue
      return new Promise((resolve, reject) => {
        try {
          const playPromise = _playBase64(base64, timeoutMs);
          // If _playBase64 queued it, playPromise may be undefined; handle via queue handlers already attached
          if (playPromise) {
            playPromise.then(() => resolve({ success: true, provider: json.provider || 'sarvam' })).catch(reject);
          } else {
            // queued: resolve/reject will be called when flushed
            resolve({ success: true, provider: 'queued' });
          }
        } catch (err) {
          reject(err);
        }
      });
    } catch (err) {
      console.warn('[TTS] speakTextSarvam error:', err.message);
      throw err;
    }
  }

  // Small API
  return {
    installAudioUnlock,
    speak: speakTextSarvam,
    _playBase64,
    cancel: () => { cancelCurrent(); queue = []; },
    // helper to check state
    isUnlocked: () => audioUnlocked,
  };
})();

// Make TTS available globally
window.TTS = TTS;
