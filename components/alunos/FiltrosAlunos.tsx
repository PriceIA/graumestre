'use client'

import { useState, useEffect } from 'react'
import type { Faixa } from '@/lib/types'
import { NOMES_FAIXA } from '@/lib/regras-ibjjf'
import { BELT_COLORS } from '@/lib/cores-faixa'
import { aplicarFiltros, temFiltroAtivo, FILTROS_VAZIOS, ORDEM_FAIXAS, type Filtros } from '@/lib/alunos'
import { scrim, type Theme } from '@/lib/cores'

function Chip({ label, ativo, onClick, cores, t }: {
  label: string; ativo: boolean; onClick: () => void
  cores?: { bg: string; text: string }; t: Theme
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 10px', borderRadius: 999, fontSize: 11, cursor: 'pointer',
        fontFamily: t.ui, textTransform: 'uppercase', letterSpacing: 0.5,
        whiteSpace: 'nowrap',
        background: ativo ? (cores?.bg ?? t.ativoBg) : t.surface2,
        color:      ativo ? (cores?.text ?? t.ativo) : t.textSub,
        border: `1px solid ${ativo ? (cores?.bg ?? t.ativo) : t.border}`,
        fontWeight: ativo ? 700 : 400,
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// Chip ativo com ✕ embutido no rótulo — tocar em qualquer parte remove esse
// filtro. Não é um botão dentro de outro (inválido em HTML): é um único
// <button>, o "✕" é só texto no fim do label.
function ChipRemovivel({ label, onClick, cores, t }: {
  label: string; onClick: () => void; cores?: { bg: string; text: string }; t: Theme
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 8px 6px 10px', borderRadius: 999, fontSize: 11, cursor: 'pointer',
        fontFamily: t.ui, textTransform: 'uppercase', letterSpacing: 0.5,
        whiteSpace: 'nowrap', fontWeight: 700,
        background: cores?.bg ?? t.ativoBg, color: cores?.text ?? t.ativo,
        border: `1px solid ${cores?.bg ?? t.ativo}`,
      }}
    >
      {label}
      <span style={{ opacity: 0.7, fontWeight: 400 }}>✕</span>
    </button>
  )
}

// setFiltros recebe atualização funcional de propósito: dois toques dentro do
// mesmo frame leem o mesmo `filtros` do closure e o segundo apagaria o
// primeiro. Com prev => ... cada toque parte do estado já atualizado. Vale
// tanto aqui quanto dentro do PainelFiltros — nenhum dos dois usa rascunho
// local, os dois mexem direto no estado real (decisão do usuário: o
// contador ao vivo do painel já passa a mensagem de "isso já está valendo",
// então descartar ao fechar seria a interação contradizendo a própria tela).
export function BarraFiltros({ alunos, filtros, setFiltros, totalVisivel, onAbrirPainel, t }: {
  alunos: any[]; filtros: Filtros; setFiltros: React.Dispatch<React.SetStateAction<Filtros>>
  totalVisivel: number; onAbrirPainel: () => void; t: Theme
}) {
  const qtdAtivos = (filtros.faixa ? 1 : 0) + (filtros.prontos ? 1 : 0) + (filtros.afastados ? 1 : 0) + (filtros.categoria ? 1 : 0)

  const removerFiltro = <K extends keyof Filtros>(chave: K) =>
    setFiltros(prev => ({ ...prev, [chave]: FILTROS_VAZIOS[chave] }))

  const chipsAtivos: { chave: keyof Filtros; label: string; cores?: { bg: string; text: string } }[] = []
  if (filtros.faixa) chipsAtivos.push({ chave: 'faixa', label: NOMES_FAIXA[filtros.faixa], cores: BELT_COLORS[filtros.faixa] })
  if (filtros.prontos) chipsAtivos.push({ chave: 'prontos', label: 'Prontos' })
  if (filtros.afastados) chipsAtivos.push({ chave: 'afastados', label: 'Afastados' })
  if (filtros.categoria) chipsAtivos.push({ chave: 'categoria', label: filtros.categoria === 'infantil' ? 'Infantil' : 'Adulto' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, alignItems: 'center' }}>
        <button
          onClick={onAbrirPainel}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            padding: '6px 12px', borderRadius: 999, fontSize: 11, cursor: 'pointer',
            fontFamily: t.ui, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700,
            background: t.surface2, color: t.text, border: `1px solid ${t.border2}`,
          }}
        >
          Filtrar
          {qtdAtivos > 0 && (
            <span style={{
              background: t.ativo, color: t.sobreAtivo, fontSize: 10, fontWeight: 800,
              borderRadius: 999, padding: '1px 6px', minWidth: 16, textAlign: 'center',
            }}>
              {qtdAtivos}
            </span>
          )}
        </button>

        {chipsAtivos.map(c => (
          <ChipRemovivel key={c.chave} label={c.label} onClick={() => removerFiltro(c.chave)} cores={c.cores} t={t} />
        ))}

        {temFiltroAtivo(filtros) && (
          <button
            onClick={() => setFiltros(FILTROS_VAZIOS)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none', color: t.textMute,
              fontSize: 11, fontFamily: t.ui, textDecoration: 'underline',
              cursor: 'pointer', padding: 4, whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            Ver todos ({alunos.length})
          </button>
        )}
      </div>

      {temFiltroAtivo(filtros) && (
        <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui }}>
          {totalVisivel} de {alunos.length} alunos
        </div>
      )}
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
      <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
        {titulo}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>
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
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>Filtrar</div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '18px 20px 8px' }}>
          {faixasPresentes.length > 0 && (
            <Grupo titulo="Faixa">
              {faixasPresentes.map(fx => (
                <Chip
                  key={fx} label={NOMES_FAIXA[fx]} ativo={filtros.faixa === fx}
                  onClick={() => alterna('faixa', fx)}
                  cores={filtros.faixa === fx ? BELT_COLORS[fx] : undefined}
                  t={t}
                />
              ))}
            </Grupo>
          )}

          <Grupo titulo="Situação">
            <Chip label="Prontos"   ativo={filtros.prontos}   onClick={() => setFiltros(prev => ({ ...prev, prontos: !prev.prontos }))} t={t} />
            <Chip label="Afastados" ativo={filtros.afastados} onClick={() => setFiltros(prev => ({ ...prev, afastados: !prev.afastados }))} t={t} />
          </Grupo>

          <Grupo titulo="Categoria">
            <Chip label="Infantil" ativo={filtros.categoria === 'infantil'} onClick={() => alterna('categoria', 'infantil')} t={t} />
            <Chip label="Adulto"   ativo={filtros.categoria === 'adulto'}   onClick={() => alterna('categoria', 'adulto')} t={t} />
          </Grupo>

          {ativo && (
            <button
              onClick={() => setFiltros(FILTROS_VAZIOS)}
              style={{
                background: 'none', border: 'none', color: t.textMute, fontSize: 12,
                fontFamily: t.ui, textDecoration: 'underline', cursor: 'pointer', padding: 0,
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${t.border}` }}>
          <button
            onClick={handleClose}
            style={{
              width: '100%', padding: 14, borderRadius: 'var(--r)', border: 'none',
              background: t.ativo, color: t.sobreAtivo, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            {textoBotao}
          </button>
        </div>
      </div>
    </div>
  )
}
