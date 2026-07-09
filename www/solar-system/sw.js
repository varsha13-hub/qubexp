const CACHE_NAME = "solar-vr-v1";
const ASSETS = [
  "./index.html",
  "./vr-scene.js",
  "./tts.js",
  "./styles.css",
  "./assets/planets/Sun.glb",
  "./assets/planets/Mercury.glb",
  "./assets/planets/Venus.glb",
  "./assets/planets/Earth.glb",
  "./assets/planets/Mars.glb",
  "./assets/planets/Jupiter.glb",
  "./assets/planets/Saturn.glb",
  "./assets/planets/Uranus.glb",
  "./assets/planets/Neptune.glb"
];

// Install & cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Serve from cache if offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});

