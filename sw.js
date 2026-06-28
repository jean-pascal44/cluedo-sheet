const CACHE_NAME = "cluedo-sheet-v33";

const ASSETS = [
    "./",
    "./index.html",
    "./css/styles.css",
    "./js/app.js",
    "./manifest.webmanifest",
    "./icons/icon.svg",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./pictures/armes/poignard.svg",
    "./pictures/armes/chandelier.svg",
    "./pictures/armes/revolver.svg",
    "./pictures/armes/corde.svg",
    "./pictures/armes/matraque.svg",
    "./pictures/armes/cle-anglaise.svg",
    "./pictures/lieux/cuisine.svg",
    "./pictures/lieux/salle-de-bal.svg",
    "./pictures/lieux/salon.svg",
    "./pictures/lieux/salle-a-manger.svg",
    "./pictures/lieux/salle-de-billard.svg",
    "./pictures/lieux/bibliotheque.svg",
    "./pictures/lieux/bureau.svg",
    "./pictures/lieux/hall.svg",
    "./pictures/lieux/veranda.svg"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetchPromise = fetch(event.request)
                .then((response) => {
                    if (response.ok && event.request.url.startsWith(self.location.origin)) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || fetchPromise;
        })
    );
});
