# Deployment Guide

## Quick Deployment

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd QubeXP
cd server
npm install
```

### 2. Start the Server
```bash
# From the project root
./start-server.sh
```

### 3. Access the Application
- **Main Experience**: https://localhost:8040
- **VR Mode**: https://localhost:8040/vr

## Production Deployment

### Environment Setup

The `.env` file is already configured with the working Sarvam API key:
```env
SARVAM_KEY=sk_9f49gjcz_3CI1R2e6fHW6jNFL9YV7NX7m
```

### Server Configuration

The server runs on HTTPS port 8040 by default. To change the port:
```bash
HTTPS_PORT=8080 ./start-server.sh
```

### SSL Certificates

For production, replace the self-signed certificates in `server/ssl/` with proper SSL certificates:
- `server/ssl/key.pem` - Private key
- `server/ssl/cert.pem` - Certificate

### Process Management

For production, consider using PM2 for process management:
```bash
npm install -g pm2
pm2 start server/server-https.js --name "solarlearn-vr" --env production
pm2 save
pm2 startup
```

## Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY . .
EXPOSE 8040
CMD ["node", "server/server-https.js"]
```

Build and run:
```bash
docker build -t solarlearn-vr .
docker run -p 8040:8040 solarlearn-vr
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   pkill -f "server-https.js"
   ./start-server.sh
   ```

2. **SSL certificate errors**
   - Accept self-signed certificate in browser
   - For production, use proper SSL certificates

3. **API key not working**
   - Verify `.env` file contains correct `SARVAM_KEY`
   - Check server logs for API errors

### Logs

Server logs include:
- Translation requests and responses
- TTS audio generation
- Model loading status
- Error messages

## Performance Optimization

### Caching
- Translation results are cached automatically
- 3D models are cached by the browser
- TTS audio is cached for repeated phrases

### Scaling
- Use load balancer for multiple server instances
- Consider CDN for static assets
- Database for persistent caching (optional)

## Security Considerations

- API keys are stored in environment variables
- HTTPS is required for VR functionality
- CORS is configured for allowed origins
- Input validation on all API endpoints
