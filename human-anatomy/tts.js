// Text-to-Speech Manager for Human Anatomy VR
class TTSManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.currentVoice = null;
        this.isSpeaking = false;
        this.currentLanguage = 'en-US';
        
        this.init();
    }

    init() {
        this.loadVoices();
        this.setupEventListeners();
        console.log('🗣️ TTS Manager initialized');
    }

    setupEventListeners() {
        // Listen for voices loaded
        if (this.synthesis) {
            this.synthesis.addEventListener('voiceschanged', () => {
                this.loadVoices();
            });
        }
    }

    loadVoices() {
        if (!this.synthesis) {
            console.warn('⚠️ Speech synthesis not supported');
            return;
        }

        this.voices = this.synthesis.getVoices();
        console.log(`🗣️ Loaded ${this.voices.length} voices`);
        
        // Set default voice
        this.setDefaultVoice();
    }

    setDefaultVoice() {
        // Try to find a good English voice
        const englishVoices = this.voices.filter(voice => 
            voice.lang.startsWith('en') && voice.default
        );
        
        if (englishVoices.length > 0) {
            this.currentVoice = englishVoices[0];
            console.log(`🗣️ Using voice: ${this.currentVoice.name}`);
        } else if (this.voices.length > 0) {
            this.currentVoice = this.voices[0];
            console.log(`🗣️ Using fallback voice: ${this.currentVoice.name}`);
        }
    }

    speak(text) {
        if (!this.synthesis) {
            console.warn('⚠️ Speech synthesis not available');
            return;
        }

        if (!text || text.trim() === '') {
            console.warn('⚠️ No text to speak');
            return;
        }

        // Stop any current speech
        this.stop();
        
        console.log(`🗣️ Speaking: ${text.substring(0, 50)}...`);
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice properties
        if (this.currentVoice) {
            utterance.voice = this.currentVoice;
        }
        
        utterance.rate = 0.9; // Slightly slower for educational content
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = this.currentLanguage;
        
        // Event handlers
        utterance.onstart = () => {
            this.isSpeaking = true;
            console.log('🗣️ Speech started');
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
            console.log('🗣️ Speech ended');
        };
        
        utterance.onerror = (event) => {
            this.isSpeaking = false;
            console.error('❌ Speech error:', event.error);
        };
        
        // Speak
        this.synthesis.speak(utterance);
    }

    stop() {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            console.log('⏹️ Speech stopped');
        }
    }

    pause() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.pause();
            console.log('⏸️ Speech paused');
        }
    }

    resume() {
        if (this.synthesis) {
            this.synthesis.resume();
            console.log('▶️ Speech resumed');
        }
    }

    setLanguage(language) {
        this.currentLanguage = language;
        console.log(`🗣️ Language set to: ${language}`);
    }

    setRate(rate) {
        // This will affect the next speech
        this.rate = rate;
        console.log(`🗣️ Speech rate set to: ${rate}`);
    }
}

// Global TTS instance
let ttsManager = null;

// Initialize TTS when page loads
document.addEventListener('DOMContentLoaded', () => {
    ttsManager = new TTSManager();
    
    // Make speak function globally available
    window.speak = (text) => {
        if (ttsManager) {
            ttsManager.speak(text);
        }
    };
    
    console.log('✅ TTS system ready');
});
