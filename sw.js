// Service worker minimal : l'application passe toujours par Internet (données toujours à jour).
// Si le réseau est coupé, une page simple s'affiche au lieu d'une erreur.
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  if(e.request.mode!=='navigate')return;
  e.respondWith(fetch(e.request).catch(()=>new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="font-family:sans-serif;background:#14294d;color:#fff;text-align:center;padding:60px 20px"><h2>Pas de connexion Internet</h2><p>Vérifiez votre connexion puis réessayez.</p><button onclick="location.reload()" style="padding:12px 24px;border-radius:10px;border:0">Réessayer</button></body>',{headers:{'Content-Type':'text/html; charset=utf-8'}})));
});
