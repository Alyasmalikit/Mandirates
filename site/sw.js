var C='mr-1795276665';
self.addEventListener('install',function(e){self.skipWaiting();e.waitUntil(caches.open(C).then(function(c){return c.addAll(['/','/theme.css','/app.js','/logic.js','/icon.svg'])}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){if(e.request.method!=='GET')return;var u=new URL(e.request.url);if(u.origin!==location.origin)return;
if(u.pathname.indexOf('/api/')===0||u.pathname.indexOf('/data/')===0){e.respondWith(fetch(e.request).then(function(r){var c2=r.clone();caches.open(C).then(function(c){c.put(e.request,c2)});return r}).catch(function(){return caches.match(e.request)}));return}
e.respondWith(caches.match(e.request).then(function(m){var n=fetch(e.request).then(function(r){var c2=r.clone();if(r.ok)caches.open(C).then(function(c){c.put(e.request,c2)});return r}).catch(function(){return m});return m||n}))});
