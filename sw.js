// Offline support: network-first (so new deploys show up immediately), falling back to the
// cached copy when there's no signal — e.g. playing in the car.
const CACHE = 'miraculous-claw-v1';
const CORE = [
    './',
    'index.html',
    'css/style.css',
    'js/game.js',
    'js/input.js',
    'js/touch.js',
    'js/player.js',
    'js/enemy.js',
    'js/level.js',
    'js/hud.js',
    'js/particles.js',
    'js/audio.js',
    'manifest.webmanifest',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
    e.respondWith(
        fetch(req)
            .then((res) => {
                if (res.ok) {
                    const copy = res.clone();
                    caches.open(CACHE).then((c) => c.put(req, copy));
                }
                return res;
            })
            .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
    );
});
