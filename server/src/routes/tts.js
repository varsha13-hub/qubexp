const express = require('express');
const router = express.Router();
const axios = require('axios');

// TTS Providers
class TTSProvider {
    constructor() {
        this.providers = {
            sarvam: this.sarvamTTS.bind(this),
            google: this.googleTTS.bind(this),
            azure: this.azureTTS.bind(this),
            browser: this.browserTTS.bind(this)
        };
    }

    async sarvamTTS(text, language, options = {}) {
        try {
            // Check for Sarvam API key
            const sarvamKey = process.env.SARVAM_KEY;
            if (!sarvamKey) {
                throw new Error('Sarvam AI API key not configured');
            }

            // Map language codes to Sarvam format
            const sarvamLanguage = this.mapLanguageToSarvam(language);
            
            const url = 'https://api.sarvam.ai/text-to-speech';
            const headers = {
                'Content-Type': 'application/json',
                'api-subscription-key': sarvamKey
            };

            // Sarvam TTS API correct format
            // Valid speakers: anushka (female), priya (female), neha (female), or male voices
            // Valid models: bulbul:v2, bulbul:v3-beta
            const payload = {
                inputs: [text],
                target_language_code: sarvamLanguage,
                speaker: 'anushka', // Valid female voice
                pitch: 0,
                pace: 1.0,
                loudness: 1.5,
                speech_sample_rate: 8000,
                enable_preprocessing: true,
                model: 'bulbul:v2' // Valid model version
            };

            console.log('🔍 Sarvam API Request:', JSON.stringify(payload, null, 2));
            console.log('🔍 Sarvam API Key present:', !!sarvamKey, 'Length:', sarvamKey ? sarvamKey.length : 0);

            try {
                const response = await axios.post(url, payload, {
                    headers,
                    timeout: 30000,
                    validateStatus: function (status) {
                        return status < 500; // Don't throw for 4xx errors
                    }
                });

                console.log('🔍 Sarvam API Response Status:', response.status);
                console.log('🔍 Sarvam API Response Data:', JSON.stringify(response.data, null, 2));

                if (response.status === 400) {
                    console.error('❌ Sarvam API 400 Error:', response.data);
                    throw new Error(`Sarvam API validation error: ${JSON.stringify(response.data)}`);
                }

                if (response.status !== 200) {
                    throw new Error(`Sarvam API returned status ${response.status}`);
                }

                if (response.data?.audios && response.data.audios.length > 0) {
                    return {
                        audio: response.data.audios[0], // Base64 audio string
                        format: 'mp3',
                        provider: 'sarvam'
                    };
                }

                throw new Error('Invalid response from Sarvam AI TTS');
            } catch (apiError) {
                console.error('❌ Sarvam API Error:', apiError.message);
                throw apiError;
            }
        } catch (error) {
            throw new Error(`Sarvam TTS failed: ${error.message}`);
        }
    }

    mapLanguageToSarvam(language) {
        const languageMap = {
            'en': 'en-IN',
            'hi': 'hi-IN',
            'kn': 'kn-IN',
            'ta': 'ta-IN',
            'te': 'te-IN',
            'mr': 'mr-IN',
            'bn': 'bn-IN',
            'gu': 'gu-IN',
            'ur': 'ur-IN'
        };
        return languageMap[language] || 'en-IN';
    }

    async googleTTS(text, language, options = {}) {
        try {

            // Fallback to Google TTS
            const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
            if (!apiKey) {
                throw new Error('Google Cloud API key not configured');
            }

            const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
            
            const payload = {
                input: { text },
                voice: {
                    languageCode: this.getGoogleLanguageCode(language),
                    name: this.getGoogleVoiceName(language),
                    ssmlGender: 'NEUTRAL'
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: options.speed || 1.0,
                    pitch: options.pitch || 0.0,
                    volumeGainDb: options.volume || 0.0
                }
            };

            const response = await axios.post(url, payload, {
                timeout: 30000
            });

            if (response.data?.audioContent) {
                return {
                    audio: response.data.audioContent,
                    format: 'mp3',
                    provider: 'google'
                };
            }

            throw new Error('Invalid response from Google TTS');
        } catch (error) {
            throw new Error(`Google TTS failed: ${error.message}`);
        }
    }

    async azureTTS(text, language, options = {}) {
        try {
            const apiKey = process.env.AZURE_SPEECH_KEY;
            const region = process.env.AZURE_SPEECH_REGION;
            
            if (!apiKey || !region) {
                throw new Error('Azure Speech credentials not configured');
            }

            const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
            
            const headers = {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
            };

            const ssml = this.generateSSML(text, language, options);
            
            const response = await axios.post(url, ssml, {
                headers,
                responseType: 'arraybuffer',
                timeout: 30000
            });

            if (response.data) {
                return {
                    audio: Buffer.from(response.data).toString('base64'),
                    format: 'mp3',
                    provider: 'azure'
                };
            }

            throw new Error('Invalid response from Azure TTS');
        } catch (error) {
            throw new Error(`Azure TTS failed: ${error.message}`);
        }
    }

    browserTTS(text, language, options = {}) {
        // This is a fallback that returns instructions for browser TTS
        return {
            audio: null,
            format: 'browser',
            provider: 'browser',
            instructions: {
                text: text,
                language: language,
                options: options
            }
        };
    }

