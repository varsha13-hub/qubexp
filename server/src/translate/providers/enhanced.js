const axios = require('axios');

class EnhancedTranslationProvider {
  constructor() {
    this.providers = {
      google: this.googleTranslate.bind(this),
      microsoft: this.microsoftTranslate.bind(this),
      mymemory: this.myMemoryTranslate.bind(this),
      libre: this.libreTranslate.bind(this)
    };
    
    // Comprehensive fallback translations for VR space
    this.fallbackTranslations = {
      // Hindi translations
      'en-hi': {
        // Planets and space terms
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
        'planet': 'ग्रह',
        'solar system': 'सौर मंडल',
        'galaxy': 'आकाशगंगा',
        'universe': 'ब्रह्मांड',
        'star': 'तारा',
        'moon': 'चंद्रमा',
        'asteroid': 'क्षुद्रग्रह',
        'comet': 'धूमकेतु',
        'orbit': 'कक्षा',
        'gravity': 'गुरुत्वाकर्षण',
        
        // VR and UI commands
        'tell me about': 'के बारे में बताओ',
        'next planet': 'अगला ग्रह',
        'previous planet': 'पिछला ग्रह',
        'change language': 'भाषा बदलो',
        'voice command': 'आवाज़ कमांड',
        'fullscreen': 'पूर्ण स्क्रीन',
        'exit': 'बाहर निकलें',
        'help': 'मदद',
        'information': 'जानकारी',
        'details': 'विवरण',
        
        // Common phrases
        'hello': 'नमस्ते',
        'goodbye': 'अलविदा',
        'thank you': 'धन्यवाद',
        'please': 'कृपया',
        'yes': 'हाँ',
        'no': 'नहीं',
        'okay': 'ठीक है',
        'start': 'शुरू करें',
        'stop': 'रोकें',
        'continue': 'जारी रखें',
        
        // Complete sentences
        'tell me about mars': 'मंगल ग्रह के बारे में बताओ',
        'tell me about earth': 'पृथ्वी के बारे में बताओ',
        'tell me about the sun': 'सूर्य के बारे में बताओ',
        'go to next planet': 'अगले ग्रह पर जाओ',
        'go to previous planet': 'पिछले ग्रह पर जाओ',
        'change to hindi': 'हिंदी में बदलो',
        'change to english': 'अंग्रेजी में बदलो',
        'what is this': 'यह क्या है',
        'how far is it': 'यह कितनी दूर है',
        'what is the temperature': 'तापमान क्या है'
      },
      
      // Kannada translations
      'en-kn': {
        // Planets and space terms
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
        'planet': 'ಗ್ರಹ',
        'solar system': 'ಸೌರವ್ಯೂಹ',
        'galaxy': 'ನಕ್ಷತ್ರಪುಂಜ',
        'universe': 'ಬ್ರಹ್ಮಾಂಡ',
        'star': 'ನಕ್ಷತ್ರ',
        'moon': 'ಚಂದ್ರ',
        'asteroid': 'ಕ್ಷುದ್ರಗ್ರಹ',
        'comet': 'ಧೂಮಕೇತು',
        'orbit': 'ಕಕ್ಷೆ',
        'gravity': 'ಗುರುತ್ವಾಕರ್ಷಣೆ',
        
        // VR and UI commands
        'tell me about': 'ಬಗ್ಗೆ ಹೇಳು',
        'next planet': 'ಮುಂದಿನ ಗ್ರಹ',
        'previous planet': 'ಹಿಂದಿನ ಗ್ರಹ',
        'change language': 'ಭಾಷೆ ಬದಲಾಯಿಸು',
        'voice command': 'ಧ್ವನಿ ಆಜ್ಞೆ',
        'fullscreen': 'ಪೂರ್ಣ ಪರದೆ',
        'exit': 'ನಿರ್ಗಮಿಸು',
        'help': 'ಸಹಾಯ',
        'information': 'ಮಾಹಿತಿ',
        'details': 'ವಿವರಗಳು',
        
        // Common phrases
        'hello': 'ನಮಸ್ಕಾರ',
        'goodbye': 'ವಿದಾಯ',
        'thank you': 'ಧನ್ಯವಾದ',
        'please': 'ದಯವಿಟ್ಟು',
        'yes': 'ಹೌದು',
        'no': 'ಇಲ್ಲ',
        'okay': 'ಸರಿ',
        'start': 'ಪ್ರಾರಂಭಿಸು',
        'stop': 'ನಿಲ್ಲಿಸು',
        'continue': 'ಮುಂದುವರಿಸು',
        
        // Complete sentences
        'tell me about mars': 'ಮಂಗಳ ಗ್ರಹದ ಬಗ್ಗೆ ಹೇಳು',
        'tell me about earth': 'ಭೂಮಿಯ ಬಗ್ಗೆ ಹೇಳು',
        'tell me about the sun': 'ಸೂರ್ಯನ ಬಗ್ಗೆ ಹೇಳು',
        'go to next planet': 'ಮುಂದಿನ ಗ್ರಹಕ್ಕೆ ಹೋಗು',
        'go to previous planet': 'ಹಿಂದಿನ ಗ್ರಹಕ್ಕೆ ಹೋಗು',
        'change to kannada': 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸು',
        'change to english': 'ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಾಯಿಸು',
        'what is this': 'ಇದು ಏನು',
        'how far is it': 'ಇದು ಎಷ್ಟು ದೂರ',
        'what is the temperature': 'ತಾಪಮಾನ ಎಷ್ಟು'
      },
      
      // Tamil translations
      'en-ta': {
        // Planets and space terms
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
        'planet': 'கிரகம்',
        'solar system': 'சூரிய குடும்பம்',
        'galaxy': 'விண்மீன் பேரடை',
        'universe': 'பிரபஞ்சம்',
        'star': 'நட்சத்திரம்',
        'moon': 'சந்திரன்',
        'asteroid': 'சிறுகோள்',
        'comet': 'வால்மீன்',
        'orbit': 'சுற்றுப்பாதை',
        'gravity': 'ஈர்ப்பு விசை',
        
        // VR and UI commands
        'tell me about': 'பற்றி சொல்லுங்கள்',
        'next planet': 'அடுத்த கிரகம்',
        'previous planet': 'முந்தைய கிரகம்',
        'change language': 'மொழியை மாற்று',
        'voice command': 'குரல் கட்டளை',
        'fullscreen': 'முழு திரை',
        'exit': 'வெளியேறு',
        'help': 'உதவி',
        'information': 'தகவல்',
        'details': 'விவரங்கள்',
        
        // Common phrases
        'hello': 'வணக்கம்',
        'goodbye': 'பிரியாவிடை',
        'thank you': 'நன்றி',
        'please': 'தயவுசெய்து',
        'yes': 'ஆம்',
        'no': 'இல்லை',
        'okay': 'சரி',
        'start': 'தொடங்கு',
        'stop': 'நிறுத்து',
        'continue': 'தொடர்ந்து',
        
        // Complete sentences
        'tell me about mars': 'செவ்வாய் கிரகத்தைப் பற்றி சொல்லுங்கள்',
        'tell me about earth': 'பூமியைப் பற்றி சொல்லுங்கள்',
        'tell me about the sun': 'சூரியனைப் பற்றி சொல்லுங்கள்',
        'go to next planet': 'அடுத்த கிரகத்திற்கு செல்லுங்கள்',
        'go to previous planet': 'முந்தைய கிரகத்திற்கு செல்லுங்கள்',
        'change to tamil': 'தமிழுக்கு மாற்று',
        'change to english': 'ஆங்கிலத்திற்கு மாற்று',
        'what is this': 'இது என்ன',
        'how far is it': 'இது எவ்வளவு தொலைவில்',
        'what is the temperature': 'வெப்பநிலை என்ன'
      },
      
      // Telugu translations
      'en-te': {
        // Planets and space terms
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
        'planet': 'గ్రహం',
        'solar system': 'సౌర వ్యవస్థ',
        'galaxy': 'నక్షత్ర సమూహం',
        'universe': 'విశ్వం',
        'star': 'నక్షత్రం',
        'moon': 'చంద్రుడు',
        'asteroid': 'చిన్న గ్రహం',
        'comet': 'తోకచుక్క',
        'orbit': 'కక్ష్య',
        'gravity': 'గురುత್వాకర್షణ',
        
        // VR and UI commands
        'tell me about': 'గురించి చెప్పండి',
        'next planet': 'తదుపరి గ్రహం',
        'previous planet': 'మునుపటి గ్రహం',
        'change language': 'భాషను మార్చండి',
        'voice command': 'ధ్వని ఆదేశం',
        'fullscreen': 'పూర್తి తెర',
        'exit': 'నిష్క్రమించు',
        'help': 'సహాయం',
        'information': 'సమాచారం',
        'details': 'వివరాలు',
        
        // Common phrases
        'hello': 'నమస్కారం',
        'goodbye': 'వీడ్కోలు',
        'thank you': 'ధన్యవాదాలు',
        'please': 'దయచేసి',
        'yes': 'అవును',
        'no': 'లేదు',
        'okay': 'సరే',
        'start': 'ప్రారంభించు',
        'stop': 'ఆపు',
        'continue': 'కొనసాగించు',
        
        // Complete sentences
        'tell me about mars': 'అంగారకుడు గురించి చెప్పండి',
        'tell me about earth': 'భూమి గురించి చెప్పండి',
        'tell me about the sun': 'సూర్యుడు గురించి చెప్పండి',
        'go to next planet': 'తదుపరి గ్రహానికి వెళ్లండి',
        'go to previous planet': 'మునుపటి గ్రహానికి వెళ్లండి',
        'change to telugu': 'తెలుగుకు మార్చండి',
        'change to english': 'ఆంగ్లంకు మార్చండి',
        'what is this': 'ఇది ఏమిటి',
        'how far is it': 'ఇది ఎంత దూరంలో',
        'what is the temperature': 'ఉష్ణోగ్రత ఎంత'
      },
      
      // Marathi translations
      'en-mr': {
        // Planets and space terms
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
        'planet': 'ग्रह',
        'solar system': 'सूर्यमाला',
        'galaxy': 'आकाशगंगा',
        'universe': 'विश्व',
        'star': 'तारा',
        'moon': 'चंद्र',
        'asteroid': 'क्षुद्रग्रह',
        'comet': 'धूमकेतू',
        'orbit': 'कक्षा',
        'gravity': 'गुरुत्वाकर्षण',
        
        // VR and UI commands
        'tell me about': 'बद्दल सांगा',
        'next planet': 'पुढील ग्रह',
        'previous planet': 'मागील ग्रह',
        'change language': 'भाषा बदला',
        'voice command': 'आवाज आदेश',
        'fullscreen': 'पूर्ण स्क्रीन',
        'exit': 'बाहेर पडा',
        'help': 'मदत',
        'information': 'माहिती',
        'details': 'तपशील',
        
        // Common phrases
        'hello': 'नमस्कार',
        'goodbye': 'धन्यवाद',
        'thank you': 'आभार',
        'please': 'कृपया',
        'yes': 'होय',
        'no': 'नाही',
        'okay': 'ठीक आहे',
        'start': 'सुरू करा',
        'stop': 'थांबवा',
        'continue': 'सुरू ठेवा',
        
        // Complete sentences
        'tell me about mars': 'मंगळ ग्रहाबद्दल सांगा',
        'tell me about earth': 'पृथ्वीबद्दल सांगा',
        'tell me about the sun': 'सूर्याबद्दल सांगा',
        'go to next planet': 'पुढील ग्रहावर जा',
        'go to previous planet': 'मागील ग्रहावर जा',
        'change to marathi': 'मराठीत बदला',
        'change to english': 'इंग्रजीत बदला',
        'what is this': 'हे काय आहे',
        'how far is it': 'ते किती दूर आहे',
        'what is the temperature': 'तापमान किती आहे'
      },
      
      // Bengali translations
      'en-bn': {
        // Planets and space terms
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
        'planet': 'গ্রহ',
        'solar system': 'সৌরজগৎ',
        'galaxy': 'ছায়াপথ',
        'universe': 'মহাবিশ্ব',
        'star': 'তারা',
        'moon': 'চাঁদ',
        'asteroid': 'গ্রহাণু',
        'comet': 'ধূমকেতু',
        'orbit': 'কক্ষপথ',
        'gravity': 'মহাকর্ষ',
        
        // VR and UI commands
        'tell me about': 'সম্পর্কে বলুন',
        'next planet': 'পরবর্তী গ্রহ',
        'previous planet': 'পূর্ববর্তী গ্রহ',
        'change language': 'ভাষা পরিবর্তন করুন',
        'voice command': 'কণ্ঠস্বর আদেশ',
        'fullscreen': 'পূর্ণ পর্দা',
        'exit': 'প্রস্থান',
        'help': 'সাহায্য',
        'information': 'তথ্য',
        'details': 'বিস্তারিত',
        
        // Common phrases
        'hello': 'হ্যালো',
        'goodbye': 'বিদায়',
        'thank you': 'ধন্যবাদ',
        'please': 'অনুগ্রহ করে',
        'yes': 'হ্যাঁ',
        'no': 'না',
        'okay': 'ঠিক আছে',
        'start': 'শুরু করুন',
        'stop': 'বন্ধ করুন',
        'continue': 'চালিয়ে যান',
        
        // Complete sentences
        'tell me about mars': 'মঙ্গল গ্রহ সম্পর্কে বলুন',
        'tell me about earth': 'পৃথিবী সম্পর্কে বলুন',
        'tell me about the sun': 'সূর্য সম্পর্কে বলুন',
        'go to next planet': 'পরবর্তী গ্রহে যান',
        'go to previous planet': 'পূর্ববর্তী গ্রহে যান',
        'change to bengali': 'বাংলায় পরিবর্তন করুন',
        'change to english': 'ইংরেজিতে পরিবর্তন করুন',
        'what is this': 'এটা কী',
        'how far is it': 'এটা কত দূরে',
        'what is the temperature': 'তাপমাত্রা কত'
      }
    };
  }

