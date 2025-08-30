// Text-to-Speech Manager
class TTSManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.currentVoice = null;
        this.isSpeaking = false;
        this.currentLanguage = 'en';
        
        this.init();
    }

    init() {
        this.loadVoices();
        this.setupEventListeners();
        this.loadLanguageFromStorage();
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
            console.warn('Speech synthesis not supported');
            return;
        }

        this.voices = this.synthesis.getVoices();
        console.log('Loaded voices:', this.voices.length);
        
        // Set default voice
        this.setVoiceForLanguage(this.currentLanguage);
    }

    loadLanguageFromStorage() {
        const savedLanguage = localStorage.getItem('solarlearn-language');
        if (savedLanguage) {
            this.currentLanguage = savedLanguage;
            this.setVoiceForLanguage(savedLanguage);
        }
    }

    setVoiceForLanguage(languageCode) {
        if (!this.synthesis || this.voices.length === 0) {
            return;
        }

        // Try to find a voice for the specified language
        let voice = this.voices.find(v => 
            v.lang.startsWith(languageCode) || 
            v.lang.startsWith(languageCode.split('-')[0])
        );

        // For Indian languages that don't have TTS support, fall back to English
        const indianLanguages = ['kn', 'ta', 'te', 'mr', 'bn', 'gu', 'ur'];
        if (indianLanguages.includes(languageCode) && !voice) {
            console.log(`No TTS voice found for ${languageCode}, falling back to English`);
            voice = this.voices.find(v => v.lang.startsWith('en')) || this.voices[0];
        } else if (!voice) {
            // Fallback to English for other languages
            voice = this.voices.find(v => v.lang.startsWith('en')) || this.voices[0];
        }

        this.currentVoice = voice;
        console.log(`Set voice for language ${languageCode}:`, voice ? voice.name : 'none');
    }

    // Helper method to fetch and play server TTS audio
    async fetchServerTTS(text, languageCode) {
        try {
            console.log(`Requesting server TTS for ${languageCode}:`, text.substring(0, 50) + '...');
            
            const resp = await fetch('/api/ai/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, lang: languageCode })
            });
            
            // Check if response is successful
            if (!resp.ok) {
                // Try to get error details
                let errorMessage = `HTTP ${resp.status}`;
                try {
                    const errorData = await resp.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // If we can't parse JSON, use status text
                    errorMessage = resp.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            // Get content type
            const contentType = resp.headers.get('content-type') || '';
            
            // Handle audio response (most common case)
            if (contentType.includes('audio/') || contentType.includes('application/octet-stream')) {
                const blob = await resp.blob();
                if (blob.size === 0) {
                    throw new Error('Empty audio response from server');
                }
                
                const url = URL.createObjectURL(blob);
                console.log(`✅ Server TTS successful for ${languageCode}`);
                return url;
            }
            
            // Handle JSON response (fallback case)
            if (contentType.includes('application/json')) {
                const jsonData = await resp.json();
                console.warn('Server returned JSON response:', jsonData);
                
                if (jsonData.error) {
                    throw new Error(jsonData.error);
                }
                
                if (jsonData.fallback === 'client') {
                    throw new Error('SERVER_FALLBACK_TO_CLIENT');
                }
                
                // If it's a successful JSON response with audio data
                if (jsonData.audio) {
                    const blob = new Blob([jsonData.audio], { type: 'audio/mpeg' });
                    const url = URL.createObjectURL(blob);
                    console.log(`✅ Server TTS successful for ${languageCode} (JSON response)`);
                    return url;
                }
                
                throw new Error('Unexpected JSON response from server TTS');
            }
            
            // If we can't determine the content type, try to handle as audio
            try {
                const blob = await resp.blob();
                if (blob.size > 0) {
                    const url = URL.createObjectURL(blob);
                    console.log(`✅ Server TTS successful for ${languageCode} (unknown content type)`);
                    return url;
                }
            } catch (e) {
                console.warn('Failed to handle response as blob:', e);
            }
            
            throw new Error('Unexpected response type from server TTS');
            
        } catch (error) {
            console.error('Server TTS error:', error);
            
            // If server explicitly suggests client fallback, re-throw
            if (error.message === 'SERVER_FALLBACK_TO_CLIENT') {
                throw error;
            }
            
            // For other errors, try to provide helpful message
            throw new Error(`Server TTS failed: ${error.message}`);
        }
    }

    async playAudioUrl(url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.src = url;
            audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
            audio.onerror = reject;
            audio.play().catch(reject);
        });
    }

    async speak(text, languageCode = null) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not supported');
            return;
        }

        if (this.isSpeaking) {
            this.stop();
        }

        // Set language if provided
        if (languageCode && languageCode !== this.currentLanguage) {
            this.currentLanguage = languageCode;
            this.setVoiceForLanguage(languageCode);
        }

        const lang = languageCode || this.currentLanguage;
        const indianLanguages = ['hi','kn','ta','te','mr','bn','gu','ur','ml','pa','or','as'];

        // Create utterance for native speech synthesis
        const utterance = new SpeechSynthesisUtterance(text);

        // 1) If we have a native voice for the target language, use it
        const nativeVoice = this.voices?.find(v =>
            v.lang && (v.lang.toLowerCase().startsWith(lang.toLowerCase()))
        );

        if (nativeVoice) {
            utterance.lang = nativeVoice.lang;
            utterance.voice = nativeVoice;
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            
            // Event handlers
            utterance.onstart = () => {
                console.log('TTS started (native):', text);
                this.isSpeaking = true;
            };

            utterance.onend = () => {
                console.log('TTS ended (native)');
                this.isSpeaking = false;
            };

            utterance.onerror = (event) => {
                console.error('TTS error (native):', event.error);
                this.isSpeaking = false;
                this.handleTTSError(event.error);
            };

            this.synthesis.speak(utterance);
            return;
        }

        // 2) If it's an Indian language and no native voice exists → use server TTS
        if (indianLanguages.includes(lang)) {
            try {
                console.log(`Using server TTS for ${lang}:`, text);
                const url = await this.fetchServerTTS(text, lang);
                this.isSpeaking = true;
                await this.playAudioUrl(url);
                this.isSpeaking = false;
                return;
            } catch (e) {
                console.warn(`Server TTS failed for ${lang}, falling back to browser TTS:`, e.message);
                
                // If server explicitly suggests client fallback, continue to browser TTS
                if (e.message === 'SERVER_FALLBACK_TO_CLIENT') {
                    console.log('Server suggested client fallback, using browser TTS');
                } else {
                    // For other errors, show a user-friendly message but don't block
                    console.log(`Server TTS unavailable for ${lang}. Using browser TTS instead.`);
                }
            }
        }

        // 3) Final fallback: English voice (so something is audible)
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        // Event handlers for fallback
        utterance.onstart = () => {
            console.log('TTS started (fallback):', text);
            this.isSpeaking = true;
        };

        utterance.onend = () => {
            console.log('TTS ended (fallback)');
            this.isSpeaking = false;
        };

        utterance.onerror = (event) => {
            console.error('TTS error (fallback):', event.error);
            this.isSpeaking = false;
            this.handleTTSError(event.error);
        };

        this.synthesis.speak(utterance);
    }

    async speakTranslated(text, targetLanguage) {
        try {
            // First translate the text
            const translatedText = await this.translateText(text, targetLanguage);
            
            // Then speak the translated text
            await this.speak(translatedText, targetLanguage);
            
            return translatedText;
        } catch (error) {
            console.error('Error in speakTranslated:', error);
            // Fallback to speaking original text
            await this.speak(text, 'en');
        }
    }

    async translateText(text, targetLanguage) {
        try {
            const response = await fetch('/api/ai/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    sourceLang: 'en',
                    targetLang: targetLanguage
                })
            });

            if (!response.ok) {
                throw new Error('Translation request failed');
            }

            const result = await response.json();
            return result.translatedText;
        } catch (error) {
            console.error('Translation error:', error);
            throw error;
        }
    }

    stop() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }

    pause() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.pause();
        }
    }

    resume() {
        if (this.synthesis) {
            this.synthesis.resume();
        }
    }

    handleTTSError(error) {
        let errorMessage = 'Text-to-speech error';
        
        switch (error) {
            case 'interrupted':
                errorMessage = 'Speech was interrupted';
                break;
            case 'audio-busy':
                errorMessage = 'Audio system is busy';
                break;
            case 'audio-hardware':
                errorMessage = 'Audio hardware error';
                break;
            case 'network':
                errorMessage = 'Network error';
                break;
            case 'synthesis-unavailable':
                errorMessage = 'Speech synthesis unavailable';
                break;
            case 'synthesis-failed':
                errorMessage = 'Speech synthesis failed';
                break;
            case 'language-unavailable':
                errorMessage = 'Language not available for speech';
                break;
            case 'voice-unavailable':
                errorMessage = 'Voice not available';
                break;
            case 'text-too-long':
                errorMessage = 'Text too long for speech synthesis';
                break;
            case 'invalid-argument':
                errorMessage = 'Invalid argument for speech synthesis';
                break;
            case 'not-allowed':
                errorMessage = 'Speech synthesis not allowed';
                break;
            default:
                errorMessage = `Speech synthesis error: ${error}`;
        }
        
        console.error(errorMessage);
        // Don't show error dialog - just log it
        // this.showError(errorMessage);
    }

    getAvailableLanguages() {
        if (!this.voices || this.voices.length === 0) {
            return [];
        }

        const languages = new Set();
        this.voices.forEach(voice => {
            const lang = voice.lang.split('-')[0];
            languages.add(lang);
        });

        return Array.from(languages).sort();
    }

    getVoicesForLanguage(languageCode) {
        if (!this.voices || this.voices.length === 0) {
            return [];
        }

        return this.voices.filter(voice => 
            voice.lang.startsWith(languageCode) || 
            voice.lang.startsWith(languageCode.split('-')[0])
        );
    }

    setLanguage(languageCode) {
        this.currentLanguage = languageCode;
        this.setVoiceForLanguage(languageCode);
    }

    getCurrentVoice() {
        return this.currentVoice;
    }

    isSupported() {
        return !!window.speechSynthesis;
    }

    isSpeaking() {
        return this.isSpeaking;
    }

    showError(message) {
        // COMPLETELY DISABLED - NO ERROR DIALOGS
        console.log('TTS Error (suppressed):', message);
        // Do nothing - no error dialogs will appear
    }

    // Utility methods for testing
    testVoice(languageCode = 'en') {
        const testTexts = {
            'en': 'Hello, this is a test of the text-to-speech system.',
            'es': 'Hola, esto es una prueba del sistema de texto a voz.',
            'fr': 'Bonjour, ceci est un test du système de synthèse vocale.',
            'de': 'Hallo, dies ist ein Test des Text-zu-Sprache-Systems.',
            'hi': 'नमस्ते, यह टेक्स्ट-टू-स्पीच सिस्टम का परीक्षण है।',
            'kn': 'ನಮಸ್ಕಾರ, ಇದು ಟೆಕ್ಸ್ಟ್-ಟು-ಸ್ಪೀಚ್ ಸಿಸ್ಟಮ್‌ನ ಪರೀಕ್ಷೆಯಾಗಿದೆ.',
            'ta': 'வணக்கம், இது உரை-முதல்-பேச்சு அமைப்பின் சோதனையாகும்.',
            'te': 'నమస్కారం, ఇది టెక್స్ట్-టు-స్పీచ్ సిస్టమ్ యొక్క పరీక్ష.',
            'mr': 'नमस्कार, हे टेक्स्ट-टू-स्पीच सिस्टमचे परीक्षण आहे.',
            'bn': 'হ্যালো, এটি টেক্সট-টু-স্পিচ সিস্টেমের একটি পরীক্ষা।'
        };

        const testText = testTexts[languageCode] || testTexts['en'];
        this.speak(testText, languageCode);
    }

    // Method to speak planet information
    async speakPlanetInfo(planet, languageCode = null) {
        if (!planet) return;

        const text = `${planet.name}. ${planet.description}`;
        
        if (languageCode && languageCode !== 'en') {
            await this.speakTranslated(text, languageCode);
        } else {
            await this.speak(text, languageCode || this.currentLanguage);
        }
    }

    // Method to speak facts
    async speakFacts(facts, languageCode = null) {
        if (!facts || facts.length === 0) return;

        const text = `Here are some facts: ${facts.join('. ')}.`;
        
        if (languageCode && languageCode !== 'en') {
            await this.speakTranslated(text, languageCode);
        } else {
            await this.speak(text, languageCode || this.currentLanguage);
        }
    }
}

// Initialize TTS manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ttsManager = new TTSManager();
});
