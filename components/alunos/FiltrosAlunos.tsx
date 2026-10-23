'use client'

import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import type { Faixa } from '@/lib/types'
import { NOMES_FAIXA } from '@/lib/regras-ibjjf'
import { BELT_COLORS } from '@/lib/cores-faixa'
import { aplicarFiltros, temFiltroAtivo, FILTROS_VAZIOS, ORDEM_FAIXAS, type Filtros } from '@/lib/alunos'
import { scrim, type Theme } from '@/lib/cores'

type Cores = { bg: string; text: string }

// Cor de faixa da IBJJF não é cor de tema: só entra no chip de faixa ativo.
const estiloFaixa = (cores?: Cores): React.CSSProperties | undefined =>
  cores ? { background: cores.bg, borderColor: cores.bg, color: cores.text } : undefined

function Chip({ label, ativo, onClick, cores, alerta }: {
  label: string; ativo: boolean; onClick: () => void; cores?: Cores; alerta?: boolean
}) {
  return (
    <button
      type="button" className={`al-chip${alerta ? ' alerta' : ''}`} aria-pressed={ativo} onClick={onClick}
      style={ativo ? estiloFaixa(cores) : undefined}
    >
      {label}
    </button>
  )
}

// Chip ativo com ✕ embutido no rótulo — tocar em qualquer parte remove esse
// filtro. Não é um botão dentro de outro (inválido em HTML): é um único
// <button>, o "✕" é só texto no fim do label.
function ChipRemovivel({ label, onClick, cores, alerta }: {
  label: string; onClick: () => void; cores?: Cores; alerta?: boolean
}) {
  return (
    <button
      type="button" className={`al-chip removivel${alerta ? ' alerta' : ''}`} onClick={onClick}
      aria-label={`Tirar o filtro ${label}`} style={estiloFaixa(cores)}
    >
      {label}
      <span className="x" aria-hidden="true">✕</span>
    </button>
  )
}

// Rótulo só para leitor de tela: o placeholder some ao digitar.
const SO_LEITOR: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
}

// setFiltros recebe atualização funcional de propósito: dois toques dentro do
// mesmo frame leem o mesmo `filtros` do closure e o segundo apagaria o
// primeiro. Com prev => ... cada toque parte do estado já atualizado. Vale
// tanto aqui quanto dentro do PainelFiltros — nenhum dos dois usa rascunho
// local, os dois mexem direto no estado real (decisão do usuário: o
// contador ao vivo do painel já passa a mensagem de "isso já está valendo",
// então descartar ao fechar seria a interação contradizendo a própria tela).
export function BarraFiltros({ alunos, filtros, setFiltros, busca, setBusca, totalVisivel, onAbrirPainel }: {
  alunos: any[]; filtros: Filtros; setFiltros: React.Dispatch<React.SetStateAction<Filtros>>
  busca: string; setBusca: (v: string) => void
  totalVisivel: number; onAbrirPainel: () => void
}) {
  const qtdAtivos = (filtros.faixa ? 1 : 0) + (filtros.prontos ? 1 : 0) + (filtros.afastados ? 1 : 0) + (filtros.categoria ? 1 : 0)

  const removerFiltro = <K extends keyof Filtros>(chave: K) =>
    setFiltros(prev => ({ ...prev, [chave]: FILTROS_VAZIOS[chave] }))

  const chipsAtivos: { chave: keyof Filtros; label: string; cores?: Cores; alerta?: boolean }[] = []
  if (filtros.faixa) chipsAtivos.push({ chave: 'faixa', label: NOMES_FAIXA[filtros.faixa], cores: BELT_COLORS[filtros.faixa] })
  if (filtros.prontos) chipsAtivos.push({ chave: 'prontos', label: 'Prontos', alerta: true })
  if (filtros.afastados) chipsAtivos.push({ chave: 'afastados', label: 'Afastados', alerta: true })
  if (filtros.categoria) chipsAtivos.push({ chave: 'categoria', label: filtros.categoria === 'infantil' ? 'Infantil' : 'Adulto' })

  const filtrando = temFiltroAtivo(filtros) || busca.trim() !== ''

  return (
    <div className="al-ferramentas">
      <div className="al-linha-busca">
        <label className="al-busca">
          <Search aria-hidden="true" />
          <span style={SO_LEITOR}>Buscar aluno pelo nome</span>
          <input
            type="search" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar aluno pelo nome" autoComplete="off" enterKeyHint="search"
          />
        </label>
        <button type="button" className="al-btn" onClick={onAbrirPainel}>
          <Filter aria-hidden="true" />
          Filtrar
          {qtdAtivos > 0 && <span className="al-badge" aria-label={`${qtdAtivos} filtros ativos`}>{qtdAtivos}</span>}
        </button>
      </div>

      {chipsAtivos.length > 0 && (
        <div className="al-chips">
          {chipsAtivos.map(c => (
            <ChipRemovivel key={c.chave} label={c.label} onClick={() => removerFiltro(c.chave)} cores={c.cores} alerta={c.alerta} />
          ))}
          <button type="button" className="al-limpar" onClick={() => setFiltros(FILTROS_VAZIOS)}>
            Tirar filtros
          </button>
        </div>
      )}

      {filtrando && <div className="al-contagem">{totalVisivel} de {alunos.length} alunos</div>}
    </div>
  )
}

