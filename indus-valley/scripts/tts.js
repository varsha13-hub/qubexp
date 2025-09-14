/**
 * Text-to-Speech Manager for Indus Valley VR Experience
 * Handles multilingual TTS using Sarvam AI
 */

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
    }

    async speak(text, language = 'en') {
        if (!text || this.isSpeaking) {
            return;
        }

        try {
            this.isSpeaking = true;
            console.log(`🔊 Speaking in ${this.supportedLanguages[language]}:`, text.substring(0, 100) + '...');

            // Stop any current audio
            this.stop();

            // Split long text into chunks to prevent TTS timeout
            const chunks = this.splitTextIntoChunks(text, 400);
            
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                console.log(`🔊 Playing chunk ${i + 1}/${chunks.length}`);
                
                await this.speakChunk(chunk, language);
                
                // Small delay between chunks
                if (i < chunks.length - 1) {
                    await this.delay(500);
                }
            }

        } catch (error) {
            console.error('❌ TTS Error:', error);
        } finally {
            this.isSpeaking = false;
        }
    }

    async speakChunk(text, language) {
        try {
            const response = await fetch('/api/ai/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    language: language
                })
            });

            if (!response.ok) {
                throw new Error(`TTS API error: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            return new Promise((resolve, reject) => {
                this.currentAudio = new Audio(audioUrl);
                
                this.currentAudio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                };
                
                this.currentAudio.onerror = (error) => {
                    URL.revokeObjectURL(audioUrl);
                    reject(error);
                };
                
                this.currentAudio.play().catch(reject);
            });

        } catch (error) {
            console.error('❌ TTS chunk error:', error);
            // Fallback: try to speak the text using browser's built-in TTS
            return this.fallbackTTS(text, language);
        }
    }

    fallbackTTS(text, language) {
        return new Promise((resolve) => {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = this.getBrowserLanguageCode(language);
                utterance.onend = resolve;
                utterance.onerror = resolve;
                speechSynthesis.speak(utterance);
            } else {
                console.warn('⚠️ No TTS available');
                resolve();
            }
        });
    }

    getBrowserLanguageCode(language) {
        const languageMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'kn': 'kn-IN',
            'ta': 'ta-IN',
            'te': 'te-IN',
            'bn': 'bn-IN'
        };
        return languageMap[language] || 'en-US';
    }

    splitTextIntoChunks(text, maxLength) {
        const chunks = [];
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        let currentChunk = '';
        
        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;
            
            if (currentChunk.length + trimmedSentence.length + 1 <= maxLength) {
                currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk + '.');
                    currentChunk = trimmedSentence;
                } else {
                    // Single sentence is too long, split by words
                    const words = trimmedSentence.split(' ');
                    let wordChunk = '';
                    
                    for (const word of words) {
                        if (wordChunk.length + word.length + 1 <= maxLength) {
                            wordChunk += (wordChunk ? ' ' : '') + word;
                        } else {
                            if (wordChunk) {
                                chunks.push(wordChunk);
                                wordChunk = word;
                            } else {
                                chunks.push(word);
                            }
                        }
                    }
                    
                    if (wordChunk) {
                        currentChunk = wordChunk;
                    }
                }
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk + '.');
        }
        
        return chunks.length > 0 ? chunks : [text];
    }

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        this.isSpeaking = false;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isCurrentlySpeaking() {
        return this.isSpeaking;
    }
}
