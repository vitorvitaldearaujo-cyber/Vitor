// Service Worker da Agenda Inteligente: cache offline + notificações com botões
const CACHE = 'agenda-inteligente-v1';
const SHELL = ['./', './agenda-inteligente.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.ok && new URL(e.request.url).origin === location.origin) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./agenda-inteligente.html')))
  );
});
// Toque na notificação ou nos botões Concluído / Adiar
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const acao = e.action || '';
  const p = e.notification.data && e.notification.data.p;
  e.waitUntil((async () => {
    const lista = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (lista.length) {
      const c = lista[0];
      if (acao && p) c.postMessage({ tipo: 'acao', acao, p });
      return c.focus();
    }
    let url = './agenda-inteligente.html';
    if (acao && p) url += '?acao=' + encodeURIComponent(acao) + '&p=' + encodeURIComponent(JSON.stringify(p));
    return self.clients.openWindow(url);
  })());
});
