// Text-to-Speech Manager
class TTSManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        this.currentVoice = null;
        this.isSpeaking = false;
        this.currentLanguage = 'en';
        
        // Audio pause/resume support
        this.currentAudio = null;
        this.isPaused = false;
        this.pausedTime = 0;
        
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

    // Helper method to fetch server TTS audio (without playing)
    async fetchServerTTSAudio(text, languageCode) {
        try {
            console.log(`Requesting server TTS for ${languageCode}:`, text.substring(0, 50) + '...');
            
            const resp = await fetch('/api/tts', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ text, language: languageCode })
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
                console.log(`✅ Server TTS audio fetched for ${languageCode}`);
                return { type: 'url', data: url, format: 'audio' };
            }
            
            // Handle JSON response (fallback case)
            if (contentType.includes('application/json')) {
                const jsonData = await resp.json();
                console.log('Server returned JSON response:', jsonData);
                
                if (jsonData.error) {
                    throw new Error(jsonData.error);
                }
                
                if (jsonData.fallback === 'client') {
                    throw new Error('SERVER_FALLBACK_TO_CLIENT');
                }
                
                // If it's a successful JSON response with audio data
                if (jsonData.audio) {
                    console.log(`🎵 Server TTS audio fetched for ${languageCode} (JSON response)`);
                    return { type: 'base64', data: jsonData.audio, format: jsonData.format || 'mp3' };
                }
                
                // If audio is null, this means server TTS failed and we should fall back to browser TTS
                if (jsonData.audio === null) {
                    console.log(`⚠️ Server TTS returned null audio for ${languageCode}, falling back to browser TTS`);
                    throw new Error('SERVER_FALLBACK_TO_CLIENT');
                }
                
                // If provider is browser, this means server TTS failed and we should use browser TTS
                if (jsonData.provider === 'browser') {
                    console.log(`⚠️ Server TTS provider is browser for ${languageCode}, using browser TTS directly`);
                    throw new Error('SERVER_FALLBACK_TO_CLIENT');
                }
                
                throw new Error('Unexpected JSON response from server TTS');
            }
            
            // If we can't determine the content type, try to handle as audio
            try {
                const blob = await resp.blob();
                if (blob.size > 0) {
                    const url = URL.createObjectURL(blob);
                    console.log(`✅ Server TTS successful for ${languageCode} (unknown content type)`);
                    // Actually play the audio
                    await this.playAudioUrl(url);
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

    // Helper method to play base64 audio data
    async playAudioBase64(base64Data, format = 'mp3') {
        try {
            console.log(`🎵 Converting base64 audio (${format}) to blob and playing...`);
            
            // Convert base64 to blob
            const audioBlob = this.base64ToBlob(base64Data, `audio/${format}`);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play the audio
            await this.playAudioUrl(audioUrl);
            
        } catch (error) {
            console.error('❌ Base64 audio playback failed:', error);
            throw error;
        }
    }

    // Helper method to play fetched server TTS audio
    async playServerTTSAudio(audioData) {
        if (audioData.type === 'url') {
            await this.playAudioUrl(audioData.data);
        } else if (audioData.type === 'base64') {
            await this.playAudioBase64(audioData.data, audioData.format);
        } else {
            throw new Error('Unknown audio data type');
        }
    }

    // Helper method to fetch and play server TTS audio (for backward compatibility)
    async fetchServerTTS(text, languageCode) {
        const audioData = await this.fetchServerTTSAudio(text, languageCode);
        await this.playServerTTSAudio(audioData);
    }

    // Helper method to convert base64 to blob
    base64ToBlob(base64, mime) {
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mime });
    }

    async playAudioUrl(url) {
        return new Promise((resolve, reject) => {
            console.log(`🎵 Playing audio from URL: ${url.substring(0, 50)}...`);
            
            // Stop any current audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            
            const audio = new Audio();
            audio.src = url;
            
            // Store reference to current audio for pause/resume
            this.currentAudio = audio;
            
            audio.onloadstart = () => console.log('🎵 Audio loading started');
            audio.oncanplay = () => console.log('🎵 Audio can play');
            audio.onplay = () => console.log('🎵 Audio playback started');
            audio.onended = () => { 
                console.log('🎵 Audio playback ended');
                this.currentAudio = null; // Clear reference when audio ends
                URL.revokeObjectURL(url); 
                resolve();
            };
            audio.onerror = (e) => {
                console.error('🎵 Audio playback error:', e);
                reject(e);
            };
            
            audio.play().catch((error) => {
                console.error('🎵 Audio play() failed:', error);
                reject(error);
            });
        });
    }

    async speak(text, languageCode = null) {
        if (this.isSpeaking) {
            this.stop();
        }

        // Set language if provided
        if (languageCode && languageCode !== this.currentLanguage) {
            this.currentLanguage = languageCode;
        }

        const lang = languageCode || this.currentLanguage;
        const indianLanguages = ['hi','kn','ta','te','mr','bn','gu','ur','ml','pa','or','as'];

        // 1) For English, use Sarvam TTS (en-IN) - no browser fallback
        if (lang === 'en') {
            try {
                console.log(`Using Sarvam TTS for English (en-IN):`, text);
                this.isSpeaking = true;
                await this.fetchServerTTS(text, 'en'); // Server will map 'en' to 'en-IN' for Sarvam
                this.isSpeaking = false;
                return;
            } catch (e) {
                console.error(`Sarvam TTS failed for English:`, e.message);
                this.isSpeaking = false;
                // Don't fallback to browser TTS - let the error propagate
                throw e;
            }
        }

        // 2) For Indian languages, use server TTS (Sarvam)
        if (indianLanguages.includes(lang)) {
            try {
                console.log(`Using server TTS for ${lang}:`, text);
                this.isSpeaking = true;
                await this.fetchServerTTS(text, lang);
                this.isSpeaking = false;
                return;
            } catch (e) {
                console.error(`Server TTS failed for ${lang}:`, e.message);
                this.isSpeaking = false;
                // Don't fallback to browser TTS - let the error propagate
                throw e;
            }
        }

        // 3) Browser TTS fallback for other languages or when server TTS fails
        if (!this.synthesis) {
            console.warn('Speech synthesis not supported');
            this.isSpeaking = false;
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Try to find a native voice for the target language
        let nativeVoice = this.voices?.find(v =>
            v.lang && (v.lang.toLowerCase().startsWith(lang.toLowerCase()))
        );

        // For English, try to find Indian English voice first
        if (lang === 'en' && !nativeVoice) {
            nativeVoice = this.voices?.find(v => 
                v.lang && (v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('india'))
            );
        }

        if (nativeVoice) {
            utterance.lang = nativeVoice.lang;
            utterance.voice = nativeVoice;
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            console.log(`Using browser voice: ${nativeVoice.name} (${nativeVoice.lang})`);
        } else {
            // Fallback to English voice
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            console.log(`Using fallback browser voice: en-US`);
        }
        
        // Event handlers
        utterance.onstart = () => {
            console.log('TTS started (browser fallback):', text);
            this.isSpeaking = true;
        };

        utterance.onend = () => {
            console.log('TTS ended (browser fallback)');
            this.isSpeaking = false;
        };

        utterance.onerror = (event) => {
            console.error('TTS error (browser fallback):', event.error);
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
            // Fallback to speaking original text in English
            console.log(`⚠️ Translation failed, speaking original text in English`);
            await this.speak(text, 'en');
        }
    }

    async translateText(text, targetLanguage) {
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
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
            console.log(`⚠️ Translation service unavailable, using original text for ${targetLanguage}`);
            // Fallback: return original text if translation fails
            return text;
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

    // Pause current audio playback
    pauseAudio() {
        console.log('⏸️ Pausing TTS audio...');
        this.isPaused = true;
        
        // Pause HTML5 audio if playing
        if (this.currentAudio && !this.currentAudio.paused) {
            this.pausedTime = this.currentAudio.currentTime;
            this.currentAudio.pause();
            console.log('⏸️ HTML5 audio paused at', this.pausedTime, 'seconds');
        }
        
        // Pause speech synthesis if speaking
        if (this.synthesis.speaking) {
            this.synthesis.pause();
            console.log('⏸️ Speech synthesis paused');
        }
    }
    
    // Resume current audio playback
    resumeAudio() {
        console.log('▶️ Resuming TTS audio...');
        this.isPaused = false;
        
        // Resume HTML5 audio if paused
        if (this.currentAudio && this.currentAudio.paused) {
            this.currentAudio.currentTime = this.pausedTime;
            this.currentAudio.play().catch(error => {
                console.error('❌ Failed to resume HTML5 audio:', error);
            });
            console.log('▶️ HTML5 audio resumed from', this.pausedTime, 'seconds');
        }
        
        // Resume speech synthesis if paused
        if (this.synthesis.paused) {
            this.synthesis.resume();
            console.log('▶️ Speech synthesis resumed');
        }
    }
    
    // Stop all audio playback
    stopAudio() {
        console.log('⏹️ Stopping all TTS audio...');
        this.isPaused = false;
        this.pausedTime = 0;
        
        // Stop HTML5 audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        // Stop speech synthesis
        if (this.synthesis.speaking || this.synthesis.paused) {
            this.synthesis.cancel();
        }
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
            // Use Sarvam TTS for English (en-IN)
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
            // Use Sarvam TTS for English (en-IN)
            await this.speak(text, languageCode || this.currentLanguage);
        }
    }
}

// Initialize TTS manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ttsManager = new TTSManager();
});
