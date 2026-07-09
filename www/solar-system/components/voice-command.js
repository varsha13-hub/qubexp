// improved voice-command.js — stricter wake-word, pause/resume TTS, beep feedback
AFRAME.registerComponent('voice-command', {
  schema: {
    lang: { type: 'string', default: 'en-US' },
    wakeWord: { type: 'string', default: 'cutie' }, // lower-case
    autoStartAfterGesture: { type: 'boolean', default: true },
    awaitTimeoutMs: { type: 'number', default: 6000 },
    minConfidence: { type: 'number', default: 0.45 } // require this for final commands
  },

  init() {
    this.recognizer = null;
    this.listening = false;
    this.awaitingCommand = false;
    this._awaitTimeout = null;
    this._ttsWasPlaying = false;
    this._lastWakeWordTime = 0; // prevent rapid wake word detection
    this._setupRecognition();
    // prepare a tiny beep for feedback
    this._setupBeep();
    if (this.data.autoStartAfterGesture) {
      const startOnce = () => {
        this.startHotwordListener().catch(()=>{});
        window.removeEventListener('click', startOnce);
        window.removeEventListener('touchstart', startOnce);
      };
      window.addEventListener('click', startOnce, { once: true });
      window.addEventListener('touchstart', startOnce, { once: true });
    }
    console.log('[voice-wiring] Wake-word voice control initialized');
  },

  _setupBeep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this._audioCtx = new Ctx();
      this._gain = this._audioCtx.createGain();
      this._gain.gain.value = 0.12;
      this._gain.connect(this._audioCtx.destination);
    } catch (e) { this._audioCtx = null; }
  },

  _beep(duration = 120) {
    if (!this._audioCtx) return;
    const o = this._audioCtx.createOscillator();
    o.type = 'sine'; o.frequency.value = 800;
    o.connect(this._gain);
    o.start();
    setTimeout(()=>{ try { o.stop(); o.disconnect(); } catch(e){} }, duration);
  },

  _setupRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('[voice-command] Web Speech API not available.');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognizer = new SR();
    this.recognizer.lang = this.data.lang;
    this.recognizer.interimResults = true;
    this.recognizer.continuous = true;
    this.recognizer.maxAlternatives = 1;

    this.recognizer.onresult = (evt) => this._onResult(evt);
    this.recognizer.onerror = (e) => {
      console.warn('[voice-command] error', e);
    };
    this.recognizer.onend = () => {
      this.listening = false;
      if (!this._stoppedByUser) {
        setTimeout(()=> this.startHotwordListener().catch(()=>{}), 250);
      }
    };
  },

  async startHotwordListener() {
    if (!this.recognizer) this._setupRecognition();
    if (!this.recognizer) return Promise.reject('no-recognizer');
    if (this.listening) { console.log('[voice-command] Already listening, skipping start'); return; }
    this._stoppedByUser = false;
    try {
      this.recognizer.start();
      this.listening = true;
      this.el.emit('voice-state', { state: 'hotword-listening' });
      console.log('[voice-command] Starting hotword listener...');
      return Promise.resolve();
    } catch (e) { return Promise.reject(e); }
  },

  stopHotwordListener() {
    this._stoppedByUser = true;
    try { this.recognizer && this.recognizer.stop(); } catch(e) {}
    this.listening = false;
    this.el.emit('voice-state', { state: 'stopped' });
  },

  _onResult(evt) {
    let interim = '';
    let final = '';
    for (let i = evt.resultIndex; i < evt.results.length; ++i) {
      const r = evt.results[i];
      if (r.isFinal) final += r[0].transcript;
      else interim += r[0].transcript;
    }

    // 1) Check final results first
    if (final && final.trim()) {
      const loweredFinal = final.trim().toLowerCase();
      console.log('[voice-command] Final result:', loweredFinal);
      // if in awaiting mode, this final is the command
      if (this.awaitingCommand) {
        // check confidence if available
        const alt = evt.results[evt.results.length-1][0];
        const conf = alt && alt.confidence ? alt.confidence : 1;
        if (conf < this.data.minConfidence) {
          // low confidence -> ask to repeat
          this._handleLowConfidence(loweredFinal);
        } else {
          this._handleCommand(loweredFinal, conf);
        }
        this.awaitingCommand = false;
        this.el.emit('voice-state', { state: 'command-handled', text: loweredFinal, confidence: conf });
        // resume TTS if we paused it earlier
        this._tryResumeTTS();
        return;
      }

      // final could contain wake word + command in same phrase
      if (this._containsWakeWord(loweredFinal)) {
        const after = this._textAfterWake(loweredFinal);
        if (after) {
          // got a command in same final phrase
          const alt = evt.results[evt.results.length-1][0];
          const conf = alt && alt.confidence ? alt.confidence : 1;
          if (conf < this.data.minConfidence) { this._handleLowConfidence(after); }
          else { this._handleCommand(after, conf); }
          this._tryResumeTTS();
          return;
        } else {
          // wake word only -> enter awaiting mode
          this._activateAwaitingMode();
          return;
        }
      }
    }

        // 2) Interim wake-word detection (fast path) - only check if not already awaiting
        if (interim && interim.trim() && !this.awaitingCommand) {
          const t = interim.trim().toLowerCase();
          // Much stricter: wake word must be at the very beginning
          if (this._containsWakeWord(t)) {
            this._activateAwaitingMode();
          }
        }
  },

      _containsWakeWord(text) {
        const textLower = text.trim().toLowerCase();
        
        // Check for multiple variations of "cutie"
        const wakeWordVariations = [
          /^cutie\b/i,      // cutie
          /^cuty\b/i,       // cuty
          /^qt\b/i,         // qt
          /^q\.?t\.?\b/i,   // q.t. or q t
          /^cutey\b/i,      // cutey
          /^kuti\b/i,       // kuti (phonetic)
          /^kyuti\b/i       // kyuti (phonetic)
        ];
        
        // Test if text starts with any variation
        return wakeWordVariations.some(pattern => pattern.test(textLower));
      },

  _textAfterWake(text) {
    const textLower = text.toLowerCase();
    
    // Try to find where the wake word ends
    const patterns = [
      /^cutie\b/i,
      /^cuty\b/i,
      /^qt\b/i,
      /^q\.?t\.?\b/i,
      /^cutey\b/i,
      /^kuti\b/i,
      /^kyuti\b/i
    ];
    
    for (const pattern of patterns) {
      const match = textLower.match(pattern);
      if (match) {
        return text.slice(match[0].length).trim();
      }
    }
    
    return '';
  },

      _activateAwaitingMode() {
        if (this.awaitingCommand) return;
        
        // Prevent rapid wake word detection (debounce)
        const now = Date.now();
        if (now - this._lastWakeWordTime < 2000) {
          console.log('[voice-command] Ignoring rapid wake word detection');
          return;
        }
        this._lastWakeWordTime = now;
        
        this.awaitingCommand = true;
        console.log('[voice-command] wake word detected — awaiting command');
        // beep & UI
        this._beep(120);
        this.el.emit('voice-state', { state: 'listening' });

        // if TTS is playing, pause it to improve recognition clarity
        this._pauseTTSIfPlaying();

        clearTimeout(this._awaitTimeout);
        this._awaitTimeout = setTimeout(()=> {
          if (this.awaitingCommand) {
            this.awaitingCommand = false;
            this.el.emit('voice-state', { state: 'listening-timeout' });
            this._tryResumeTTS();
            console.log('[voice-command] awaiting command timed out');
          }
        }, this.data.awaitTimeoutMs);
      },

  _pauseTTSIfPlaying() {
    try {
      // Check for your specific TTS manager
      if (window.ttsManager && window.ttsManager.stop) {
        this._ttsWasPlaying = true;
        window.ttsManager.stop();
        console.log('[voice-command] Paused TTS for clearer input');
      } else if (window.tts && window.tts.stop) {
        this._ttsWasPlaying = true;
        window.tts.stop();
        console.log('[voice-command] Paused TTS for clearer input');
      } else {
        this._ttsWasPlaying = false;
      }
    } catch (e) { 
      this._ttsWasPlaying = false; 
    }
  },

  _tryResumeTTS() {
    try {
      if (this._ttsWasPlaying) {
        // Try to resume TTS if it was playing
        if (window.ttsManager && window.ttsManager.resume) {
          window.ttsManager.resume();
          console.log('[voice-command] Resumed TTS');
        } else if (window.tts && window.tts.resume) {
          window.tts.resume();
          console.log('[voice-command] Resumed TTS');
        } else {
          console.log('[voice-command] TTS was paused for voice input - tour will continue naturally');
        }
        this._ttsWasPlaying = false;
      }
    } catch (e) {
      console.log('[voice-command] Could not resume TTS, tour will continue naturally');
    }
  },

  _handleLowConfidence(text) {
    // polite ask to repeat using TTS or speechSynthesis
    console.log('[voice-command] Low confidence for:', text);
    if (window.tts && window.tts.playFile) {
      // fallback to speechSynthesis quick prompt if no file
      try { speechSynthesis.speak(new SpeechSynthesisUtterance('I did not catch that, please repeat.')); } catch(e){}
    } else {
      try { speechSynthesis.speak(new SpeechSynthesisUtterance('Please repeat.')); } catch(e){}
    }
    // keep awaitingCommand true — user can repeat within timeout
  },

      _handleCommand(text, confidence = 1) {
        // parse into intent (similar to previous)
        console.log('[voice-command] Processing command:', text, 'conf:', confidence);
        const intent = { cmd: 'unknown', text, planet: null, lang: null, confidence };
        if (/start.*tour|begin.*tour/.test(text)) intent.cmd = 'start-tour';
        else if (/\bpause\b/.test(text)) intent.cmd = 'pause-tour';
        else if (/\b(resume|continue|play)\b/.test(text)) intent.cmd = 'resume-tour';
        else if (/\bnext\b/.test(text)) intent.cmd = 'next';
        else if (/\b(previous|back)\b/.test(text)) intent.cmd = 'previous';
        else if (/\bland( on)? ([a-z]+)/.test(text)) {
          const m = text.match(/\bland( on)? ([a-z]+)/); if (m && m[2]) { intent.cmd = 'land'; intent.planet = m[2]; }
        } else if (/(go to|goto|visit|open) ([a-z]+)/.test(text)) {
          const m = text.match(/(go to|goto|visit|open) ([a-z]+)/); if (m && m[2]) { intent.cmd = 'goto'; intent.planet = m[2]; }
        } else if (/language (?:to|is) (\w{2})|switch to (\w{2})/.test(text)) {
          const m = text.match(/(?:language (?:to|is) |switch to )(\w{2})/); if (m && m[1]) { intent.cmd = 'language'; intent.lang = m[1]; }
        } else if (/(what|who|where|when|why|how|tell me|explain|describe)/.test(text)) {
          // AI question - capture the full question
          intent.cmd = 'ask-ai';
          intent.question = text;
        }

        // emit structured event
        console.log('[voice-command] Emitting command:', intent);
        this.el.emit('voice-cmd', intent);
      },

  remove() {
    try { this.recognizer && this.recognizer.stop(); } catch(e){}
    clearTimeout(this._awaitTimeout);
  }
});

