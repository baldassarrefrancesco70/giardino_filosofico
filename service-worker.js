const CACHE_NAME = "giardino-filosofico-v2";

// File da mettere in cache per uso offline
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"
];

// Installazione: mette in cache i file statici
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log("Cache parziale:", err);
      });
    })
  );
  self.skipWaiting();
});

// Attivazione: elimina cache vecchie
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network first, poi cache come fallback
// Intercetta solo GET dello stesso dominio: le chiamate a Firebase Auth/
// Firestore (POST, cross-origin, spesso long-polling) devono passare dirette.
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin && !event.request.url.startsWith("https://cdnjs.cloudflare.com/")) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Aggiorna la cache con la risposta fresca
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: usa la cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Se non c'è neanche la cache, mostra la pagina principale
          return caches.match("/index.html");
        });
      })
  );
});
