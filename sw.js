// Service Worker - Ventas Cienfuegos
// Estrategia: Cache-first para assets, Network-first para datos
const CACHE = "vc-tienda-v2";
const ASSETS = ["./index.html","./admin.html","./manifest.json","./icon-192.png","./icon-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>
    Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
  ).then(()=>self.clients.claim()));
});

self.addEventListener("fetch", e=>{
  const url = e.request.url;
  // productos.json: siempre red primero, cache como respaldo
  if(url.includes("productos.json")){
    e.respondWith(
      fetch(e.request).then(r=>{
        const clone = r.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone));
        return r;
      }).catch(()=>caches.match(e.request))
    );
    return;
  }
  // Imágenes de productos: cache-first (ahorra datos en conexiones lentas)
  if(url.includes("/imagenes/")){
    e.respondWith(
      caches.match(e.request).then(cached=>{
        if(cached) return cached;
        return fetch(e.request).then(r=>{
          const clone = r.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
          return r;
        });
      })
    );
    return;
  }
  // Assets estáticos: cache-first
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));
});
