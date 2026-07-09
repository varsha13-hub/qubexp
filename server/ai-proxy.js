// AI Q&A Proxy for Sarvam API
const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();
router.use(bodyParser.json({ limit: '64kb' }));

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Language-specific system prompts
const SYSTEM_PROMPTS = {
  en: "You are a concise educational assistant for a VR Solar System app called QubeXP. Answer questions about space, planets, astronomy, and the solar system directly and clearly in English. Keep answers brief (2-3 sentences max). If you don't know, say 'I don't have that information.' Do NOT invent facts.",
  hi: "आप QubeXP नामक VR सोलर सिस्टम ऐप के लिए एक संक्षिप्त शैक्षिक सहायक हैं। अंतरिश्च, ग्रहों, खगोल विज्ञान और सौर मंडल के बारे में सवालों का जवाब हिंदी में स्पष्ट रूप से दें। उत्तर संक्षिप्त रखें (अधिकतम 2-3 वाक्य)। अगर आपको नहीं पता, तो कहें 'मुझे यह जानकारी नहीं है।' तथ्यों को गढ़ें नहीं।",
  kn: "ನೀವು QubeXP ಎಂಬ VR ಸೌರವ್ಯೂಹ ಅಪ್ಲಿಕೇಶನ್‌ಗಾಗಿ ಸಂಕ್ಷಿಪ್ತ ಶೈಕ್ಷಣಿಕ ಸಹಾಯಕರು. ಅಂತರಿಕ್ಷ, ಗ್ರಹಗಳು, ಖಗೋಳಶಾಸ್ತ್ರ ಮತ್ತು ಸೌರವ್ಯೂಹದ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳಿಗೆ ಕನ್ನಡದಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ಉತ್ತರಿಸಿ. ಉತ್ತರಗಳನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಇರಿಸಿ (ಗರಿಷ್ಠ 2-3 ವಾಕ್ಯಗಳು). ನಿಮಗೆ ತಿಳಿದಿಲ್ಲದಿದ್ದರೆ, 'ನನಗೆ ಈ ಮಾಹಿತಿ ಇಲ್ಲ' ಎಂದು ಹೇಳಿ. ಸತ್ಯಗಳನ್ನು ರಚಿಸಬೇಡಿ.",
  ta: "நீங்கள் QubeXP என்ற VR சோலார் சிஸ்டம் பயன்பாட்டுக்கான சுருக்கமான கல்வி உதவியாளர். விண்வெளி, கோள்கள், வானியல் மற்றும் சூரிய குடும்பம் பற்றிய கேள்விகளுக்கு தமிழில் தெளிவாக பதிலளிக்கவும். பதில்களை சுருக்கமாக வைக்கவும் (அதிகபட்சம் 2-3 வாக்கியங்கள்). உங்களுக்குத் தெரியாவிட்டால், 'எனக்கு இந்தத் தகவல் இல்லை' என்று சொல்லுங்கள். உண்மைகளை உருவாக்காதீர்கள்.",
  te: "మీరు QubeXP అనే VR సోలార్ సిస్టమ్ యాప్ కోసం సంక్షిప్త విద్యా సహాయకులు. అంతరిక్షం, గ్రహాలు, ఖగోళశాస్త్రం మరియు సౌర వ్యవస్థ గురించి ప్రశ్నలకు తెలుగులో స్పష్టంగా సమాధానం ఇవ్వండి. సమాధానాలను సంక్షిప్తంగా ఉంచండి (గరిష్టంగా 2-3 వాక్యాలు). మీకు తెలియకపోతే, 'నాకు ఈ సమాచారం లేదు' అని చెప్పండి. వాస్తవాలను రూపొందించవద్దు.",
  bn: "আপনি QubeXP নামের একটি VR সোলার সিস্টেম অ্যাপের জন্য একটি সংক্ষিপ্ত শিক্ষা সহায়ক। মহাকাশ, গ্রহ, জ্যোতির্বিদ্যা এবং সৌরজগত সম্পর্কে প্রশ্নের উত্তর বাংলায় স্পষ্টভাবে দিন। উত্তরগুলি সংক্ষিপ্ত রাখুন (সর্বোচ্চ 2-3 বাক্য)। আপনার জানা না থাকলে, 'আমার এই তথ্য নেই' বলুন। তথ্য তৈরি করবেন না।"
};

