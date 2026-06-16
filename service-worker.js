self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.open("litfut-v2").then(async cache => {
      const cached = await cache.match(event.request);

      if (cached) {
        return cached;
      }

      const response = await fetch(event.request);
      cache.put(event.request, response.clone());

      return response;
    })
  );
});