    generateSSML(text, language, options = {}) {
        const voice = this.getAzureVoiceName(language);
        const rate = options.speed || 1.0;
        const pitch = options.pitch || 0.0;
        
        return `<speak version='1.0' xml:lang='${language}'>
            <voice xml:lang='${language}' xml:gender='Neutral' name='${voice}'>
                <prosody rate='${rate}' pitch='${pitch}%'>
                    ${text}
                </prosody>
            </voice>
        </speak>`;
    }

    getGoogleLanguageCode(language) {
        const languageMap = {
            'en': 'en-US',
            'hi': 'hi-IN',
            'kn': 'kn-IN',
            'ta': 'ta-IN',
            'te': 'te-IN',
            'mr': 'mr-IN',
            'bn': 'bn-IN',
            'gu': 'gu-IN',
            'ur': 'ur-IN'
        };
        return languageMap[language] || 'en-US';
    }

    getGoogleVoiceName(language) {
        const voiceMap = {
            'en': 'en-US-Standard-A',
            'hi': 'hi-IN-Standard-A',
            'kn': 'kn-IN-Standard-A',
            'ta': 'ta-IN-Standard-A',
            'te': 'te-IN-Standard-A',
            'mr': 'mr-IN-Standard-A',
            'bn': 'bn-IN-Standard-A',
            'gu': 'gu-IN-Standard-A',
            'ur': 'ur-IN-Standard-A'
        };
        return voiceMap[language] || 'en-US-Standard-A';
    }

    getAzureVoiceName(language) {
        const voiceMap = {
            'en': 'en-US-JennyNeural',
            'hi': 'hi-IN-SwaraNeural',
            'kn': 'kn-IN-SapnaNeural',
            'ta': 'ta-IN-PallaviNeural',
            'te': 'te-IN-ShrutiNeural',
            'mr': 'mr-IN-AarohiNeural',
            'bn': 'bn-IN-BashkarNeural',
            'gu': 'gu-IN-DhwaniNeural',
            'ur': 'ur-IN-GulNeural'
        };
        return voiceMap[language] || 'en-US-JennyNeural';
    }
}

const ttsProvider = new TTSProvider();

// TTS endpoint
router.post('/', async (req, res) => {
    try {
        const { text, language = 'en', options = {}, voice, speaker } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                error: 'Invalid input',
                message: 'Text field is required and must be a string'
            });
        }

        // Merge voice/speaker parameter into options for compatibility
        const ttsOptions = { ...options };
        if (speaker) {
            ttsOptions.speaker = speaker;
            ttsOptions.voice = speaker; // For compatibility with other providers
        } else if (voice) {
            ttsOptions.speaker = voice;
            ttsOptions.voice = voice;
        }

        console.log('TTS request:', {
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            language,
            options: ttsOptions
        });

        // Try providers in order of preference
        // For regional languages and English, try Sarvam first
        const regionalLanguages = ['hi', 'kn', 'ta', 'te', 'mr', 'bn', 'gu', 'ur', 'en'];
        const providers = regionalLanguages.includes(language) 
            ? ['sarvam', 'google', 'azure', 'browser']
            : ['google', 'azure', 'browser'];
        let result = null;
        let error = null;

        for (const providerName of providers) {
            try {
                result = await ttsProvider.providers[providerName](text, language, ttsOptions);
                console.log(`✅ ${providerName} TTS successful`);
                break;
            } catch (err) {
                console.log(`❌ ${providerName} TTS failed: ${err.message}`);
                error = err;
                continue;
            }
        }

        if (!result) {
            return res.status(500).json({
                error: 'All TTS providers failed',
                message: error?.message || 'TTS service unavailable'
            });
        }

        res.json({
            success: true,
            audio: result.audio,
            format: result.format,
            provider: result.provider,
            language: language,
            text: text,
            instructions: result.instructions
        });

    } catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({
            error: 'TTS failed',
            message: error.message
        });
    }
});

// Get supported languages
router.get('/languages', (req, res) => {
    const languages = [
        { code: 'en', name: 'English', native: 'English' },
        { code: 'hi', name: 'Hindi', native: 'हिंदी' },
        { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
        { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
        { code: 'te', name: 'Telugu', native: 'తెలుగు' },
        { code: 'mr', name: 'Marathi', native: 'मराठी' },
        { code: 'bn', name: 'Bengali', native: 'বাংলা' },
        { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
        { code: 'ur', name: 'Urdu', native: 'اردو' }
    ];

    res.json({
        success: true,
        languages,
        count: languages.length
    });
});

// Health check
router.get('/health', (req, res) => {
    const hasSarvamKey = !!process.env.SARVAM_KEY;
    const hasGoogleKey = !!process.env.GOOGLE_CLOUD_API_KEY;
    const hasAzureKey = !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
    
    res.json({
        status: hasSarvamKey || hasGoogleKey || hasAzureKey ? 'OK' : 'DEGRADED',
        service: 'tts',
        providers: {
            sarvam: hasSarvamKey ? 'available' : 'not configured',
            google: hasGoogleKey ? 'available' : 'not configured',
            azure: hasAzureKey ? 'available' : 'not configured',
            browser: 'always available'
        },
        message: hasSarvamKey || hasGoogleKey || hasAzureKey ? 'TTS service is working' : 'TTS service available with browser fallback only'
    });
});

module.exports = router;

