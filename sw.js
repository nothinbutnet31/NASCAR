const CACHE_NAME = 'fantasy-nascar-v1';
const urlsToCache = [
  '/NASCAR/',
  '/NASCAR/index.html',
  '/NASCAR/styles.css',
  '/NASCAR/script.js',
  '/NASCAR/manifest.json',
  '/NASCAR/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.log('Failed to cache:', url, error);
              return null;
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
        return new Response('Offline content');
      })
  );
});