// ─── PainelFiltros — sétimo modal, mesmo padrão de sempre ─────────────────────
// Faixa/Situação/Categoria nomeados, sem rascunho: cada toque chama setFiltros
// direto (ver comentário acima de BarraFiltros), e o número do rodapé é sempre
// o resultado já aplicado — nunca uma prévia de algo que ainda não vale.
export function PainelFiltros({ alunos, filtros, setFiltros, presencasPorGrau, onClose, t }: {
  alunos: any[]; filtros: Filtros; setFiltros: React.Dispatch<React.SetStateAction<Filtros>>
  presencasPorGrau: number; onClose: () => void; t: Theme
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  const faixasPresentes = Array.from(new Set(alunos.map(a => a.faixa as Faixa)))
    .sort((a, b) => ORDEM_FAIXAS.indexOf(a) - ORDEM_FAIXAS.indexOf(b))

  const alterna = <K extends keyof Filtros>(chave: K, valor: Filtros[K]) =>
    setFiltros(prev => ({ ...prev, [chave]: prev[chave] === valor ? FILTROS_VAZIOS[chave] : valor }))

  const qtdVisivel = aplicarFiltros(alunos, filtros, presencasPorGrau).length
  const ativo = temFiltroAtivo(filtros)
  // Sem filtro: mostra o total, redação neutra ("ver todos os N") para não
  // parecer ação pendente — é só o jeito de fechar o painel.
  const textoBotao = ativo
    ? `Ver ${qtdVisivel} ${qtdVisivel === 1 ? 'aluno' : 'alunos'}`
    : `Ver todos os ${alunos.length} alunos`

  const Grupo = ({ titulo, children }: { titulo: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ color: t.textSub, fontSize: 12, fontWeight: 800, fontFamily: t.ui, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        {titulo}
      </div>
      <div className="al-chips">{children}</div>
    </div>
  )

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: scrim(visible),
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        transition: 'background 0.22s',
        touchAction: 'manipulation', overscrollBehavior: 'contain',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.bg, width: '100%', maxWidth: 480,
          borderRadius: 'var(--r) var(--r) 0 0', border: `1px solid ${t.border}`,
          maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s ease, opacity 0.22s ease',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>Filtrar</div>
          <button
            type="button" onClick={handleClose} aria-label="Fechar"
            style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer', width: 44, height: 44, marginRight: -10 }}
          >✕</button>
        </div>

        <div style={{ overflowY: 'auto', overscrollBehavior: 'contain', flex: 1, minHeight: 0, padding: '18px 20px 8px' }}>
          {faixasPresentes.length > 0 && (
            <Grupo titulo="Faixa">
              {faixasPresentes.map(fx => (
                <Chip
                  key={fx} label={NOMES_FAIXA[fx]} ativo={filtros.faixa === fx}
                  onClick={() => alterna('faixa', fx)} cores={BELT_COLORS[fx]}
                />
              ))}
            </Grupo>
          )}

          <Grupo titulo="Situação">
            <Chip alerta label="Prontos"   ativo={filtros.prontos}   onClick={() => setFiltros(prev => ({ ...prev, prontos: !prev.prontos }))} />
            <Chip alerta label="Afastados" ativo={filtros.afastados} onClick={() => setFiltros(prev => ({ ...prev, afastados: !prev.afastados }))} />
          </Grupo>

          <Grupo titulo="Categoria">
            <Chip label="Infantil" ativo={filtros.categoria === 'infantil'} onClick={() => alterna('categoria', 'infantil')} />
            <Chip label="Adulto"   ativo={filtros.categoria === 'adulto'}   onClick={() => alterna('categoria', 'adulto')} />
          </Grupo>

          {ativo && (
            <button type="button" className="al-limpar" onClick={() => setFiltros(FILTROS_VAZIOS)} style={{ marginBottom: 8 }}>
              Limpar filtros
            </button>
          )}
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${t.border}` }}>
          <button
            type="button" className="al-btn cheio" onClick={handleClose}
            style={{ width: '100%' }}
          >
            {textoBotao}
          </button>
        </div>
      </div>
    </div>
  )
}
