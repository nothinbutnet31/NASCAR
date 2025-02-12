const CACHE_NAME = 'fantasy-nascar-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache what we can, ignore failures
        return Promise.all(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.log(`Failed to cache ${url}:`, error);
              return Promise.resolve(); // Continue despite error
            })
          )
        );
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        // Return a basic offline message if needed
        return new Response('Offline. Please check your connection.');
      })
  );
});
