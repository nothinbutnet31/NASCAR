const CACHE_NAME = 'fantasy-nascar-v1';
const urlsToCache = [
  '/NASCAR/',  // Adjusted for GitHub Pages
  '/NASCAR/index.html',
  '/NASCAR/styles.css',
  '/NASCAR/script.js',
  '/NASCAR/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];


self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(url =>
          fetch(url)
            .then(response => {
              if (!response.ok) throw new Error(`Request failed: ${url}`);
              return cache.put(url, response);
            })
            .catch(error => console.warn('Not caching:', url, error))
        )
      );
    })
  );
});


self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
        .then(fetchResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchResponse.clone()); // Cache new requests
            return fetchResponse;
          });
        });
    }).catch(() => {
      if (event.request.destination === 'document') {
        return caches.match('/NASCAR/index.html'); // Serve index.html if offline
      }
    })
  );
});
