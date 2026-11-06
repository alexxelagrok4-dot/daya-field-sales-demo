const BASE=new URL('./',self.location).pathname;
const CACHE='daya-pages-demo-v2-'+BASE;
const ASSETS=["","index.html","style.css","app.mjs","map.mjs","map-symbols.mjs","metric-data.mjs","insights.mjs","offline.mjs","icon.svg","manifest.webmanifest","demo-api.mjs","vendor/leaflet.js","vendor/leaflet.css","vendor/markercluster.js","vendor/MarkerCluster.css","vendor/MarkerCluster.Default.css","vendor/exceljs.min.js","model/seed.mjs","model/config.mjs","model/commands.mjs","model/domain.mjs"].map(p=>BASE+p);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||new Response('Нет подключения',{status:503}))));});
