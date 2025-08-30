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

// Static files (for PWA assets)
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/health', require('./src/routes/health'));
app.use('/api/planets', require('./src/routes/planets'));
app.use('/api/translate', require('./src/routes/translate'));
app.use('/api/tts', require('./src/routes/tts'));

// Serve PWA manifest
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/manifest.json'));
});

// Serve service worker
app.get('/service-worker.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/service-worker.js'));
});

// Main routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/vr', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/working-vr.html'));
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
