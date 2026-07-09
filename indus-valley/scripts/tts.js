class TTSManager {
    constructor() {
        this.isSpeaking = false;
        this.currentAudio = null;
        this.supportedLanguages = {
            'en': 'English',
            'hi': 'Hindi',
            'kn': 'Kannada',
            'ta': 'Tamil',
            'te': 'Telugu',
            'bn': 'Bengali'
        };
        this.onStateChange = null;
    }

    async speak(text, language = 'en') {
        if (!text || this.isSpeaking) return;

        try {
            this.setSpeakingState(true);
            this.stop(); // Stop any current audio

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, language })
            });

            if (!response.ok) throw new Error(`TTS API error: ${response.status}`);
            
            const data = await response.json();
            if (!data.success || !data.audio) throw new Error('TTS service failed');

            await this.playBase64Audio(data.audio, data.format || 'mp3');
        } catch (error) {
            console.error('❌ TTS Error:', error);
            await this.fallbackTTS(text, language);
        } finally {
            this.setSpeakingState(false);
        }
    }

    playBase64Audio(base64Data, format) {
        return new Promise((resolve, reject) => {
            try {
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: `audio/${format}` });
                const audioUrl = URL.createObjectURL(blob);

                this.currentAudio = new Audio(audioUrl);
                this.currentAudio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                this.currentAudio.onerror = (e) => {
                    URL.revokeObjectURL(audioUrl);
                    reject(e);
                };
                this.currentAudio.play();
            } catch (err) {
                reject(err);
            }
        });
    }

    fallbackTTS(text, language) {
        return new Promise((resolve) => {
            if (!'speechSynthesis' in window) {
                resolve();
                return;
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'en' ? 'en-US' : language;
            utterance.onend = resolve;
            utterance.onerror = resolve;
            window.speechSynthesis.speak(utterance);
        });
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.setSpeakingState(false);
    }

    setSpeakingState(state) {
        this.isSpeaking = state;
        if (this.onStateChange) this.onStateChange(state);
    }
}

window.ttsManager = new TTSManager();