function buildPrompt(question, lang = 'en') {
  const systemPrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.en;
  return `${systemPrompt}\n\nUser question: ${question}\n\nAnswer concisely:`;
}

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// Clean cache every 10 minutes
setInterval(cleanCache, 10 * 60 * 1000);

router.post('/ai-ask', async (req, res) => {
  const { question, lang = 'en' } = req.body || {};
  
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ ok: false, error: 'missing-question' });
  }

  const SARVAM_API_KEY = process.env.SARVAM_API_KEY || process.env.SARVAM_KEY;
  if (!SARVAM_API_KEY) {
    console.warn('SARVAM_API_KEY not set; /api/ai-ask will use fallback');
    return res.json({ 
      ok: true, 
      answer: getOfflineFallback(question, lang),
      source: 'fallback' 
    });
  }

  const cacheKey = `${lang}::${question.trim().toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('[AI] Cache hit:', cacheKey);
    return res.json({ ok: true, answer: cached.answer, source: 'cache' });
  }

  const prompt = buildPrompt(question, lang);
  
  try {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    // Use Sarvam AI's chat/completion endpoint
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SARVAM_API_KEY}`
      },
      body: JSON.stringify({
        model: 'sarvam-30b',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.en },
          { role: 'user', content: question }
        ],
        max_tokens: 300,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[AI] Sarvam API error:', response.status, text);
      
      // Fallback to offline answer
      return res.json({ 
        ok: true, 
        answer: getOfflineFallback(question, lang),
        source: 'fallback',
        debug: { status: response.status, error: text }
      });
    }

    const json = await response.json();
    console.log('[AI] Sarvam response:', JSON.stringify(json).slice(0, 200));

    // Extract answer from Sarvam response
    let answer = null;
    if (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) {
      answer = json.choices[0].message.content.trim();
    } else if (json.text) {
      answer = json.text.trim();
    } else if (json.output) {
      answer = json.output.trim();
    }

    if (!answer || answer.length < 5) {
      console.warn('[AI] No valid answer from Sarvam, using fallback');
      answer = getOfflineFallback(question, lang);
    }

    // Cache the result
    cache.set(cacheKey, { answer, timestamp: Date.now() });

    return res.json({ ok: true, answer, source: 'ai' });

  } catch (err) {
    console.error('[AI] Error:', err);
    return res.json({ 
      ok: true, 
      answer: getOfflineFallback(question, lang),
      source: 'fallback',
      debug: { error: err.message }
    });
  }
});

