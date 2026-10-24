'use client'

import { Pencil } from 'lucide-react'
import { extrairIdYoutube } from '@/lib/youtube'
import { dataCurta } from '@/lib/datas'
import { theme as t } from '@/lib/cores'
import { FotoAula } from '@/components/aulas/FotoAula'
import { MiniaturaYoutube } from '@/components/aulas/MiniaturaYoutube'

// Estilo comum de foto e miniatura: a altura e a borda vêm de .au-imgs (CSS).
const ESTILO_IMG = { objectFit: 'cover', display: 'block' } as const

// Foto à esquerda, miniatura do vídeo à direita; cada uma ocupa a linha inteira
// quando é a única, e sem nenhuma das duas nada ocupa o espaço. Usada no card e
// dentro da etiqueta "Aula do dia".
export function ImagensAula({ aula, onUrlRenovada }: {
  aula: any
  onUrlRenovada: (url: string) => void
}) {
  if (!aula.foto_path && !aula.link_youtube) return null
  // `idYoutube` pode ser null (studio.youtube.com, ou formato fora dos
  // cobertos): MiniaturaYoutube trata como o botão de texto, sem deixar buraco.
  const idYoutube = aula.link_youtube ? extrairIdYoutube(aula.link_youtube) : null
  return (
    <div className="au-imgs">
      {aula.foto_path && (
        <FotoAula
          path={aula.foto_path} url={aula.foto_url} t={t}
          // guarda a URL renovada na lista: sem isto o próximo render voltaria
          // à URL vencida e erraria de novo
          onUrlRenovada={onUrlRenovada}
          style={ESTILO_IMG}
        />
      )}
      {aula.link_youtube && (
        <MiniaturaYoutube id={idYoutube} link={aula.link_youtube} t={t} style={{}} />
      )}
    </div>
  )
}

// Card de uma aula (dada ou futura). O toque no card abre a chamada; o ✎ edita.
export function CartaoAula({ aula, futura, hoje, onAbrir, onEditar, onUrlRenovada }: {
  aula: any
  futura: boolean
  hoje: string
  onAbrir: () => void
  onEditar: () => void
  onUrlRenovada: (url: string) => void
}) {
  const presentes = (aula.presencas ?? []).filter((p: any) => p.presente).length
  return (
    <article className="au-card" onClick={onAbrir}>
      <div className="au-card-topo">
        <div className="au-card-tec">{aula.tecnica || 'Aula'}</div>
        <span className="au-card-data">{dataCurta(aula.data, hoje)}</span>
        <button
          type="button" className="au-card-edit" aria-label="Editar aula" title="Editar aula"
          // stopPropagation: o toque no card em si segue reservado para abrir a chamada
          onClick={e => { e.stopPropagation(); onEditar() }}
        >
          <Pencil aria-hidden="true" />
        </button>
      </div>
      {aula.posicao && <div className="au-card-pos">{aula.posicao}</div>}
      <div className="au-card-meta">
        <span className="al-etq contorno">{futura ? 'Ainda não aconteceu' : `${presentes} presentes`}</span>
      </div>
      <ImagensAula aula={aula} onUrlRenovada={onUrlRenovada} />
      {aula.notas && <div className="au-card-notas">{aula.notas}</div>}
    </article>
  )
}
