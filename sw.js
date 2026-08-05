const CACHE_NAME = 'eps-joliot-curie-v1';
const CORE_ASSETS = [
  'testsphysiques.html',
  'assets/25QP61_bande_son_test_endurance.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Stratégie "réseau d'abord" : en ligne, on récupère toujours la dernière version
// déployée (et on la met à jour en cache) ; hors ligne, on sert la dernière copie
// connue. Les requêtes vers Google (Sheets/Apps Script) ne sont jamais interceptées
// ici — elles gardent leur propre gestion d'erreur côté application.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
