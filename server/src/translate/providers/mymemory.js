const axios = require('axios');

class MyMemoryProvider {
  constructor() {
    this.baseUrl = 'https://api.mymemory.translated.net/get';
    this.apiKey = process.env.MYMEMORY_API_KEY || '';
  }

  async translate(text, sourceLang, targetLang) {
    try {
      console.log(`MyMemory translation: ${sourceLang} -> ${targetLang}`);
      
      const params = {
        q: text,
        langpair: `${sourceLang}|${targetLang}`,
        key: this.apiKey
      };

      const response = await axios.get(this.baseUrl, { params });
      
      if (response.data && response.data.responseData) {
        const translatedText = response.data.responseData.translatedText;
        console.log(`MyMemory translation successful: "${text}" -> "${translatedText}"`);
        return translatedText;
      } else {
        throw new Error('Invalid response from MyMemory');
      }
    } catch (error) {
      console.error('MyMemory translation error:', error.message);
      
      // Return a fallback translation for common phrases
      const fallbackTranslations = this.getFallbackTranslation(text, sourceLang, targetLang);
      if (fallbackTranslations) {
        console.log(`Using fallback translation: "${text}" -> "${fallbackTranslations}"`);
        return fallbackTranslations;
      }
      
      throw new Error(`MyMemory translation failed: ${error.message}`);
    }
  }

  getFallbackTranslation(text, sourceLang, targetLang) {
    const lowerText = text.toLowerCase();
    
    // Common planet names and phrases
    const translations = {
      'en-hi': {
        'sun': 'सूर्य',
        'mercury': 'बुध',
        'venus': 'शुक्र',
        'earth': 'पृथ्वी',
        'mars': 'मंगल',
        'jupiter': 'बृहस्पति',
        'saturn': 'शनि',
        'uranus': 'अरुण',
        'neptune': 'वरुण',
        'pluto': 'यम',
        'tell me about': 'के बारे में बताओ',
        'next planet': 'अगला ग्रह',
        'previous planet': 'पिछला ग्रह',
        'change language': 'भाषा बदलो'
      },
      'en-kn': {
        'sun': 'ಸೂರ್ಯ',
        'mercury': 'ಬುಧ',
        'venus': 'ಶುಕ್ರ',
        'earth': 'ಭೂಮಿ',
        'mars': 'ಮಂಗಳ',
        'jupiter': 'ಗುರು',
        'saturn': 'ಶನಿ',
        'uranus': 'ಅರಣ',
        'neptune': 'ವರುಣ',
        'pluto': 'ಯಮ',
        'tell me about': 'ಬಗ್ಗೆ ಹೇಳು',
        'next planet': 'ಮುಂದಿನ ಗ್ರಹ',
        'previous planet': 'ಹಿಂದಿನ ಗ್ರಹ',
        'change language': 'ಭಾಷೆ ಬದಲಾಯಿಸು'
      },
      'en-ta': {
        'sun': 'சூரியன்',
        'mercury': 'புதன்',
        'venus': 'வெள்ளி',
        'earth': 'பூமி',
        'mars': 'செவ்வாய்',
        'jupiter': 'வியாழன்',
        'saturn': 'சனி',
        'uranus': 'யுரேனஸ்',
        'neptune': 'நெப்டியூன்',
        'pluto': 'புளூட்டோ',
        'tell me about': 'பற்றி சொல்லுங்கள்',
        'next planet': 'அடுத்த கிரகம்',
        'previous planet': 'முந்தைய கிரகம்',
        'change language': 'மொழியை மாற்று'
      },
      'en-te': {
        'sun': 'సూర్యుడు',
        'mercury': 'బుధుడు',
        'venus': 'శుక్రుడు',
        'earth': 'భూమి',
        'mars': 'అంగారకుడు',
        'jupiter': 'గురುడు',
        'saturn': 'శని',
        'uranus': 'యురేనస్',
        'neptune': 'నెప్ట్యూన్',
        'pluto': 'ప్లూటో',
        'tell me about': 'గురించి చెప్పండి',
        'next planet': 'తదుపరి గ్రహం',
        'previous planet': 'మునుపటి గ్రహం',
        'change language': 'భాషను మార్చండి'
      },
      'en-mr': {
        'sun': 'सूर्य',
        'mercury': 'बुध',
        'venus': 'शुक्र',
        'earth': 'पृथ्वी',
        'mars': 'मंगळ',
        'jupiter': 'गुरू',
        'saturn': 'शनी',
        'uranus': 'युरेनस',
        'neptune': 'नेपच्यून',
        'pluto': 'प्लूटो',
        'tell me about': 'बद्दल सांगा',
        'next planet': 'पुढील ग्रह',
        'previous planet': 'मागील ग्रह',
        'change language': 'भाषा बदला'
      },
      'en-bn': {
        'sun': 'সূর্য',
        'mercury': 'বুধ',
        'venus': 'শুক্র',
        'earth': 'পৃথিবী',
        'mars': 'মঙ্গল',
        'jupiter': 'বৃহস্পতি',
        'saturn': 'শনি',
        'uranus': 'ইউরেনাস',
        'neptune': 'নেপচুন',
        'pluto': 'প্লুটো',
        'tell me about': 'সম্পর্কে বলুন',
        'next planet': 'পরবর্তী গ্রহ',
        'previous planet': 'পূর্ববর্তী গ্রহ',
        'change language': 'ভাষা পরিবর্তন করুন'
      }
    };

    const langPair = `${sourceLang}-${targetLang}`;
    const langTranslations = translations[langPair];
    
    if (langTranslations) {
      // Check for exact matches first
      if (langTranslations[lowerText]) {
        return langTranslations[lowerText];
      }
      
      // Check for partial matches
      for (const [key, value] of Object.entries(langTranslations)) {
        if (lowerText.includes(key)) {
          return text.replace(new RegExp(key, 'gi'), value);
        }
      }
    }
    
    return null;
  }
}

module.exports = new MyMemoryProvider();


