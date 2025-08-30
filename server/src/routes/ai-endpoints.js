const express = require('express');
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

// Simple translation endpoint
router.post('/translate', async (req, res) => {
  try {
    const { text, sourceLang, targetLang } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // For now, return the original text (no translation)
    // This can be enhanced later with actual translation services
    res.json({ 
      success: true,
      translatedText: text,
      sourceLang: sourceLang || 'en',
      targetLang: targetLang || 'en'
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation service error' });
  }
});

module.exports = router;

