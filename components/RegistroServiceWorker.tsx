'use client'

import { useEffect } from 'react'
import { iniciarCaptura } from '@/lib/instalacao'

// Duas coisas que precisam acontecer cedo e uma vez só, fora do LoginGate.
// Não renderiza nada.
//
// 1. Registrar o service worker mínimo de `public/sw.js` — sem ele registrado
//    o Chrome não considera o app instalável e o `beforeinstallprompt` nunca
//    dispara. Prender isso ao login só atrasaria a instalabilidade; o SW não
//    tem cache, então não há dado do professor para proteger aqui.
// 2. Começar a escutar o `beforeinstallprompt`, que dispara logo no carregamento
//    — muito antes de o banner montar. Ver `lib/instalacao.ts`.
export default function RegistroServiceWorker() {
  useEffect(() => {
    iniciarCaptura()

    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw.js').catch(erro => {
      // Falhar aqui não quebra o app: só significa que ele não fica instalável.
      // Melhor um log do que uma tela de erro por causa de um recurso opcional.
      console.error('[GrauMestre] service worker não registrou:', erro)
    })
  }, [])

  return null
}
