const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Simple TTS endpoint using browser speech synthesis
router.post('/tts', async (req, res) => {
  try {
    const { text, lang } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // For now, return a simple response indicating TTS would be handled client-side
    // The working-vr.html will fall back to browser speech synthesis
    res.json({ 
      success: true, 
      message: 'TTS handled client-side',
      text: text,
      lang: lang || 'en'
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS service error' });
  }
});

// Gemini Chat endpoint for Q&A
router.post('/gemini-chat', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`🤖 Gemini request: "${question}"`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ 
              text: `You are a helpful astronomy guide for school students. Answer this question about the solar system, planets, or space in a clear and educational way. Keep your answer concise but informative: ${question}` 
            }] 
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer found.";

    console.log(`✅ Gemini response: "${answer}"`);

    res.json({ 
      success: true, 
      answer: answer
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Gemini API failed',
      answer: "Sorry, I couldn't get an answer right now. Please try asking about a specific planet or solar system topic."
    });
  }
});

// Translation endpoint using Sarvam
router.post('/translate', async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // If source and target languages are the same, return original text
    if (sourceLang === targetLang) {
      return res.json({ 
        success: true,
        translatedText: text,
        sourceLang: sourceLang || 'en',
        targetLang: targetLang || 'en'
      });
    }

    console.log(`🌐 Translating: "${text.substring(0, 50)}..." from ${sourceLang} to ${targetLang}`);

    // Use Sarvam translation API
    const response = await fetch('https://api.sarvam.ai/v1/translate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SARVAM_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        source_language: sourceLang,
        target_language: targetLang
      })
    });

    if (!response.ok) {
      throw new Error(`Sarvam translation error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.translated_text || text;

    console.log(`✅ Translation result: "${translatedText.substring(0, 50)}..."`);

    res.json({ 
      success: true,
      translatedText: translatedText,
      sourceLang: sourceLang || 'en',
      targetLang: targetLang || 'en'
    });
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback to original text if translation fails
    res.json({ 
      success: true,
      translatedText: text,
      sourceLang: sourceLang || 'en',
      targetLang: targetLang || 'en'
    });
  }
});

module.exports = router;

