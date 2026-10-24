'use client'

import { useState, useEffect, useRef } from 'react'
import { assinarUrl } from '@/lib/foto-aula'
import type { Theme } from '@/lib/cores'

// ─── Foto da aula (com reassinatura) ─────────────────────────────────────────
// A URL assinada vence em 1h (VALIDADE_URL_SEGUNDOS). A imagem já pintada
// continua na tela depois disso — o que expira é o direito de baixar de novo —,
// mas se o app ficar aberto e o browser descartar a imagem do cache, o próximo
// pedido leva 403 e a foto some sem explicação. Aqui o `onError` assina de novo
// e repõe.
//
// O anti-loop é o par onError/onLoad: uma tentativa por exibição bem-sucedida.
// Objeto que sumiu de vez do bucket erra, tenta uma vez, erra de novo e para —
// nunca dispara onLoad, então nunca rearma. Rearmar no onLoad, e não quando a
// prop muda, é o que evita o ciclo em que a URL renovada realimenta a tentativa.
export function FotoAula({ path, url, onUrlRenovada, style, t }: {
  path: string | null
  url: string | null
  onUrlRenovada?: (url: string) => void
  style: React.CSSProperties
  t: Theme
}) {
  const [src, setSrc] = useState(url)
  const [falhou, setFalhou] = useState(false)
  const jaTentou = useRef(false)

  useEffect(() => { setSrc(url); setFalhou(false) }, [url])

  const renovar = async () => {
    if (jaTentou.current || !path) { setFalhou(true); return }
    jaTentou.current = true
    const nova = await assinarUrl(path)
    if (!nova) { setFalhou(true); return }
    setSrc(nova)
    onUrlRenovada?.(nova)
  }

  // Caixa no lugar da imagem em vez de ícone quebrado: some a dúvida entre
  // "esta aula não tem foto" e "a foto não carregou agora".
  if (falhou || !src) {
    return (
      <div style={{
        ...style,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: t.surface2, color: t.textMute, fontSize: 11, textAlign: 'center',
        padding: 8, boxSizing: 'border-box',
      }}>
        Não foi possível carregar a foto agora.
      </div>
    )
  }

  return (
    <img
      src={src} alt="" referrerPolicy="no-referrer" style={style}
      onError={renovar}
      onLoad={() => { jaTentou.current = false }}
    />
  )
}
