// AI Q&A Client for QubeXP Solar System VR
// Provides intelligent question answering with TTS playback

class AIQA {
  constructor() {
    this.loading = false;
    this.outputEl = null;
    this.loaderEl = null;
    this._setupUI();
  }

  _setupUI() {
    // Create output container for answers
    if (!document.getElementById('qa-output')) {
      const output = document.createElement('div');
      output.id = 'qa-output';
      output.style.cssText = `
        position: fixed;
        left: 16px;
        top: 80px;
        max-width: 420px;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.75);
        color: #fff;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        line-height: 1.5;
        display: none;
        z-index: 99998;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
      `;
      document.body.appendChild(output);
      this.outputEl = output;
    }

    // Create loader indicator
    if (!document.getElementById('qa-loader')) {
      const loader = document.createElement('div');
      loader.id = 'qa-loader';
      loader.style.cssText = `
        position: fixed;
        right: 16px;
        top: 16px;
        padding: 10px 16px;
        background: rgba(33, 150, 243, 0.9);
        color: #fff;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        display: none;
        z-index: 99999;
        animation: pulse 1.5s ease-in-out infinite;
      `;
      loader.innerHTML = '🤔 Thinking...';
      
      // Add pulse animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(loader);
      this.loaderEl = loader;
    }
  }

  _showLoader(show = true) {
    if (this.loaderEl) {
      this.loaderEl.style.display = show ? 'block' : 'none';
    }
  }

  _showOutput(content, duration = 15000) {
    if (!this.outputEl) return;
    
    this.outputEl.innerHTML = content;
    this.outputEl.style.display = 'block';
    
    // Auto-hide after duration
    clearTimeout(this._hideTimeout);
    if (duration > 0) {
      this._hideTimeout = setTimeout(() => {
        if (this.outputEl) {
          this.outputEl.style.display = 'none';
        }
      }, duration);
    }
  }

  _hideOutput() {
    if (this.outputEl) {
      this.outputEl.style.display = 'none';
    }
  }

  async ask(question, lang = 'en') {
    if (!question || !question.trim()) {
      console.warn('[AI-QA] Empty question');
      return { ok: false, error: 'empty-question' };
    }

    if (this.loading) {
      console.warn('[AI-QA] Already processing a question');
      return { ok: false, error: 'busy' };
    }

    this.loading = true;
    this._showLoader(true);
    console.log('[AI-QA] Asking:', question, 'lang:', lang);

    let answer, source;

    try {
      // Try online AI first
      const response = await fetch('/api/ai-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), lang })
      });

      const json = await response.json();

      if (json.ok) {
        answer = json.answer;
        source = json.source || 'ai';
        console.log('[AI-QA] Answer received:', answer.slice(0, 100), 'source:', source);

        // Store in offline cache if from real AI
        if (source === 'ai' && window.offlineQACache) {
          try {
            await window.offlineQACache.store(question.trim(), answer, lang);
            console.log('[AI-QA] 💾 Cached for offline use');
          } catch (cacheErr) {
            console.warn('[AI-QA] Cache storage failed:', cacheErr);
          }
        }
      } else {
        throw new Error(json.error || 'Server error');
      }

    } catch (err) {
      // If online fails, try offline cache
      console.log('[AI-QA] Online failed, searching offline cache...');
      
      if (window.offlineQACache) {
        try {
          const cached = await window.offlineQACache.findSimilar(question.trim(), lang);
          if (cached) {
            answer = cached.answer;
            source = 'offline-cache';
            console.log('[AI-QA] ✅ Found in offline cache');
          } else {
            throw new Error('No offline answer found');
          }
        } catch (cacheErr) {
          console.error('[AI-QA] Offline cache search failed:', cacheErr);
          this._showLoader(false);
          this.loading = false;
          this._showError('network-error', lang);
          return { ok: false, error: err.message };
        }
      } else {
        this._showLoader(false);
        this.loading = false;
        this._showError('network-error', lang);
        return { ok: false, error: err.message };
      }
    }

    this._showLoader(false);
    this.loading = false;

    // Display answer
    this._displayAnswer(question, answer, source, lang);

    // Play TTS
    await this._playAnswer(answer, lang);

