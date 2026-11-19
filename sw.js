// Service worker — Recrutement Moule & Smile
// Changer le numéro de version à chaque livraison pour forcer la mise à jour.
const CACHE = 'recrutement-v8-20261119-1533';
const FICHIERS = ['./', './index.html', './postuler.html', './contrats.js', './config.js', './manifest.json', './icon.svg', './icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Réseau d'abord (toujours la dernière version), cache en secours hors connexion.
// Les appels au script Google ne passent jamais par le cache.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => { const copie = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)); return r; })
      .catch(() => caches.match(e.request))
  );
});
