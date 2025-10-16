// Picovoice Offline Voice Manager
// Fully offline voice control that works on VR headsets

const PICOVOICE_ACCESS_KEY = 'R5m1RPJf9fAKcaDA/9Vz6jsQTd+W6ynHERQ7w8A48jo4sxVdnnWdrQ==';

class PicovoiceManager {
  constructor() {
    this.picovoice = null;
    this.isListening = false;
    this.currentLang = 'en';
  }

  async init(lang = 'en') {
    this.currentLang = lang;
    console.log(`[Picovoice] Initializing for ${lang}...`);

    try {
      // Dynamic import of Picovoice modules
      const PicovoiceModule = await import('@picovoice/picovoice-web');
      const WebVoiceProcessorModule = await import('@picovoice/web-voice-processor');
      
      const { Picovoice } = PicovoiceModule;
      const { WebVoiceProcessor } = WebVoiceProcessorModule;

      const keywordPath = `pv/cutie_${lang}.ppn`;
      const contextPath = `pv/context_${lang}.rhn`;

      console.log(`[Picovoice] Loading models: ${keywordPath}, ${contextPath}`);

      this.picovoice = await Picovoice.create(
        PICOVOICE_ACCESS_KEY,
        keywordPath,
        this._onWakeWord.bind(this),
        contextPath,
        this._onInference.bind(this)
      );

      await WebVoiceProcessor.subscribe(this.picovoice);
      this.isListening = true;

      console.log('[Picovoice] ✅ Ready and listening for "Cutie"');
      
      // Show UI feedback
      this._showStatus('Voice ready - say "Cutie"', 3000);
      
      return true;
    } catch (err) {
      console.error('[Picovoice] Initialization failed:', err);
      this._showStatus('Offline voice not available - using text input', 3000);
      return false;
    }
  }

  _showStatus(message, duration = 2000) {
    // Try to use the voice-label UI
    const label = document.getElementById('voice-label');
    if (label) {
      label.textContent = message;
      label.style.display = 'block';
      setTimeout(() => {
        label.style.display = 'none';
      }, duration);
    }
  }

  _onWakeWord() {
    console.log('[Picovoice] 🎤 Wake word "Cutie" detected!');
    
    // Show UI feedback
    this._showStatus('Listening... Say your command', 6000);
    
    // Play beep if audio context available
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 100);
    } catch (e) {
      console.warn('[Picovoice] Could not play beep');
    }

    // Pause TTS if playing
    if (window.ttsManager && window.ttsManager.stop) {
      window.ttsManager.stop();
    }
  }

  _onInference(inference) {
    console.log('[Picovoice] Inference:', inference);

    if (!inference.isUnderstood) {
      console.warn('[Picovoice] Command not understood');
      this._showStatus('Command not understood', 2000);
      return;
    }

    const intent = inference.intent;
    const slots = inference.slots || {};

    console.log('[Picovoice] Intent:', intent, 'Slots:', slots);
    this._showStatus('Command received ✓', 1500);

    // Handle intents
    this._handleIntent(intent, slots);
  }

  _handleIntent(intent, slots) {
    console.log('[Picovoice] Handling:', intent, slots);

    switch (intent) {
      case 'start_tour':
        if (window.startTour) {
          console.log('[Picovoice] → Starting tour');
          window.startTour();
        }
        break;

      case 'pause_tour':
        if (window.pauseTour) {
          console.log('[Picovoice] → Pausing tour');
          window.pauseTour();
        }
        break;

      case 'resume_tour':
        if (window.resumeTour) {
          console.log('[Picovoice] → Resuming tour');
          window.resumeTour();
        }
        break;

      case 'land':
        if (window.landOnPlanet && slots.planet) {
          console.log('[Picovoice] → Landing on', slots.planet);
          window.landOnPlanet(slots.planet.toLowerCase());
        }
        break;

      case 'next':
        if (window.nextStep) {
          console.log('[Picovoice] → Next step');
          window.nextStep();
        }
        break;

      case 'previous':
        if (window.prevStep) {
          console.log('[Picovoice] → Previous step');
          window.prevStep();
        }
        break;

      case 'qa':
        if (window.aiQA && slots.question) {
          console.log('[Picovoice] → Asking:', slots.question);
          window.aiQA.ask(slots.question, this.currentLang);
        }
        break;

      case 'language_switch':
        if (window.setLanguage && slots.lang) {
          console.log('[Picovoice] → Switching to', slots.lang);
          window.setLanguage(slots.lang);
        }
        break;

      default:
        console.warn('[Picovoice] Unknown intent:', intent);
        this._showStatus('Unknown command', 2000);
    }
  }

  async stop() {
    if (this.picovoice) {
      try {
        const WebVoiceProcessorModule = await import('@picovoice/web-voice-processor');
        const { WebVoiceProcessor } = WebVoiceProcessorModule;
        
        await WebVoiceProcessor.unsubscribe(this.picovoice);
        this.picovoice.release();
        this.isListening = false;
        console.log('[Picovoice] Stopped');
      } catch (err) {
        console.error('[Picovoice] Error stopping:', err);
      }
    }
  }

  async switchLanguage(lang) {
    console.log(`[Picovoice] Switching to ${lang}...`);
    await this.stop();
    await this.init(lang);
  }
}

// Create global instance
window.picovoiceManager = new PicovoiceManager();
console.log('[Picovoice] ✅ Manager created');

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PicovoiceManager;
}