    return { ok: true, answer, source };
  }

  _displayAnswer(question, answer, source, lang) {
    const sourceIcon = source === 'ai' ? '🤖' : 
                       source === 'cache' ? '⚡' : 
                       source === 'offline-cache' ? '💾' : 
                       source === 'fallback' ? '📚' : '🤖';
    const sourceLabel = source === 'ai' ? 'AI' : 
                        source === 'cache' ? 'Cached' : 
                        source === 'offline-cache' ? 'Offline Cache' : 
                        source === 'fallback' ? 'Offline' : 'AI';
    
    const content = `
      <div style="margin-bottom: 8px;">
        <strong style="color: #64B5F6;">Q:</strong> ${this._escapeHtml(question)}
      </div>
      <div style="margin-bottom: 8px;">
        <strong style="color: #81C784;">A:</strong> ${this._escapeHtml(answer)}
      </div>
      <div style="font-size: 11px; color: #999; text-align: right;">
        ${sourceIcon} ${sourceLabel}
      </div>
    `;
    
    this._showOutput(content, 20000); // Show for 20 seconds
  }

  _showError(error, lang) {
    const messages = {
      en: {
        'empty-question': 'Please ask a question.',
        'busy': 'Please wait, processing previous question.',
        'network-error': 'Network error. Please try again.',
        'unknown-error': 'Sorry, I couldn\'t process that question.'
      },
      hi: {
        'empty-question': 'कृपया एक प्रश्न पूछें।',
        'busy': 'कृपया प्रतीक्षा करें, पिछला प्रश्न संसाधित हो रहा है।',
        'network-error': 'नेटवर्क त्रुटि। कृपया पुन: प्रयास करें।',
        'unknown-error': 'क्षमा करें, मैं उस प्रश्न को संसाधित नहीं कर सका।'
      },
      kn: {
        'empty-question': 'ದಯವಿಟ್ಟು ಒಂದು ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ।',
        'busy': 'ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ, ಹಿಂದಿನ ಪ್ರಶ್ನೆಯನ್ನು ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ।',
        'network-error': 'ನೆಟ್‌ವರ್ಕ್ ದೋಷ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ।',
        'unknown-error': 'ಕ್ಷಮಿಸಿ, ನಾನು ಆ ಪ್ರಶ್ನೆಯನ್ನು ಸಂಸ್ಕರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ।'
      }
    };

    const langMessages = messages[lang] || messages.en;
    const message = langMessages[error] || langMessages['unknown-error'];
    
    this._showOutput(`<div style="color: #FF5252;">⚠️ ${this._escapeHtml(message)}</div>`, 5000);
  }

  async _playAnswer(answer, lang) {
    // For regional languages, use Sarvam TTS API if available
    if (lang !== 'en' && this._shouldUseSarvamTTS(lang)) {
      console.log('[AI-QA] Using Sarvam TTS for', lang);
      try {
        await this._speakSarvam(answer, lang);
        return;
      } catch (err) {
        console.warn('[AI-QA] Sarvam TTS failed, falling back to browser:', err);
      }
    }
    
    // For English or fallback, use browser TTS
    console.log('[AI-QA] Playing answer with browser TTS');
    this._speakBrowser(answer, lang);
  }

  _shouldUseSarvamTTS(lang) {
    // Use Sarvam for Indian languages
    return ['hi', 'kn', 'ta', 'te', 'bn', 'mr', 'gu', 'ml', 'or', 'pa'].includes(lang);
  }

  async _speakSarvam(text, lang) {
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          language: lang,
          speakerId: 'saarika' // Female voice
        })
      });

      if (!response.ok) {
        throw new Error(`Sarvam TTS error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = (e) => {
          URL.revokeObjectURL(audioUrl);
          reject(e);
        };
        audio.play();
      });
    } catch (err) {
      console.error('[AI-QA] Sarvam TTS error:', err);
      throw err;
    }
  }

  _speakBrowser(text, lang = 'en') {
    try {
      if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this._langToBCP47(lang);
        utterance.rate = 0.85; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Wait for voices to load
        const speakWhenReady = () => {
          const voices = speechSynthesis.getVoices();
          console.log('[AI-QA] Available voices:', voices.length);
          
          // Try to find a voice for the target language
          const targetLang = this._langToBCP47(lang);
          let voice = voices.find(v => v.lang === targetLang);
          
          // Fallback: try language prefix (e.g., 'hi' from 'hi-IN')
          if (!voice && targetLang.includes('-')) {
            const langPrefix = targetLang.split('-')[0];
            voice = voices.find(v => v.lang.startsWith(langPrefix));
          }
          
          if (voice) {
            utterance.voice = voice;
            console.log('[AI-QA] Using voice:', voice.name, voice.lang);
          } else {
            console.warn('[AI-QA] No voice found for', targetLang, '- using default');
          }
          
          utterance.onerror = (e) => {
            console.error('[AI-QA] Speech error:', e);
          };
          
          utterance.onend = () => {
            console.log('[AI-QA] Speech completed');
          };
          
          speechSynthesis.speak(utterance);
        };
        
        // Check if voices are already loaded
        if (speechSynthesis.getVoices().length > 0) {
          speakWhenReady();
        } else {
          // Wait for voices to load
          speechSynthesis.addEventListener('voiceschanged', speakWhenReady, { once: true });
        }
      } else {
        console.warn('[AI-QA] Browser TTS not available');
      }
    } catch (err) {
      console.error('[AI-QA] Browser TTS error:', err);
    }
  }

  _langToBCP47(lang) {
    const map = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'kn': 'kn-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'bn': 'bn-IN'
    };
    return map[lang] || 'en-US';
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Public method to clear the output
  clear() {
    this._hideOutput();
  }
}

// Create global instance
window.aiQA = new AIQA();
console.log('[AI-QA] ✅ AI Q&A system ready');

// Expose simple global function for easy testing
window.askAI = (question, lang) => window.aiQA.ask(question, lang);


