'use client'

import { useRef, useState } from 'react'
import { Play, Pencil, Camera } from 'lucide-react'
import { ImagensAula } from '@/components/aulas/CartaoAula'
import { ConfirmarFotoAula } from '@/components/aulas/ConfirmarFotoAula'

// A etiqueta "Aula do dia": aparece sempre. Sem aula hoje convida a lançar uma;
// com aula, o toque abre a chamada e os botões ficam à mão.
export function EtiquetaAulaDoDia({ aula, onAbrirChamada, onEditar, onNovaAula, onUrlRenovada, onFotoAlterada }: {
  aula: any | null
  onAbrirChamada: (aula: any) => void
  onEditar: (aula: any) => void
  onNovaAula: () => void
  onUrlRenovada: (id: string, url: string) => void
  onFotoAlterada: (id: string, fotoPath: string | null, fotoUrl: string | null) => void
}) {
  // Foto escolhida, esperando a confirmação. O input e a folha ficam FORA da
  // <article>: um click() programático no input, ou um toque dentro da folha,
  // subiria até a etiqueta e abriria a chamada.
  const inputFoto = useRef<HTMLInputElement>(null)
  const [arquivoFoto, setArquivoFoto] = useState<File | null>(null)

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
    <>
    <article className={`au-etq toque${aula.foto_path || aula.link_youtube ? ' com-imagens' : ''}`} aria-label="Aula do dia" onClick={() => onAbrirChamada(aula)}>
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
          onClick={e => { e.stopPropagation(); inputFoto.current?.click() }}
        >
          <Camera aria-hidden="true" /> Foto
        </button>
        <button
          type="button" className="au-btn-etq"
          onClick={e => { e.stopPropagation(); onEditar(aula) }}
        >
          <Pencil aria-hidden="true" /> Editar
        </button>
      </div>
      <ImagensAula aula={aula} onUrlRenovada={url => onUrlRenovada(aula.id, url)} />
    </article>

    {/* sem `capture`: com ele o Android abre direto a câmera e a galeria some */}
    <input
      ref={inputFoto} type="file" accept="image/*" style={{ display: 'none' }}
      onChange={e => {
        const arquivo = e.target.files?.[0]
        // zera: escolher o MESMO arquivo de novo depois de um erro tem que disparar change
        e.target.value = ''
        if (arquivo) setArquivoFoto(arquivo)
      }}
    />
    {arquivoFoto && (
      <ConfirmarFotoAula
        key={arquivoFoto.name + arquivoFoto.lastModified}
        aula={aula} arquivo={arquivoFoto}
        onClose={() => setArquivoFoto(null)}
        onGravada={(foto_path, foto_url) => onFotoAlterada(aula.id, foto_path, foto_url)}
      />
    )}
    </>
  )
}
