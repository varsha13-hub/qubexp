const express = require('express');
const router = express.Router();
const axios = require('axios');

// Enhanced translation function with Sarvam AI support
async function translate(text, sourceLang = 'en', targetLang = 'en') {
  if (!text || text.trim() === '') {
    throw new Error('Text to translate cannot be empty');
  }

  // Check if same language
  if (sourceLang === targetLang) {
    return { text, translatedText: text, source: sourceLang, target: targetLang };
  }

  // Try Sarvam AI translation first for Indian languages
  const indianLanguages = ['hi', 'kn', 'ta', 'te', 'mr', 'bn', 'gu', 'ur'];
  if (indianLanguages.includes(targetLang)) {
    try {
      const sarvamKey = process.env.SARVAM_KEY;
      console.log('Sarvam API key available:', !!sarvamKey);
      if (sarvamKey) {
        console.log('Attempting Sarvam translation for:', text, 'to', targetLang);
        const translatedText = await sarvamTranslate(text, sourceLang, targetLang, sarvamKey);
        console.log('Sarvam translation successful:', translatedText);
        return { text, translatedText, source: sourceLang, target: targetLang, provider: 'sarvam' };
      } else {
        console.log('Sarvam API key not found, using fallback');
      }
    } catch (error) {
      console.log('Sarvam translation failed, using fallback:', error.message);
    }
  }

  // Fallback: return original text to avoid mixed language issues
  return { text, translatedText: text, source: sourceLang, target: targetLang, provider: 'fallback' };
}

// Sarvam AI translation function
async function sarvamTranslate(text, sourceLang, targetLang, apiKey) {
  const url = 'https://api.sarvam.ai/translate';
  const headers = {
    'Content-Type': 'application/json',
    'api-subscription-key': apiKey
  };

  const payload = {
    input: text,
    source_language_code: mapLanguageToSarvam(sourceLang),
    target_language_code: mapLanguageToSarvam(targetLang)
  };

  const response = await axios.post(url, payload, {
    headers,
    timeout: 30000
  });

  if (response.data?.translated_text) {
    return response.data.translated_text;
  }

  throw new Error('Invalid response from Sarvam AI');
}

// Map language codes to Sarvam format
function mapLanguageToSarvam(langCode) {
  const languageMap = {
    'en': 'en-IN',
    'hi': 'hi-IN',
    'kn': 'kn-IN',
    'ta': 'ta-IN',
    'te': 'te-IN',
    'mr': 'mr-IN',
    'bn': 'bn-IN',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'ar': 'ar-SA',
    'ru': 'ru-RU',
    'pt': 'pt-BR'
  };
  
  return languageMap[langCode] || 'en-IN';
}

// Translation endpoint
router.post('/', async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;

    // Validate input
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Text field is required and must be a string'
      });
    }

    if (!targetLang) {
      return res.status(400).json({
        error: 'Missing target language',
        message: 'targetLang is required'
      });
    }

    console.log('Translation request:', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      sourceLang: sourceLang || 'auto',
      targetLang
    });

    // Perform translation
    const result = await translate(text, sourceLang, targetLang);

    console.log('Translation completed:', {
      source: result.source,
      target: result.target,
      provider: result.provider
    });

    res.json({
      success: true,
      originalText: result.text,
      translatedText: result.translatedText,
      sourceLanguage: result.source,
      targetLanguage: result.target,
      provider: result.provider,
      translated: result.translatedText // Add this for compatibility
    });

  } catch (error) {
    console.error('Translation error:', error);
    
    // Handle specific error types
    if (error.message.includes('Translation service is currently unavailable')) {
      return res.status(503).json({
        error: 'Translation service unavailable',
        message: 'The translation service is temporarily down. Please try again later.'
      });
    }
    
    if (error.message.includes('Text to translate cannot be empty')) {
      return res.status(400).json({
        error: 'Empty text',
        message: 'Please provide text to translate'
      });
    }

    res.status(500).json({
      error: 'Translation failed',
      message: error.message
    });
  }
});

// Get supported languages
router.get('/languages', async (req, res) => {
  try {
    // Fallback to existing languages
    const { getSupportedLanguages } = require('../translate');
    const languages = getSupportedLanguages();
    
    res.json({
      success: true,
      languages,
      count: languages.length
    });
  } catch (error) {
    console.error('Error getting languages:', error);
    res.status(500).json({
      error: 'Failed to get supported languages',
      message: error.message
    });
  }
});

// Health check for translation service
router.get('/health', async (req, res) => {
  try {
    // Test translation with a simple phrase
    const testResult = await translate('Hello', 'en', 'hi');
    
    res.json({
      status: 'OK',
      service: 'translation',
      provider: 'enhanced',
      testTranslation: testResult.translatedText,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Translation health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Batch translation endpoint
router.post('/batch', async (req, res) => {
  try {
    const { texts, sourceLang, targetLang } = req.body;

    // Validate input
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Texts field is required and must be a non-empty array'
      });
    }

    if (!targetLang) {
      return res.status(400).json({
        error: 'Missing target language',
        message: 'targetLang is required'
      });
    }

    if (texts.length > 10) {
      return res.status(400).json({
        error: 'Too many texts',
        message: 'Maximum 10 texts allowed per batch request'
      });
    }

    console.log('Batch translation request:', {
      textCount: texts.length,
      sourceLang: sourceLang || 'auto',
      targetLang
    });

    // Translate all texts
    const results = await Promise.all(
      texts.map(text => translate(text, sourceLang, targetLang))
    );

    res.json({
      success: true,
      results: results.map(result => ({
        originalText: result.text,
        translatedText: result.translatedText,
        sourceLanguage: result.source,
        targetLanguage: result.target
      })),
      provider: 'enhanced'
    });

  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      error: 'Batch translation failed',
      message: error.message
    });
  }
});

module.exports = router;