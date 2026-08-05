// Service worker mínimo, de propósito.
//
// Ele existe por um motivo só: o Chrome exige um service worker registrado
// COM handler de `fetch` para considerar o app instalável e disparar o
// `beforeinstallprompt`. Não há estratégia de cache aqui e não deve haver sem
// uma etapa própria que decida invalidação — cachear resposta do Supabase por
// engano faria o professor ver chamada e presença desatualizadas no tatame,
// que é exatamente o erro que o app não pode cometer.

self.addEventListener('install', () => {
  // Assume o controle sem esperar as abas antigas fecharem.
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(self.clients.claim())
})

// Handler vazio: sem `respondWith`, o browser segue com a requisição de rede
// normal. É o requisito de instalabilidade satisfeito sem interceptar nada.
self.addEventListener('fetch', () => {})
