const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

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

// Static files - serve from project root to include all modules
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/health', require('./src/routes/health'));
app.use('/api/planets', require('./src/routes/planets'));
app.use('/api/indus-valley', require('./src/routes/indus-valley'));
app.use('/api/translate', require('./src/routes/translate'));
app.use('/api/tts', require('./src/routes/tts'));
// AI endpoints for working-vr.html
app.use('/api/ai', require('./src/routes/ai-endpoints'));

// Serve PWA manifest
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/manifest.json'));
});

// Serve service worker
app.get('/service-worker.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/service-worker.js'));
});

// Main route - serve index.html as the main experience
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Solar System routes
app.get('/solar-system', (req, res) => {
  res.sendFile(path.join(__dirname, '../solar-system/index.html'));
});

app.get('/solar-system/', (req, res) => {
  res.sendFile(path.join(__dirname, '../solar-system/index.html'));
});

// Indus Valley routes
app.get('/indus-valley', (req, res) => {
  res.sendFile(path.join(__dirname, '../indus-valley/index.html'));
});

app.get('/indus-valley/', (req, res) => {
  res.sendFile(path.join(__dirname, '../indus-valley/index.html'));
});

// Legacy working-vr route
app.get('/working-vr', (req, res) => {
  res.sendFile(path.join(__dirname, '../solar-system/working-vr.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`🚀 SolarLearn VR Server running on HTTP port ${PORT}`);
  console.log(`🎮 VR Experience at: http://localhost:${PORT}`);
  console.log(`📱 Working VR at: http://localhost:${PORT}/working-vr`);
  console.log(`⚠️  Note: For VR features, use HTTPS in production`);
});
