const CACHE_NAME = 'solar-vr-v3';

// Add all files that need to be cached for offline use
const CACHE_URLS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/tts-offline.js',
  '/scripts/voice.js',
  '/scripts/vr-scene.js',
  '/vr',
  '/vr/',
  '/working-vr',
  '/working-vr.html',
  // A-Frame and dependencies
  'https://aframe.io/releases/1.4.0/aframe.min.js',
  'https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.0.0/dist/aframe-extras.min.js',
  'https://unpkg.com/aframe-environment-component@1.3.2/dist/aframe-environment-component.min.js',
  // Audio files - English
  '/audio/en/sun.mp3',
  '/audio/en/mercury.mp3',
  '/audio/en/venus.mp3',
  '/audio/en/earth.mp3',
  '/audio/en/mars.mp3',
  '/audio/en/jupiter.mp3',
  '/audio/en/saturn.mp3',
  '/audio/en/uranus.mp3',
  '/audio/en/neptune.mp3',
  '/audio/en/overview.mp3',
  '/audio/en/conclusion.mp3',
  // Audio files - Hindi
  '/audio/hi/sun.mp3',
  '/audio/hi/mercury.mp3',
  '/audio/hi/venus.mp3',
  '/audio/hi/earth.mp3',
  '/audio/hi/mars.mp3',
  '/audio/hi/jupiter.mp3',
  '/audio/hi/saturn.mp3',
  '/audio/hi/uranus.mp3',
  '/audio/hi/neptune.mp3',
  '/audio/hi/overview.mp3',
  '/audio/hi/conclusion.mp3',
  // 3D Models
  '/models/sun.glb',
  '/models/mercury.glb',
  '/models/venus.glb',
  '/models/earth.glb',
  '/models/mars.glb',
  '/models/jupiter.glb',
  '/models/saturn.glb',
  '/models/uranus.glb',
  '/models/neptune.glb',
  // Icons
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // Manifest
  '/manifest.json'
];

// Install event - cache all required files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching files for offline use');
        return cache.addAll(CACHE_URLS.map(url => {
          // Handle both absolute and relative URLs
          if (url.startsWith('http')) {
            return url;
          }
          return new URL(url, self.location.origin + '/solar-system').href;
        }));
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Helper function to normalize URLs
function normalizeUrl(url) {
  // Remove query parameters and hash
  const urlObj = new URL(url);
  urlObj.search = '';
  urlObj.hash = '';
  return urlObj.href;
}

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(normalizeUrl(event.request.url))
      .then((response) => {
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        console.log('Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            // Add the new file to cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(normalizeUrl(event.request.url), responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('Fetch failed:', error);
            // Return any cached version as fallback
            return caches.match(event.request);
          });
      })
  );
});