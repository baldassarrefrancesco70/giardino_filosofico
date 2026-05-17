const CACHE_NAME = "giardino-filosofico-v1";

// File da mettere in cache per uso offline
const STATIC_ASSETS = [
  "/giardino_filosofico/",
  "/giardino_filosofico/index.html",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
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
self.addEventListener("fetch", event => {
  // Non intercettare richieste a Supabase — devono sempre andare online
  if (event.request.url.includes("supabase.co")) return;

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
          return caches.match("/giardino_filosofico/index.html");
        });
      })
  );
});
