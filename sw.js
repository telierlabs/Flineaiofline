const V='fline-v2';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192-1.png','./icon-512-1.png'];
const HOSTS=['cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install',e=>{
 e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
 const r=e.request;
 if(r.method!=='GET'||r.headers.has('range'))return;
 const u=new URL(r.url);
 // model GGUF diurus sendiri oleh wllama (cache browser), jangan dicegat
 if(u.pathname.endsWith('.gguf')||u.hostname.endsWith('huggingface.co')||u.hostname.endsWith('hf.co'))return;
 // halaman: coba jaringan dulu biar update cepat, kalau offline pakai cache
 if(r.mode==='navigate'){
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put('./index.html',cp));return res}).catch(()=>caches.match('./index.html')));
  return;
 }
 if(u.origin!==location.origin&&!HOSTS.includes(u.hostname))return;
 // file lain: cache dulu, update diam-diam
 e.respondWith(caches.match(r).then(hit=>{
  const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>hit);
  return hit||net;
 }));
});
