/**
 * Voice Recognition Manager for Indus Valley VR Experience
 * Handles speech-to-text and AI Q&A interactions
 */

class VoiceManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.currentLanguage = 'en';
        this.setupSpeechRecognition();
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                console.log('🎤 Voice recognition started');
                this.isListening = true;
                this.updateVoiceButton();
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('🎤 Voice input:', transcript);
                this.handleVoiceInput(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('❌ Voice recognition error:', event.error);
                this.isListening = false;
                this.updateVoiceButton();
            };
            
            this.recognition.onend = () => {
                console.log('🎤 Voice recognition ended');
                this.isListening = false;
                this.updateVoiceButton();
            };
            
            this.isSupported = true;
        } else {
            console.warn('⚠️ Speech recognition not supported');
            this.isSupported = false;
        }
    }

    toggle() {
        if (!this.isSupported) {
            alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        if (!this.recognition || this.isListening) return;
        
        // Set language based on current selection
        this.recognition.lang = this.getRecognitionLanguage();
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('❌ Failed to start voice recognition:', error);
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    getRecognitionLanguage() {
        const languageMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'kn': 'kn-IN',
            'ta': 'ta-IN',
            'te': 'te-IN',
            'bn': 'bn-IN'
        };
        return languageMap[this.currentLanguage] || 'en-US';
    }

    updateVoiceButton() {
        const voiceBtn = document.getElementById('voiceBtn');
        if (!voiceBtn) return;

        if (this.isListening) {
            voiceBtn.classList.add('listening');
            voiceBtn.title = 'Listening... Click to stop';
        } else {
            voiceBtn.classList.remove('listening');
            voiceBtn.title = 'Ask about Indus Valley';
        }
    }

    setLanguage(language) {
        this.currentLanguage = language;
        console.log('🌐 Voice recognition language set to:', language);
    }

    async handleVoiceInput(transcript) {
        console.log('🎤 Processing voice input:', transcript);
        
        // Update info panel to show what was heard
        updateInfo('Voice Input', `You asked: "${transcript}"`);
        
        try {
            // Get AI answer
            const answer = await this.getAIAnswer(transcript, this.currentLanguage);
            
            // Update info panel with answer
            updateInfo('AI Response', answer);
            
            // Speak the answer
            if (ttsManager) {
                await ttsManager.speak(answer, this.currentLanguage);
            }
            
        } catch (error) {
            console.error('❌ Error processing voice input:', error);
            const errorMessage = 'Sorry, I couldn\'t process your question. Please try again.';
            updateInfo('Error', errorMessage);
            
            if (ttsManager) {
                await ttsManager.speak(errorMessage, this.currentLanguage);
            }
        }
    }

    async getAIAnswer(question, language) {
        try {
            // 1. Translate question to English if needed
            let translatedQuestion = question;
            if (language !== 'en') {
                translatedQuestion = await this.translateText(question, language, 'en');
            }

            // 2. Send to Gemini AI
            const geminiResponse = await fetch('/api/ai/gemini-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: translatedQuestion,
                    context: 'Indus Valley Civilization'
                })
            });

            if (!geminiResponse.ok) {
                throw new Error(`Gemini API error: ${geminiResponse.status}`);
            }

            const geminiData = await geminiResponse.json();
            let answerEn = geminiData.answer || 'Sorry, I don\'t have an answer.';

            // 3. Clean the answer
            answerEn = this.cleanAnswer(answerEn);

            // 4. Translate answer back to user's language if needed
            let finalAnswer = answerEn;
            if (language !== 'en') {
                finalAnswer = await this.translateText(answerEn, 'en', language);
            }

            return finalAnswer;

        } catch (error) {
            console.error('❌ AI Q&A failed:', error);
            return 'Sorry, I couldn\'t get an answer right now. Please try again.';
        }
    }

    async translateText(text, fromLang, toLang) {
        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    from: fromLang,
                    to: toLang
                })
            });

            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status}`);
            }

            const data = await response.json();
            return data.translated || text;

        } catch (error) {
            console.warn('⚠️ Translation failed, using original text:', error);
            return text; // fallback to original
        }
    }

    cleanAnswer(text) {
        return text
            .replace(/^Sure.*?:\s*/i, '')   // remove "Sure, here's..."
            .replace(/Hope this helps.*$/i, '') // remove "Hope this helps"
            .replace(/Here is.*?:\s*/i, '')
            .replace(/^Of course.*?:\s*/i, '')
            .replace(/^Certainly.*?:\s*/i, '')
            .replace(/^Absolutely.*?:\s*/i, '')
            .replace(/^Great question.*?:\s*/i, '')
            .replace(/^That's a great question.*?:\s*/i, '')
            .replace(/^I'd be happy to.*?:\s*/i, '')
            .replace(/^Let me explain.*?:\s*/i, '')
            .replace(/^The Indus Valley.*?:\s*/i, 'The Indus Valley')
            .trim();
    }
}
