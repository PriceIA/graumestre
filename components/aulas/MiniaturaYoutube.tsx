'use client'

import { useState } from 'react'
import type { Theme } from '@/lib/cores'

// ─── Miniatura do vídeo da aula (Etapa 6) ─────────────────────────────────────
// Mesmo padrão do FotoAula acima: cai de volta num estado visível em vez de
// deixar retângulo quebrado ou uma miniatura minúscula sem sentido. Aqui o
// "de volta" é o botão de texto que o card já usava antes desta etapa. `id`
// pode ser `null` (link válido pelo validador mas sem id extraível —
// studio.youtube.com, por exemplo) e cai no mesmo botão.
//
// ⚠ Vídeo privado/removido NÃO dá erro de rede — `i.ytimg.com` devolve
// HTTP 200 com uma imagem de placeholder 120×90 (bem menor que os 480×360
// do hqdefault.jpg de verdade). `onError` nunca dispara nesse caso; quem
// pega isso é o `onLoad`, comparando `naturalWidth`/`naturalHeight` da
// imagem carregada contra o tamanho do placeholder. Confirmado testando
// contra vídeo privado de verdade — não "simular" com id inventado de novo
// achando que vai reproduzir (um id que nunca existiu costuma dar o mesmo
// placeholder, mas o teste que importa é com vídeo privado/removido real).
export const LARGURA_PLACEHOLDER_YOUTUBE = 120
export const ALTURA_PLACEHOLDER_YOUTUBE = 90

export function MiniaturaYoutube({ id, link, style, t }: {
  id: string | null; link: string; style: React.CSSProperties; t: Theme
}) {
  const [falhou, setFalhou] = useState(false)

  if (!id || falhou) {
    return (
      <a
        href={link} target="_blank" rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{
          ...style,
          background: t.ativoBg, border: `1px solid ${t.ativo}`,
          color: t.ativo, fontWeight: 700, fontSize: 12, textDecoration: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}
      >
        ▶ Assistir aula
      </a>
    )
  }

  return (
    <a
      href={link} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{ ...style, position: 'relative', display: 'block', overflow: 'hidden' }}
    >
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt="" referrerPolicy="no-referrer"
        onError={() => setFalhou(true)}
        // Vídeo privado/removido: HTTP 200 com o placeholder 120×90 do
        // YouTube, não erro de rede — só o onLoad + naturalWidth pega isso.
        onLoad={e => {
          const img = e.currentTarget
          if (img.naturalWidth === LARGURA_PLACEHOLDER_YOUTUBE && img.naturalHeight === ALTURA_PLACEHOLDER_YOUTUBE) {
            setFalhou(true)
          }
        }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* ▶ sobreposto: lado a lado e do mesmo tamanho da foto da aula, sem
          isto as duas imagens ficam indistinguíveis — só descobriria qual é
          o vídeo tocando, o toque desperdiçado que este app evita. */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          // cor-ok: ▶ sobre a miniatura do vídeo; independe do tema
          width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 0, height: 0, marginLeft: 3,
            borderTop: '7px solid transparent', borderBottom: '7px solid transparent',
            // cor-ok: triângulo do ▶ sobre a miniatura
            borderLeft: '11px solid #fff',
          }} />
        </div>
      </div>
    </a>
  )
}
