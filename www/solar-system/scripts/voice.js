// Voice Management System
class VoiceManager {
    constructor() {
        this.recognition = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isListening = false;
        this.isRecording = false;
        this.currentLanguage = 'en';
        
        this.init();
    }

    init() {
        this.setupSpeechRecognition();
        this.setupMediaRecorder();
        this.loadLanguageFromStorage();
    }

    setupSpeechRecognition() {
        // Check for browser SpeechRecognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = this.getLanguageCode(this.currentLanguage);
            
            this.recognition.onstart = () => {
                console.log('Speech recognition started');
                this.isListening = true;
                this.showVoiceOverlay();
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('Speech recognized:', transcript);
                this.processVoiceCommand(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.handleRecognitionError(event.error);
            };
            
            this.recognition.onend = () => {
                console.log('Speech recognition ended');
                this.isListening = false;
                this.hideVoiceOverlay();
            };
        } else {
            console.log('Speech recognition not supported, will use server-side STT');
        }
    }

    setupMediaRecorder() {
        // Setup for server-side STT fallback
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // MediaRecorder will be initialized when needed
        }
    }

    getLanguageCode(languageCode) {
        const languageMap = {
            'en': 'en-US',
            'es': 'es-ES',
            'fr': 'fr-FR',
            'de': 'de-DE',
            'hi': 'hi-IN',
            'kn': 'kn-IN',
            'ta': 'ta-IN',
            'te': 'te-IN',
            'mr': 'mr-IN',
            'bn': 'bn-IN'
        };
        return languageMap[languageCode] || 'en-US';
    }

    async startListening() {
        if (this.isListening || this.isRecording) {
            console.log('Already listening or recording');
            return;
        }

        try {
            if (this.recognition) {
                // Update language for browser recognition
                this.recognition.lang = this.getLanguageCode(this.currentLanguage);
                this.recognition.start();
            } else {
                // Fallback to server-side STT
                await this.startRecording();
            }
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            this.showError('Failed to start voice recognition');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
        
        if (this.isRecording) {
            this.stopRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.audioChunks = [];
            this.isRecording = true;

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                await this.processAudioRecording();
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();
            this.showVoiceOverlay();
            
            // Stop recording after 10 seconds
            setTimeout(() => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            }, 10000);

        } catch (error) {
            console.error('Error starting audio recording:', error);
            this.showError('Failed to access microphone');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.hideVoiceOverlay();
        }
    }

    async processAudioRecording() {
        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            // Send with current language
            const response = await fetch(`/api/stt?lang=${this.currentLanguage}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('STT request failed');
            }

            const result = await response.json();
            
            if (result.success && result.text) {
                console.log('Server STT result:', result.text);
                // Dispatch event for dashboard/other listeners
                document.dispatchEvent(new CustomEvent('stt:result', { 
                    detail: { 
                        text: result.text, 
                        confidence: result.confidence,
                        language: result.language,
                        isFallback: result.isFallback
                    } 
                }));
                this.processVoiceCommand(result.text);
            } else {
                throw new Error('No text recognized');
            }

        } catch (error) {
            console.error('Error processing audio recording:', error);
            this.showError('Failed to process voice input');
        }
    }

    async processVoiceCommand(transcript) {
        console.log('Processing voice command:', transcript);
        
        // Parse intent using the intent parser
        if (window.intentParser) {
            const intent = window.intentParser.parse(transcript);
            await this.executeIntent(intent);
        } else {
            // Fallback: simple keyword matching
            await this.executeSimpleCommand(transcript);
        }
    }

    async executeIntent(intent) {
        console.log('Executing intent:', intent);
        
        switch (intent.type) {
            case 'tell_about':
                await this.handleTellAbout(intent.planet, intent.language);
                break;
            case 'set_language':
                this.handleSetLanguage(intent.language);
                break;
            case 'ask_fact':
                await this.handleAskFact(intent.planet, intent.attribute);
                break;
            case 'navigate':
                this.handleNavigate(intent.direction);
                break;
            default:
                this.showError('Command not understood');
        }
    }

    async executeSimpleCommand(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        
        // Check for "tell me about" commands first
        if (lowerTranscript.includes('tell me about') || lowerTranscript.includes('tell about')) {
            const planets = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
            for (const planet of planets) {
                if (lowerTranscript.includes(planet)) {
                    this.selectPlanet(planet);
                    return;
                }
            }
            this.showError('Which planet would you like to know about?');
            return;
        }
        
        // Planet selection (direct planet names)
        const planets = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
        for (const planet of planets) {
            if (lowerTranscript.includes(planet)) {
                this.selectPlanet(planet);
                return;
            }
        }
        
        // Language commands
        if (lowerTranscript.includes('change language') || lowerTranscript.includes('switch language')) {
            this.handleLanguageChange(lowerTranscript);
            return;
        }
        
        // Navigation commands
        if (lowerTranscript.includes('next') || lowerTranscript.includes('previous') || lowerTranscript.includes('prev')) {
            this.handleNavigation(lowerTranscript);
            return;
        }
        
        // Help command
        if (lowerTranscript.includes('help') || lowerTranscript.includes('what can you do')) {
            this.showHelp();
            return;
        }
        
        // If no direct match, try translating the command to English first
        if (this.currentLanguage !== 'en') {
            try {
                const translatedCommand = await this.translateText(transcript, this.currentLanguage, 'en');
                console.log(`Translated command: "${transcript}" -> "${translatedCommand}"`);
                await this.executeSimpleCommand(translatedCommand.toLowerCase());
                return;
            } catch (error) {
                console.error('Failed to translate command:', error);
            }
        }
        
        this.showError('Command not understood. Try saying "Tell me about Mars" or "Change language to Spanish"');
    }

    async handleTellAbout(planet, language) {
        if (planet) {
            await this.selectPlanet(planet);
            
            if (language) {
                this.setLanguage(language);
            }
        } else {
            this.showError('Which planet would you like to know about?');
        }
    }

    handleSetLanguage(language) {
        if (language) {
            this.setLanguage(language);
        } else {
            this.showError('Which language would you like to switch to?');
        }
    }

    async handleAskFact(planet, attribute) {
        if (planet) {
            await this.selectPlanet(planet);
            // Could implement specific fact queries here
        } else {
            this.showError('Which planet would you like to know about?');
        }
    }

    handleNavigate(direction) {
        if (direction === 'next') {
            this.navigateToNextPlanet();
        } else if (direction === 'previous') {
            this.navigateToPreviousPlanet();
        }
    }

    handleLanguageChange(transcript) {
        const languages = {
            'english': 'en',
            'spanish': 'es',
            'french': 'fr',
            'german': 'de',
            'hindi': 'hi',
            'kannada': 'kn',
            'tamil': 'ta',
            'telugu': 'te',
            'marathi': 'mr',
            'bengali': 'bn'
        };
        
        for (const [langName, langCode] of Object.entries(languages)) {
            if (transcript.includes(langName)) {
                this.setLanguage(langCode);
                return;
            }
        }
        
        this.showError('Language not recognized. Please try again.');
    }

    handleNavigation(transcript) {
        if (transcript.includes('next')) {
            this.navigateToNextPlanet();
        } else if (transcript.includes('previous') || transcript.includes('prev')) {
            this.navigateToPreviousPlanet();
        }
    }

    async selectPlanet(planetId) {
        if (window.vrSceneController) {
            await window.vrSceneController.selectPlanet(planetId);
        }
    }

    setLanguage(languageCode) {
        this.currentLanguage = languageCode;
        localStorage.setItem('solarlearn-language', languageCode);
        
        // Update recognition language if available
        if (this.recognition) {
            this.recognition.lang = this.getLanguageCode(languageCode);
        }
        
        if (window.vrSceneController) {
            window.vrSceneController.setLanguage(languageCode);
        }
        
        this.showNotification(`Language changed to ${this.getLanguageName(languageCode)}`);
    }

    navigateToNextPlanet() {
        if (window.vrSceneController) {
            window.vrSceneController.navigateToNextPlanet();
        }
    }

    navigateToPreviousPlanet() {
        if (window.vrSceneController) {
            window.vrSceneController.navigateToPreviousPlanet();
        }
    }

    showHelp() {
        const helpText = `
            Voice Commands:
            • "Tell me about Mars" - Select a planet
            • "Change language to Spanish" - Switch language
            • "Next planet" / "Previous planet" - Navigate
            • "Help" - Show this help
        `;
        
        this.showNotification(helpText, 'info');
    }

    handleRecognitionError(error) {
        let errorMessage = 'Voice recognition error';
        
        switch (error) {
            case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone access denied. Please allow microphone access.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone access denied. Please allow microphone access.';
                break;
            case 'network':
                errorMessage = 'Network error. Please check your connection.';
                break;
            default:
                errorMessage = `Voice recognition error: ${error}`;
        }
        
        this.showError(errorMessage);
    }

    showVoiceOverlay() {
        const voiceOverlay = document.getElementById('voiceOverlay');
        if (voiceOverlay) {
            voiceOverlay.style.display = 'flex';
        }
    }

    hideVoiceOverlay() {
        const voiceOverlay = document.getElementById('voiceOverlay');
        if (voiceOverlay) {
            voiceOverlay.style.display = 'none';
        }
    }

    loadLanguageFromStorage() {
        const savedLanguage = localStorage.getItem('solarlearn-language');
        if (savedLanguage) {
            this.currentLanguage = savedLanguage;
        }
    }

    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'hi': 'हिंदी',
            'kn': 'ಕನ್ನಡ',
            'ta': 'தமிழ்',
            'te': 'తెలుగు',
            'mr': 'मराठी',
            'bn': 'বাংলা'
        };
        return languages[code] || code;
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '10px',
            color: '#ffffff',
            fontWeight: '600',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Set background color based on type
        if (type === 'error') {
            notification.style.background = '#ff4444';
        } else if (type === 'success') {
            notification.style.background = '#00ff88';
            notification.style.color = '#1a1a2e';
        } else {
            notification.style.background = '#00d4ff';
        }

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 5 seconds for help text, 3 seconds for others
        const duration = type === 'info' && message.includes('Voice Commands') ? 5000 : 3000;
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // Translation method
    async translateText(text, sourceLang, targetLang) {
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    sourceLang: sourceLang,
                    targetLang: targetLang
                })
            });

            if (!response.ok) {
                throw new Error(`Translation request failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.translatedText) {
                console.log(`Translation successful: "${text}" -> "${result.translatedText}"`);
                return result.translatedText;
            } else {
                throw new Error('Translation response invalid');
            }
        } catch (error) {
            console.error('Translation error:', error);
            throw error;
        }
    }

    // Utility methods
    isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition || navigator.mediaDevices);
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    isListening() {
        return this.isListening || this.isRecording;
    }
}

// Initialize voice manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.voiceManager = new VoiceManager();
});
