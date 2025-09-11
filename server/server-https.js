const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.HTTPS_PORT || 8443;

// SSL Certificate configuration
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem'))
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration - Allow all origins for development
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Static files - serve root directory for new structure
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/health', require('./src/routes/health'));
app.use('/api/planets', require('./src/routes/planets'));
app.use('/api/translate', require('./src/routes/translate'));
app.use('/api/tts', require('./src/routes/tts'));

// Serve PWA manifest (if exists in solar-system)
app.get('/manifest.json', (req, res) => {
  const manifestPath = path.join(__dirname, '../solar-system/manifest.json');
  if (fs.existsSync(manifestPath)) {
    res.sendFile(manifestPath);
  } else {
    res.status(404).send('Manifest not found');
  }
});

// Serve service worker (if exists in solar-system)
app.get('/service-worker.js', (req, res) => {
  const swPath = path.join(__dirname, '../solar-system/service-worker.js');
  if (fs.existsSync(swPath)) {
    res.sendFile(swPath);
  } else {
    res.status(404).send('Service worker not found');
  }
});

// Main routes - serve new selection screen
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Solar system VR route
app.get('/solar-system/vr', (req, res) => {
  res.sendFile(path.join(__dirname, '../solar-system/working-vr.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.log('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Create HTTPS server
const httpsServer = https.createServer(sslOptions, app);

// Start HTTPS server
httpsServer.listen(PORT, () => {
  console.log(`🔒 SolarLearn VR HTTPS Server running on port ${PORT}`);
  console.log(`📱 Main VR Experience at: https://localhost:${PORT}`);
  console.log(`🎮 VR Mode at: https://localhost:${PORT}/vr`);
  console.log(`✅ HTTPS enabled - Ready for VR headset!`);
  console.log(`⚠️  Note: Accept the self-signed certificate warning in your browser/headset`);
});

// Handle server errors
httpsServer.on('error', (err) => {
  console.error('HTTPS Server Error:', err);
});