// Offline fallback answers for common questions
function getOfflineFallback(question, lang) {
  const q = question.toLowerCase();
  
  const fallbacks = {
    en: {
      default: "I don't have that information right now, but you can explore the planets in the tour to learn more!",
      mars: "Mars is the fourth planet from the Sun, known as the Red Planet due to iron oxide on its surface. It has two moons: Phobos and Deimos.",
      jupiter: "Jupiter is the largest planet in our solar system, a gas giant with a Great Red Spot storm and at least 79 moons.",
      earth: "Earth is the third planet from the Sun and the only known planet to support life, with 71% of its surface covered by water.",
      venus: "Venus is the second planet from the Sun and the hottest planet in our solar system due to its thick atmosphere of carbon dioxide.",
      saturn: "Saturn is the sixth planet from the Sun, famous for its beautiful ring system made of ice and rock particles.",
      mercury: "Mercury is the smallest planet and closest to the Sun, with extreme temperature variations between day and night.",
      uranus: "Uranus is the seventh planet from the Sun, an ice giant that rotates on its side, making it unique in our solar system.",
      neptune: "Neptune is the eighth and farthest planet from the Sun, known for its deep blue color and powerful winds.",
      sun: "The Sun is a star at the center of our solar system, providing light and heat to all planets. It's made mostly of hydrogen and helium."
    },
    hi: {
      default: "मुझे अभी यह जानकारी नहीं है, लेकिन आप टूर में ग्रहों का पता लगाकर और अधिक जान सकते हैं!",
      mars: "मंगल सूर्य से चौथा ग्रह है, जिसे लाल ग्रह के रूप में जाना जाता है। इसके दो चंद्रमा हैं: फोबोस और डीमोस।",
      jupiter: "बृहस्पति हमारे सौर मंडल का सबसे बड़ा ग्रह है, एक गैस विशाल जिसमें कम से कम 79 चंद्रमा हैं।"
    },
    kn: {
      default: "ನನಗೆ ಈಗ ಆ ಮಾಹಿತಿ ಇಲ್ಲ, ಆದರೆ ನೀವು ಪ್ರವಾಸದಲ್ಲಿ ಗ್ರಹಗಳನ್ನು ಅನ್ವೇಷಿಸಿ ಇನ್ನಷ್ಟು ತಿಳಿದುಕೊಳ್ಳಬಹುದು!",
      mars: "ಮಂಗಳ ಸೂರ್ಯನಿಂದ ನಾಲ್ಕನೇ ಗ್ರಹ, ಕೆಂಪು ಗ್ರಹ ಎಂದು ಕರೆಯಲಾಗುತ್ತದೆ। ಇದಕ್ಕೆ ಎರಡು ಚಂದ್ರರು ಇದ್ದಾರೆ: ಫೋಬೋಸ್ ಮತ್ತು ಡೀಮೋಸ್।",
      jupiter: "ಗುರು ನಮ್ಮ ಸೌರವ್ಯೂಹದ ಅತ್ಯಂತ ದೊಡ್ಡ ಗ್ರಹ, ಕನಿಷ್ಠ 79 ಚಂದ್ರರನ್ನು ಹೊಂದಿರುವ ಅನಿಲ ದೈತ್ಯ।",
      saturn: "ಶನಿ ಸೂರ್ಯನಿಂದ ಆರನೇ ಗ್ರಹ, ಐಸ್ ಮತ್ತು ಕಲ್ಲು ಕಣಗಳಿಂದ ಮಾಡಿದ ಸುಂದರವಾದ ಉಂಗುರ ವ್ಯವಸ್ಥೆಗೆ ಹೆಸರುವಾಸಿಯಾಗಿದೆ।"
    }
  };

  const langFallbacks = fallbacks[lang] || fallbacks.en;
  
  // Planet name variations (English + transliterations)
  const planetPatterns = {
    mars: /mars|ಮರ್ಸ್|मंगल|మార్స్|செவ்வாய்|মঙ্গল/i,
    jupiter: /jupiter|ಗುರು|बृहस्पति|గురు|வியாழன்|বৃহস্পতি/i,
    saturn: /saturn|ಶನಿ|शनि|శని|சனி|শনি/i,
    venus: /venus|ಶುಕ್ರ|शुक्र|శుక్ర|வெள்ளி|শুক্র/i,
    earth: /earth|ಭೂಮಿ|पृथ्वी|భూమి|பூமி|পৃথিবী/i,
    mercury: /mercury|ಬುಧ|बुध|బుధ|புதன்|বুধ/i,
    uranus: /uranus|ಯುರೇನಸ್|अरुण|యురేనస్|யுரேனஸ்|ইউরেনাস/i,
    neptune: /neptune|ನೆಪ್ಚೂನ್|वरुण|నెప్ట్యూన్|நெப்டியூன்|নেপচুন/i,
    sun: /sun|ಸೂರ್ಯ|सूर्य|సూర్యుడు|சூரியன்|সূর্য/i
  };
  
  // Check for planet mentions using patterns
  // Only match if the question is ABOUT the planet, not just mentioning it
  const questionWords = /(?:what|who|where|tell me|explain|describe|how many).+(?:about|is|are)/i;
  
  for (const [planet, pattern] of Object.entries(planetPatterns)) {
    if (pattern.test(q) && langFallbacks[planet]) {
      // Check if it's a direct question about the planet
      // e.g., "what is mars" or "tell me about jupiter"
      const directQuestion = new RegExp(`(?:what|who|where|tell me|explain|describe|how many).{0,20}${planet}`, 'i');
      const aboutQuestion = new RegExp(`${planet}.{0,20}(?:what|who|where|is|are|has|have)`, 'i');
      
      if (directQuestion.test(q) || aboutQuestion.test(q)) {
        return langFallbacks[planet];
      }
    }
  }
  
  return langFallbacks.default;
}

module.exports = router;

