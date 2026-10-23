'use client'

import { useState } from 'react'
import type { Faixa } from '@/lib/types'
import { grausMaximos, nomeFaixaExibicao } from '@/lib/regras-ibjjf'
import { alertaGraduacao } from '@/lib/alertas-graduacao'
import { estaAfastado, motivoAfastamento } from '@/lib/afastamento'
import { BELT_COLORS } from '@/lib/cores-faixa'
import { ehInfantilAluno } from '@/lib/alunos'
import { FaixaDesenhada } from '@/components/FaixaDesenhada'
import { freqColor } from '@/components/comum/FreqBar'
import type { Theme } from '@/lib/cores'

// ─── AlunoCard — crachá circular com anel de frequência ───────────────────────
export function AlunoCard({ aluno, onClick, presencasPorGrau, t }: { aluno: any; onClick: () => void; presencasPorGrau: number; t: Theme }) {
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)

  const totalAulas = aluno.total_aulas ?? 0
  const presencas  = aluno.total_presencas ?? 0
  const pct        = totalAulas > 0 ? presencas / totalAulas : 0
  const dias       = Math.floor((Date.now() - new Date(aluno.inicio).getTime()) / 86400000)
  const anos       = Math.floor(dias / 365)
  const meses      = Math.floor((dias % 365) / 30)

  const R        = 38
  const C        = 2 * Math.PI * R   // ~238.76
  const dash     = C * (1 - pct)
  const ringColor = freqColor(pct, t)
  const belt     = BELT_COLORS[aluno.faixa as Faixa] ?? BELT_COLORS.branca
  const alerta   = alertaGraduacao(aluno, aluno.ultima_graduacao_data ?? null, presencasPorGrau)
  const afastado = estaAfastado(aluno)

  const nomeParts = aluno.nome.split(' ')

  return (
    <div
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setPressed(false); setHovered(false) }}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        position: 'relative',
        background: t.surface,
        border: `1px solid ${hovered ? t.ativo : t.border}`,
        borderRadius: 'var(--r)',
        padding: '18px 10px 14px',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        transform: pressed ? 'scale(0.93)' : 'scale(1)',
        transition: 'transform 0.1s ease, border-color 0.2s',
        userSelect: 'none',
      }}
    >
      {/* Afastado é estado informativo, não erro: cinza no canto oposto ao
          selo PRONTO, sem cor de alarme e sem competir com ele. */}
      {afastado && (
        <div title={motivoAfastamento(aluno) ?? 'Afastado'} style={{
          position: 'absolute', top: 8, left: 8,
          background: t.surface2, color: t.textMute, fontSize: 8, fontWeight: 700,
          padding: '2px 6px', borderRadius: 'var(--r)', fontFamily: t.ui, letterSpacing: 0.5,
          border: `1px solid ${t.border}`,
        }}>
          AFASTADO
        </div>
      )}

      {/* Sugestão de graduação — nunca bloqueio, só um aviso visual */}
      {alerta && (
        <div title={alerta.msg} style={{
          position: 'absolute', top: 8, right: 8,
          background: t.alerta, color: t.sobreAlerta, fontSize: 8, fontWeight: 800,
          padding: '2px 6px', borderRadius: 'var(--r)', fontFamily: t.ui, letterSpacing: 0.5,
        }}>
          PRONTO
        </div>
      )}

      {/* Anel de frequência + avatar circular */}
      <div style={{ position: 'relative', width: 88, height: 88, marginBottom: 2 }}>
        <svg width="88" height="88" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="44" cy="44" r={R} fill="none" stroke={t.border2} strokeWidth="3.5" />
          {pct > 0 && (
            <circle
              cx="44" cy="44" r={R}
              fill="none" stroke={ringColor} strokeWidth="3.5"
              strokeDasharray={C} strokeDashoffset={dash}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          )}
        </svg>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 70, height: 70, borderRadius: '50%',
          overflow: 'hidden', background: t.surface2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${t.border}`,
        }}>
          {/* referrerPolicy: a foto é URL externa colada à mão, e sem isto o host
              dela recebe o endereço do app a cada carregamento */}
          {aluno.foto_url
            ? <img src={aluno.foto_url} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 26, fontWeight: 900, color: t.textSub, fontFamily: t.ui }}>{aluno.nome[0]}</span>
          }
        </div>
      </div>

      {/* Nome */}
      <div style={{ textAlign: 'center', lineHeight: 1.25 }}>
        <div style={{ color: t.text, fontWeight: 700, fontSize: 13 }}>{nomeParts[0]}</div>
        {nomeParts.length > 1 && (
          <div style={{ color: t.textSub, fontWeight: 400, fontSize: 11 }}>
            {nomeParts.slice(1).join(' ')}
          </div>
        )}
      </div>

      {/* Faixa */}
      <div style={{
        background: belt.bg, color: belt.text,
        padding: '2px 8px', borderRadius: 'var(--r)',
        fontWeight: 700, fontSize: 9, letterSpacing: 1,
        textTransform: 'uppercase', fontFamily: t.ui,
        border: aluno.faixa === 'branca' ? `1px solid ${t.border}` : 'none',
        textAlign: 'center',
      }}>
        {nomeFaixaExibicao(aluno.faixa, aluno.graus)}
      </div>

      {/* Faixa desenhada com graus — `size="sm"` de propósito: sem trama nem
          costura, é o que mantém os 33 cards do grid leves de rolar no
          celular (ver CLAUDE.md, seção PERFORMANCE de FaixaDesenhada.tsx). */}
      <div style={{ width: '100%' }}>
        <FaixaDesenhada faixa={aluno.faixa} graus={aluno.graus} max={grausMaximos(aluno.faixa, ehInfantilAluno(aluno))} size="sm" />
      </div>

      {/* Tempo na arte */}
      <div style={{ color: t.textMute, fontSize: 9, fontFamily: t.ui, letterSpacing: 1 }}>
        {anos > 0 ? `${anos}A ` : ''}{meses}M
      </div>
    </div>
  )
}
