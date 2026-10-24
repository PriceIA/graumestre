'use client'

import { useState, useEffect, useRef } from 'react'
import { comprimirImagem, type ImagemComprimida } from '@/lib/comprimir-imagem'
import { enviarFotoComprimida } from '@/lib/foto-aula'
import { scrim } from '@/lib/cores'

// Confirmação da foto escolhida pelo botão Foto da etiqueta. Mostra a miniatura
// do que vai subir DE FATO (o blob já comprimido) e só grava quando o professor
// toca em "Usar esta foto" / "Trocar a foto atual". Cancelar fecha sem gravar
// nada — nem no banco, nem no bucket.
//
// A seção "Foto da aula" do modal de edição NÃO passa por aqui: lá a foto
// continua gravando assim que é escolhida (decisão do Pedro, spec §3.2).
type Fase = 'preparando' | 'pronta' | 'enviando' | 'erroLeitura' | 'erroEnvio'

export function ConfirmarFotoAula({ aula, arquivo, onClose, onGravada }: {
  aula: any
  arquivo: File
  onClose: () => void
  onGravada: (fotoPath: string, fotoUrl: string) => void
}) {
  const [arquivoAtual, setArquivoAtual] = useState(arquivo)
  const [fase, setFase] = useState<Fase>('preparando')
  const [comprimida, setComprimida] = useState<ImagemComprimida | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const inputOutra = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  // Comprime a cada arquivo escolhido. `cancelado` descarta o resultado de uma
  // compressão que já ficou para trás (o professor tocou em "Escolher outra"
  // no meio dela).
  useEffect(() => {
    let cancelado = false
    let url: string | null = null
    setFase('preparando')
    setComprimida(null)
    setPrevia(null)
    setMensagem(null)
    comprimirImagem(arquivoAtual).then(
      c => {
        if (cancelado) return
        url = URL.createObjectURL(c.blob)
        setComprimida(c)
        setPrevia(url)
        setFase('pronta')
      },
      err => {
        if (cancelado) return
        setMensagem(err instanceof Error ? err.message : String(err))
        setFase('erroLeitura')
      },
    )
    return () => {
      cancelado = true
      if (url) URL.revokeObjectURL(url)   // libera a prévia ao trocar de arquivo e ao fechar
    }
  }, [arquivoAtual])

  const ocupado = fase === 'enviando'

  const fechar = () => {
    if (ocupado) return   // cancelar no meio do envio deixaria o resultado incerto
    setVisible(false)
    setTimeout(onClose, 220)
  }

  const escolherOutra = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novo = e.target.files?.[0]
    // zera o input: escolher o MESMO arquivo de novo depois de um erro tem que disparar change
    e.target.value = ''
    if (novo) setArquivoAtual(novo)
  }

  const gravar = async () => {
    if (!comprimida || ocupado) return
    setFase('enviando')
    setMensagem(null)
    try {
      const r = await enviarFotoComprimida(aula.id, comprimida, aula.foto_path ?? null)
      onGravada(r.foto_path, r.foto_url)
      setVisible(false)
      setTimeout(onClose, 220)
    } catch (err) {
      setMensagem(err instanceof Error ? err.message : String(err))
      setFase('erroEnvio')
    }
  }

  const trocando = !!aula.foto_path

  return (
    <div className="au-scrim" onClick={fechar} style={{ background: scrim(visible) }}>
      <div
        className={`au-folha${visible ? ' aberta' : ''}`} role="dialog" aria-modal="true" aria-label="Confirmar a foto da aula"
        onClick={e => e.stopPropagation()}
      >
        <div className="au-folha-topo">
          <div className="au-folha-tit">Confirmar a foto</div>
          <button type="button" className="au-folha-fechar" aria-label="Fechar" onClick={fechar} disabled={ocupado}>✕</button>
        </div>

        <div className="au-folha-corpo">
          {fase === 'preparando' && <div className="au-folha-aviso">Preparando a foto…</div>}

          {previa && (
            <img
              className="au-folha-previa" src={previa} alt="Prévia da foto escolhida" referrerPolicy="no-referrer"
              style={{ opacity: ocupado ? 0.5 : 1 }}
            />
          )}

          {fase === 'enviando' && <div className="au-folha-aviso">Enviando…</div>}

          {mensagem && <div className="au-folha-erro">⚠ {mensagem}</div>}

          {(fase === 'pronta' || fase === 'enviando' || fase === 'erroEnvio') && (
            <button type="button" className="al-btn cheio au-folha-cheio" onClick={gravar} disabled={ocupado}>
              {trocando ? 'Trocar a foto atual' : 'Usar esta foto'}
            </button>
          )}
          <div className="au-folha-linha">
            <button type="button" className="al-btn" onClick={() => inputOutra.current?.click()} disabled={ocupado || fase === 'preparando'}>
              Escolher outra
            </button>
            <button type="button" className="al-btn" onClick={fechar} disabled={ocupado}>Cancelar</button>
          </div>
          {/* sem `capture`: a galeria não pode sumir (mesma razão do modal de edição) */}
          <input ref={inputOutra} type="file" accept="image/*" onChange={escolherOutra} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  )
}
