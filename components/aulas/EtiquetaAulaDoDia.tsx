'use client'

import { Play, Pencil } from 'lucide-react'
import { ImagensAula } from '@/components/aulas/CartaoAula'

// A etiqueta "Aula do dia": aparece sempre. Sem aula hoje convida a lançar uma;
// com aula, o toque abre a chamada e os botões ficam à mão.
export function EtiquetaAulaDoDia({ aula, onAbrirChamada, onEditar, onNovaAula, onUrlRenovada }: {
  aula: any | null
  onAbrirChamada: (aula: any) => void
  onEditar: (aula: any) => void
  onNovaAula: () => void
  onUrlRenovada: (id: string, url: string) => void
}) {
  if (!aula) {
    return (
      <section className="au-etq" aria-label="Aula do dia">
        <div className="au-etq-pos"><span>Aula do dia</span></div>
        <h2 className="au-etq-titulo">Hoje</h2>
        <p className="au-etq-vazio">Nenhuma aula lançada hoje</p>
        <button type="button" className="au-btn-etq cheio" onClick={onNovaAula}>Lançar a aula de hoje</button>
      </section>
    )
  }

  const presentes = (aula.presencas ?? []).filter((p: any) => p.presente).length
  return (
    <article className="au-etq toque" aria-label="Aula do dia" onClick={() => onAbrirChamada(aula)}>
      <div className="au-etq-pos">
        <span>Aula do dia</span>
        {aula.posicao && <span>{aula.posicao}</span>}
      </div>
      {/* o botão do título não trata o clique: ele sobe até a etiqueta, que abre
          a chamada — assim o teclado também chega lá */}
      <h2 className="au-etq-titulo"><button type="button">{aula.tecnica || 'Aula'}</button></h2>
      <div className="au-etq-meta">{presentes} presentes</div>
      <div className="au-etq-acoes">
        {aula.link_youtube && (
          <a
            className="au-btn-etq" href={aula.link_youtube} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            <Play aria-hidden="true" /> Vídeo
          </a>
        )}
        <button
          type="button" className="au-btn-etq"
          onClick={e => { e.stopPropagation(); onEditar(aula) }}
        >
          <Pencil aria-hidden="true" /> Editar
        </button>
      </div>
      <ImagensAula aula={aula} onUrlRenovada={url => onUrlRenovada(aula.id, url)} />
    </article>
  )
}
