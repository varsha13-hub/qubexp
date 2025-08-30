const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      translation: process.env.TRANSLATE_PROVIDER || 'libre',
      stt: 'vosk',
      cors: 'enabled'
    }
  };

  res.json(health);
});

module.exports = router;
