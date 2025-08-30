const { LRUCache } = require('lru-cache');
const enhancedProvider = require('./providers/enhanced');
const libreProvider = require('./providers/libre');
const myMemoryProvider = require('./providers/mymemory');
const axios = require('axios');

// Translation cache
const translationCache = new LRUCache({
  max: parseInt(process.env.TRANSLATION_CACHE_SIZE) || 1000,
  ttl: parseInt(process.env.TRANSLATION_CACHE_TTL) || 3600000, // 1 hour
});

// Language code mapping
const languageMap = {
  'english': 'en',
  'hindi': 'hi',
  'spanish': 'es',
  'french': 'fr',
  'german': 'de',
  'kannada': 'kn',
  'tamil': 'ta',
  'telugu': 'te',
  'marathi': 'mr',
  'bengali': 'bn',
  'gujarati': 'gu',
  'urdu': 'ur',
  'arabic': 'ar',
  'chinese': 'zh',
  'japanese': 'ja',
  'korean': 'ko',
  'russian': 'ru',
  'portuguese': 'pt',
  'italian': 'it',
  'dutch': 'nl'
};

// Normalize language code
function normalizeLanguage(lang) {
  if (!lang) return 'en';
  
  const normalized = lang.toLowerCase().trim();
  return languageMap[normalized] || normalized;
}

// Enhanced translation function with multiple providers
async function translate(text, sourceLang = 'en', targetLang = 'en') {
  if (!text || text.trim() === '') {
    throw new Error('Text to translate cannot be empty');
  }

  // Normalize language codes
  const source = normalizeLanguage(sourceLang);
  const target = normalizeLanguage(targetLang);

  // Check if same language
  if (source === target) {
    return { text, translatedText: text, source, target };
  }

  // Create cache key
  const cacheKey = `${source}:${target}:${text.toLowerCase().trim()}`;
  
  // Check cache first
  const cached = translationCache.get(cacheKey);
  if (cached) {
    console.log('Translation cache hit:', cacheKey);
    return cached;
  }

  try {
    // Use the enhanced provider which handles multiple providers and fallbacks
    const translatedText = await enhancedProvider.translate(text, source, target);
    
    // Determine which provider was used (this is a simplified approach)
    let provider = 'enhanced';
    
    const result = {
      text,
      translatedText,
      source,
      target,
      provider
    };

    // Cache the result
    translationCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
}



// Get supported languages
function getSupportedLanguages() {
  return enhancedProvider.getSupportedLanguages();
}

// Get language name from code
function getLanguageName(code) {
  const entry = Object.entries(languageMap).find(([name, langCode]) => langCode === code);
  return entry ? entry[0] : code;
}

// Get translation statistics
function getTranslationStats() {
  const stats = translationCache.getStats();
  return {
    size: translationCache.size,
    maxSize: translationCache.max,
    hits: stats.hits || 0,
    misses: stats.misses || 0,
    hitRate: stats.hits && stats.misses ? (stats.hits / (stats.hits + stats.misses)) * 100 : 0
  };
}

// Clear translation cache
function clearTranslationCache() {
  translationCache.clear();
  return { message: 'Translation cache cleared' };
}

module.exports = {
  translate,
  getSupportedLanguages,
  getLanguageName,
  normalizeLanguage,
  languageMap,
  getTranslationStats,
  clearTranslationCache
};
