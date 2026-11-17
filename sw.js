// Minimal service worker: lets the site be installed. Pages are always loaded fresh from the network.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>new Response('You are offline. Please reconnect to read your notes.',{status:503,headers:{'Content-Type':'text/plain'}})))});
