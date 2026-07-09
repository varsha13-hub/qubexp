/* ===== robust TTS playback (paste into tts.js or load after it) ===== */

(function () {
  // Helper: convert base64 (no data: prefix) to Blob
  function base64ToBlob(base64, mime = 'audio/mpeg') {
    try {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    } catch (e) {
      console.warn('base64ToBlob failed', e);
      return null;
    }
  }

  // Ensure audio context exists & resume on user gesture (if suspended)
  function getAudioContext() {
    if (!window.__robustAudioCtx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      window.__robustAudioCtx = new C();
      // Try to resume when user interacts: add once-only listener
      function resumeOnce() {
        if (window.__robustAudioCtx && window.__robustAudioCtx.state === 'suspended') {
          window.__robustAudioCtx.resume().catch(()=>{});
        }
        window.removeEventListener('pointerdown', resumeOnce, { once: true });
        window.removeEventListener('click', resumeOnce, { once: true });
        window.removeEventListener('keydown', resumeOnce, { once: true });
      }
      window.addEventListener('pointerdown', resumeOnce, { once: true });
      window.addEventListener('click', resumeOnce, { once: true });
      window.addEventListener('keydown', resumeOnce, { once: true });
    }
    return window.__robustAudioCtx;
  }

  // Play a blob safely. Resolves when playback ends OR when maxDuration reached OR when unrecoverable error.
  function playBlobSafely(blob, { maxDuration = 30000 } = {}) {
    return new Promise(resolve => {
      try {
        const audio = document.createElement('audio');
        audio.preload = 'auto';
        audio.src = URL.createObjectURL(blob);
        audio.crossOrigin = 'anonymous';

        let done = false;
        const cleanup = () => {
          if (done) return;
          done = true;
          try { audio.pause(); } catch (e) {}
          try { URL.revokeObjectURL(audio.src); } catch (e) {}
          audio.oncanplaythrough = audio.onended = audio.onerror = audio.onloadedmetadata = null;
          clearTimeout(timeoutId);
          resolve();
        };

        // If can play, attempt to play (may reject due to autoplay rules)
        audio.oncanplaythrough = () => {
          // try resuming audio context (best-effort)
          try { const ctx = getAudioContext(); if (ctx && ctx.state === 'suspended') ctx.resume().catch(()=>{}); } catch(e){}
          // attempt to play
          try {
            const playPromise = audio.play();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(err => {
                console.warn('audio.play() rejected:', err);
                // fallback: resolve so caller can do speechSynthesis fallback
                cleanup();
              });
            }
          } catch (err) {
            console.warn('audio.play thrown', err);
            cleanup();
          }
        };

        audio.onended = () => cleanup();
        audio.onerror = () => {
          console.warn('audio element error', audio.error);
          cleanup();
        };

        // loadedmetadata: attempt play (some browsers need it)
        audio.onloadedmetadata = () => {
          // attempt a quick play if canplaythrough didn't fire
          try {
            const p = audio.play();
            if (p && typeof p.catch === 'function') p.catch(()=>{});
          } catch (_) {}
        };

        // Fallback maxDuration (so we don't wait forever)
        const timeoutId = setTimeout(() => {
          console.warn('playBlobSafely: fallback timeout reached');
          cleanup();
        }, maxDuration + 2000);

        audio.load();
      } catch (ex) {
        console.warn('playBlobSafely failed', ex);
        resolve();
      }
    });
  }

  // Public: play base64 mp3 and return Promise that resolves when playback done (or fallback used)
  async function playAudioBase64Robust(base64, opts = {}) {
    // opts: { mime, maxDuration, allowSpeechSynthesisFallback = true }
    const mime = opts.mime || 'audio/mpeg';
    const blob = base64ToBlob(base64, mime);
    if (!blob) {
      // fallback to speechSynthesis if available
      if (opts.allowSpeechSynthesisFallback && window.speechSynthesis) {
        return new Promise(res => {
          const ut = new SpeechSynthesisUtterance(opts.fallbackText || '');
          ut.onend = ut.onerror = () => res();
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(ut);
        });
      }
      return;
    }

    // Try to play the blob; if play blocked, use speechSynthesis fallback
    // We'll also try to resume audio context before and let playBlobSafely catch rejections.
    try { const ctx = getAudioContext(); if (ctx && ctx.state === 'suspended') await ctx.resume().catch(()=>{}); } catch(e){}

    await playBlobSafely(blob, { maxDuration: opts.maxDuration || 30000 });

    // If browser blocked playback (autoplay), playBlobSafely resolves quickly — then use speechSynthesis fallback
    // Detect if speechSynthesis is needed: if no audio actually played -> we don't have reliable flag.
    // So, a conservative approach: if audioContext still suspended or audio playback never started, fallback:
    // But we can't reliably detect start here. So optionally fallback if allowSpeechSynthesisFallback true and no audio ended event fired.
    // For simplicity, attempt speechSynthesis fallback if provided fallbackText.
    if (opts.allowSpeechSynthesisFallback && opts.fallbackText && 'speechSynthesis' in window) {
      // speak fallback text (quick)
      await new Promise(res => {
        const ut = new SpeechSynthesisUtterance(opts.fallbackText);
        ut.onend = ut.onerror = () => res();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(ut);
      });
    }
  }

  // Export the robust function so other scripts can call it (e.g. vr-scene.js)
  window.playAudioBase64Robust = playAudioBase64Robust;

  /* ===== speakText wrapper that calls your server TTS and plays using the robust player =====
     Usage: await speakTextRobust({ text, lang, provider, timeoutMs, fallbackText })
     The function assumes you have an existing route that returns JSON { success:true, audio:'<base64>', format:'mp3' }
     If your current speakText already does that, replace the inner fetch URL with your existing endpoint.
  */
  async function speakTextRobust({ text, lang = 'en', provider = 'sarvam', timeoutMs = 30000, fallbackText = null }) {
    // Make the server TTS request (adjust URL and payload to match your backend)
    try {
      // Example fetch - adapt path/params to your existing code:
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, lang: lang, provider: provider })
      });

      if (!resp.ok) {
        console.warn('TTS server responded with non-OK:', resp.status);
        // fallback to speechSynthesis if available
        if (fallbackText || 'speechSynthesis' in window) {
          return new Promise(res => {
            const ut = new SpeechSynthesisUtterance(fallbackText || text);
            ut.onend = ut.onerror = () => res();
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(ut);
          });
        }
        return;
      }

      const json = await resp.json();
      if (!json || !json.audio) {
        console.warn('TTS server returned no audio property');
        if ('speechSynthesis' in window) {
          return new Promise(res => {
            const ut = new SpeechSynthesisUtterance(fallbackText || text);
            ut.onend = ut.onerror = () => res();
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(ut);
          });
        }
        return;
      }

      // json.audio is expected to be base64 (no data: prefix). json.format may be 'mp3' etc.
      const format = json.format || 'mp3';
      // Play using robust base64 player. Provide fallback text so that if playback fails we can speak the text.
      await playAudioBase64Robust(json.audio, { mime: `audio/${format}`, maxDuration: timeoutMs, allowSpeechSynthesisFallback: true, fallbackText: fallbackText || text });

    } catch (err) {
      console.warn('speakTextRobust caught error', err);
      // Fallback to speechSynthesis
      if ('speechSynthesis' in window) {
        return new Promise(res => {
          const ut = new SpeechSynthesisUtterance(fallbackText || text);
          ut.onend = ut.onerror = () => res();
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(ut);
        });
      }
    }
  }

  window.speakTextRobust = speakTextRobust;

  console.log('[TTS fix] playAudioBase64Robust & speakTextRobust installed.');
})();