  async translate(text, sourceLang, targetLang) {
    if (!text || text.trim() === '') {
      throw new Error('Text to translate cannot be empty');
    }

    const source = sourceLang.toLowerCase();
    const target = targetLang.toLowerCase();

    // Check if same language
    if (source === target) {
      return text;
    }

    // For Indian languages, prioritize our comprehensive fallback for space-related terms
    const indianLanguages = ['hi', 'kn', 'ta', 'te', 'mr', 'bn', 'gu', 'ur'];
    const isIndianLanguage = indianLanguages.includes(target);
    
    // Check if this is a space-related term or phrase
    const spaceTerms = [
      'sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
      'planet', 'solar system', 'galaxy', 'universe', 'star', 'moon', 'asteroid', 'comet', 'orbit', 'gravity',
      'tell me about', 'next planet', 'previous planet', 'change language', 'voice command', 'fullscreen'
    ];
    
    const lowerText = text.toLowerCase();
    const isSpaceRelated = spaceTerms.some(term => lowerText.includes(term));
    
    // For Indian languages and space-related terms, use our comprehensive fallback first
    if (isIndianLanguage && isSpaceRelated) {
      const fallbackText = this.getComprehensiveFallback(text, source, target);
      if (fallbackText && fallbackText !== `${text} (translation unavailable)` && !fallbackText.includes('translation unavailable')) {
        console.log(`🔄 Using comprehensive fallback for Indian language and space term: "${text}" -> "${fallbackText}"`);
        return fallbackText;
      }
    }

    // Try multiple providers in order of reliability
    const providers = ['google', 'microsoft', 'mymemory', 'libre'];
    
    for (const providerName of providers) {
      try {
        const translatedText = await this.providers[providerName](text, source, target);
        if (translatedText && translatedText.trim() !== '') {
          console.log(`✅ ${providerName} translation successful: "${text}" -> "${translatedText}"`);
          return translatedText;
        }
      } catch (error) {
        console.log(`❌ ${providerName} translation failed: ${error.message}`);
        continue;
      }
    }

    // If all providers fail, use comprehensive fallback
    const fallbackText = this.getComprehensiveFallback(text, source, target);
    console.log(`🔄 Using comprehensive fallback: "${text}" -> "${fallbackText}"`);
    return fallbackText;
  }

