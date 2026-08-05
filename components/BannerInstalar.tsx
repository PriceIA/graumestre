'use client'

import { useState, useEffect } from 'react'
import { eventoAtual, inscrever, descartarEvento, type EventoInstalacao } from '@/lib/instalacao'

// Convite para instalar o app no celular. Suporte técnico a PWA sozinho não
// resolve: sem um convite visível o professor continua abrindo pelo navegador,
// com barra de endereço comendo a tela que ele usa em pé, no tatame.
//
// Quem escuta o `beforeinstallprompt` é `lib/instalacao.ts`, desde o layout —
// aqui só se lê o que foi capturado. O motivo está lá.
//
// Inline styles e paleta iguais aos do AppShell, onde este componente é
// montado; o Tailwind não é usado naquele arquivo.

// sessionStorage, não localStorage: o pedido é não incomodar de novo na MESMA
// sessão. Numa aba nova o convite volta — quem recusou hoje pode querer
// instalar amanhã, e o custo de rever o banner é um toque.
const CHAVE_DISPENSADO = 'graumestre:banner-instalar-dispensado'

const t = {
  surface: '#161616',
  border2: 'rgba(255,255,255,0.18)',
  text: '#FFFFFF',
  textSub: 'rgba(255,255,255,0.6)',
  textMute: 'rgba(255,255,255,0.4)',
  accent: '#df2531',
}

export default function BannerInstalar() {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null)
  const [dispensado, setDispensado] = useState(true) // some até o efeito liberar

  useEffect(() => {
    if (sessionStorage.getItem(CHAVE_DISPENSADO)) return

    // Já está rodando instalado? Então não há o que convidar. O
    // beforeinstallprompt não costuma disparar nesse caso, mas a checagem é
    // barata e cobre o navegador que dispare mesmo assim.
    if (window.matchMedia('(display-mode: standalone)').matches) return

    setDispensado(false)
    // O evento pode ter sido capturado antes deste componente montar — daí ler
    // o valor atual, e não só esperar o próximo aviso.
    setEvento(eventoAtual())
    return inscrever(setEvento)
  }, [])

  // Sem evento capturado, nada é renderizado. É isso que cobre iOS/Safari, que
  // não implementa beforeinstallprompt — sem farejar user-agent, que é sempre
  // frágil.
  if (dispensado || !evento) return null

  const instalar = async () => {
    await evento.prompt()
    // Aceite o professor ou não, o evento não serve mais e o banner some. Se
    // recusou, insistir irrita; se aceitou, o `appinstalled` já o teria limpado.
    await evento.userChoice
    descartarEvento()
  }

  const dispensar = () => {
    sessionStorage.setItem(CHAVE_DISPENSADO, '1')
    setDispensado(true)
  }

  return (
    <div
      style={{
        // zIndex 90: abaixo dos modais do AppShell (100 e 120) e da splash
        // (9999), acima do conteúdo. Um convite nunca deve cobrir a chamada.
        position: 'fixed', zIndex: 90,
        left: 12, right: 12, bottom: 12,
        maxWidth: 420, marginLeft: 'auto', marginRight: 'auto',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 10,
        background: t.surface, border: `1px solid ${t.border2}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: t.text, fontSize: 14, fontWeight: 700 }}>
          Instale o GrauMestre no seu celular
        </div>
        <div style={{ color: t.textSub, fontSize: 12, marginTop: 2, lineHeight: 1.4 }}>
          Abre direto, em tela cheia, sem o navegador.
        </div>
      </div>

      <button
        onClick={instalar}
        style={{
          flexShrink: 0, padding: '10px 16px', borderRadius: 8, border: 'none',
          background: t.accent, color: '#fff', fontWeight: 800, fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Instalar
      </button>

      <button
        onClick={dispensar}
        aria-label="Dispensar"
        style={{
          flexShrink: 0, width: 32, height: 32, borderRadius: 8,
          border: `1px solid ${t.border2}`, background: 'transparent',
          color: t.textMute, fontSize: 16, lineHeight: 1, cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
  )
}