  async googleTranslate(text, sourceLang, targetLang) {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      throw new Error('Google Translate API key not configured');
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    
    const response = await axios.post(url, {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    }, {
      timeout: 10000
    });

    if (response.data?.data?.translations?.[0]?.translatedText) {
      return response.data.data.translations[0].translatedText;
    }

    throw new Error('Invalid response from Google Translate');
  }

  async microsoftTranslate(text, sourceLang, targetLang) {
    const apiKey = process.env.MICROSOFT_TRANSLATOR_KEY;
    if (!apiKey) {
      throw new Error('Microsoft Translator key not configured');
    }

    const endpoint = 'https://api.cognitive.microsofttranslator.com';
    const location = process.env.MICROSOFT_TRANSLATOR_REGION || 'global';

    const url = `${endpoint}/translate?api-version=3.0&from=${sourceLang}&to=${targetLang}`;
    
    const response = await axios.post(url, [{
      text: text
    }], {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Ocp-Apim-Subscription-Region': location,
        'Content-Type': 'application/json',
        'X-ClientTraceId': this.generateUUID()
      },
      timeout: 10000
    });

    if (response.data?.[0]?.translations?.[0]?.text) {
      return response.data[0].translations[0].text;
    }

    throw new Error('Invalid response from Microsoft Translator');
  }

  async myMemoryTranslate(text, sourceLang, targetLang) {
    const baseUrl = 'https://api.mymemory.translated.net/get';
    const apiKey = process.env.MYMEMORY_API_KEY || '';

    const params = {
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
      key: apiKey
    };

    const response = await axios.get(baseUrl, { 
      params,
      timeout: 10000
    });

    if (response.data?.responseData?.translatedText) {
      return response.data.responseData.translatedText;
    }

    throw new Error('Invalid response from MyMemory');
  }

  async libreTranslate(text, sourceLang, targetLang) {
    const baseUrl = process.env.LIBRE_BASE_URL || 'https://libretranslate.com';
    const apiKey = process.env.LIBRE_API_KEY;

    const payload = {
      q: text,
      source: sourceLang,
      target: targetLang
    };

    if (apiKey) {
      payload.api_key = apiKey;
    }

    const response = await axios.post(`${baseUrl}/translate`, payload, {
      timeout: 10000
    });

    if (response.data?.translatedText) {
      return response.data.translatedText;
    }

    throw new Error('Invalid response from LibreTranslate');
  }

  getComprehensiveFallback(text, sourceLang, targetLang) {
    const langPair = `${sourceLang}-${targetLang}`;
    const translations = this.fallbackTranslations[langPair];
    
    if (!translations) {
      return `${text} (translation unavailable)`;
    }

    const lowerText = text.toLowerCase().trim();
    
    // First try exact matches
    if (translations[lowerText]) {
      return translations[lowerText];
    }
    
    // Then try complete sentence matches (longer phrases first)
    const phrases = Object.keys(translations)
      .filter(key => key.includes(' '))
      .sort((a, b) => b.length - a.length);
    
    for (const phrase of phrases) {
      if (lowerText.includes(phrase)) {
        return text.replace(new RegExp(phrase, 'gi'), translations[phrase]);
      }
    }
    
    // Then try word-by-word translation
    const words = lowerText.split(' ');
    const translatedWords = words.map(word => {
      return translations[word] || word;
    });
    
    return translatedWords.join(' ');
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'Hindi' },
      { code: 'kn', name: 'Kannada' },
      { code: 'ta', name: 'Tamil' },
      { code: 'te', name: 'Telugu' },
      { code: 'mr', name: 'Marathi' },
      { code: 'bn', name: 'Bengali' },
      { code: 'gu', name: 'Gujarati' },
      { code: 'ur', name: 'Urdu' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' }
    ];
  }
}

module.exports = new EnhancedTranslationProvider();
