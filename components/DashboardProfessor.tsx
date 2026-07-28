'use client'

import { useEffect, useState } from 'react'
import { Bell, ChevronRight, Menu } from 'lucide-react'
import type { Faixa } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { alertaGraduacao } from '@/lib/alertas-graduacao'

const FAIXAS_CHART: { key: Faixa; label: string }[] = [
  { key: 'branca', label: 'BR' },
  { key: 'azul',   label: 'AZ' },
  { key: 'roxa',   label: 'RX' },
  { key: 'marrom', label: 'MR' },
  { key: 'preta',  label: 'PT' },
]

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return (partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')
}

// ─── Anel de progresso (donut) ─────────────────────────────────────────────
function DonutProgress({ value }: { value: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const size = 120
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = c * (1 - (mounted ? value : 0) / 100)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(223,37,49,0.2)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#df2531" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={dash}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[32px] leading-none text-white">{value}%</span>
      </div>
    </div>
  )
}

// ─── Distribuição por faixa ─────────────────────────────────────────────────
function DistribuicaoFaixas({ alunos }: { alunos: any[] }) {
  const [mounted, setMounted] = useState(false)
  const [selecionada, setSelecionada] = useState<Faixa | null>(null)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const counts = FAIXAS_CHART.map(f => ({
    ...f,
    count: alunos.filter(a => a.faixa === f.key).length,
  }))
  const maxCount = Math.max(1, ...counts.map(c => c.count))
  const maxIdx = counts.reduce((best, c, i) => (c.count > counts[best].count ? i : best), 0)

  const nomesFaixa = selecionada
    ? alunos.filter(a => a.faixa === selecionada).map(a => a.nome)
    : []

  return (
    <div className="px-4 pb-4">
      <div className="mb-3 font-body text-[11px] font-semibold uppercase tracking-wide text-white/60">
        Distribuição por faixa
      </div>
      <div className="flex h-24 gap-3">
        {counts.map((c, i) => (
          <button
            key={c.key}
            onClick={() => setSelecionada(prev => (prev === c.key ? null : c.key))}
            className="flex h-full flex-1 items-end justify-center"
          >
            <div
              className={cn(
                'w-6 rounded-t transition-[height] duration-500 ease-out',
                i === maxIdx ? 'bg-accent/65' : 'bg-accent/45',
                selecionada === c.key && 'ring-1 ring-accent'
              )}
              style={{
                height: mounted ? `${Math.max((c.count / maxCount) * 100, c.count > 0 ? 8 : 2)}%` : '0%',
                transitionDelay: `${i * 60}ms`,
              }}
            />
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {counts.map(c => (
          <div key={c.key} className="flex-1 text-center font-body text-[11px] uppercase tracking-wide text-white/60">
            {c.label} · {c.count}
          </div>
        ))}
      </div>
      {selecionada && (
        <div className="mt-3 rounded-xl border border-accent/65 bg-surface p-3">
          {nomesFaixa.length === 0 ? (
            <div className="text-sm text-white/60">Nenhum aluno nessa faixa.</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {nomesFaixa.map(nome => (
                <div key={nome} className="text-sm text-white">{nome}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Painel do Professor ────────────────────────────────────────────────────
function PainelProfessor({ perto, atencao, onSelect }: {
  perto: { aluno: any; pct: number } | null
  atencao: { aluno: any; pct: number } | null
  onSelect: (aluno: any) => void
}) {
  if (!perto && !atencao) return null

  return (
    <div className="px-4 pb-4">
      <div className="mb-3 font-body text-[11px] font-semibold uppercase tracking-wide text-white/60">
        Painel do professor
      </div>
      <div className="grid grid-cols-2 gap-3">
        {perto && (
          <Card
            onClick={() => onSelect(perto.aluno)}
            className="cursor-pointer p-4 transition-colors hover:bg-surface-hover"
          >
            <div className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wide text-white/60">
              Perto da faixa
            </div>
            <div className="mb-1 truncate font-body text-sm font-bold text-white">{perto.aluno.nome}</div>
            <div className="font-body text-xs text-accent">{Math.round(perto.pct * 100)}% freq</div>
          </Card>
        )}
        {atencao && (
          <Card
            onClick={() => onSelect(atencao.aluno)}
            className="cursor-pointer p-4 transition-colors hover:bg-surface-hover"
          >
            <div className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wide text-white/60">
              Atenção
            </div>
            <div className="mb-1 truncate font-body text-sm font-bold text-white">{atencao.aluno.nome}</div>
            <div className="font-body text-xs text-accent">{Math.round(atencao.pct * 100)}% freq</div>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── Prontos para graduar ────────────────────────────────────────────────────
function ProntosParaGraduar({ itens, onSelect }: { itens: { aluno: any; msg: string }[]; onSelect: (aluno: any) => void }) {
  if (itens.length === 0) return null

  return (
    <div className="px-4 pb-4">
      <div className="mb-3 font-body text-[11px] font-semibold uppercase tracking-wide text-white/60">
        Prontos para graduar
      </div>
      <div className="flex flex-col gap-2">
        {itens.map(({ aluno, msg }, i) => (
          <div
            key={aluno.id}
            onClick={() => onSelect(aluno)}
            className="animate-fade-slide-up flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border-l-[3px] border-accent bg-surface py-3 pl-3 pr-4 transition-colors hover:bg-surface-hover"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Avatar>
              <AvatarImage src={aluno.foto_url ?? undefined} alt="" />
              <AvatarFallback>{iniciais(aluno.nome)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate font-body text-sm font-bold text-white">{aluno.nome}</div>
              <div className="truncate font-body text-xs text-white/60">{msg}</div>
            </div>
            <Badge variant="solid" className="shrink-0">✓ Pronto</Badge>
            <ChevronRight size={18} className="shrink-0 text-white/40" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard do Professor ──────────────────────────────────────────────────
export default function DashboardProfessor({ alunos, aulasEsseMes, onSelectAluno }: {
  alunos: any[]; aulasEsseMes: number; onSelectAluno: (aluno: any) => void
}) {
  const comFrequencia = alunos.filter(a => (a.total_aulas ?? 0) > 0)
  const freqMedia = comFrequencia.length
    ? Math.round(
        comFrequencia.reduce((acc, a) => acc + (a.total_presencas ?? 0) / (a.total_aulas ?? 1), 0) /
          comFrequencia.length * 100
      )
    : 0

  const comPct = comFrequencia.map(a => ({ aluno: a, pct: (a.total_presencas ?? 0) / (a.total_aulas ?? 1) }))
  const perto = comPct.length ? [...comPct].sort((a, b) => b.pct - a.pct)[0] : null
  const atencaoList = comPct.filter(x => x.pct < 0.5).sort((a, b) => a.pct - b.pct)
  const atencao = atencaoList[0] ?? null

  const prontos = alunos
    .map(aluno => ({ aluno, msg: alertaGraduacao(aluno, aluno.ultima_graduacao_data ?? null) }))
    .filter((x): x is { aluno: any; msg: string } => x.msg !== null)

  return (
    <div className="bg-[radial-gradient(ellipse_at_top,#2a0505_0%,#0a0a0a_55%)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Menu size={22} className="text-white/60" />
        <span className="font-display text-2xl uppercase tracking-wide text-white">GrauMestre</span>
        <Bell size={20} className="text-white/60" />
      </div>

      {/* Hero */}
      <div className="relative min-h-[300px] overflow-hidden">
        <img
          src="/images/lutador-faixa.jpg" alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(223,37,49,0.35)_0%,rgba(10,10,10,0.6)_50%,rgba(10,10,10,0.95)_85%)]" />
        <div className="relative flex flex-col items-center gap-4 px-4 pb-6 pt-8">
          <DonutProgress value={freqMedia} />
          <div className="font-body text-[11px] font-semibold uppercase tracking-wide text-white/60">
            Frequência geral
          </div>
          <div className="flex w-full max-w-[220px] flex-col gap-2">
            {[
              { label: 'Aulas/mês', value: aulasEsseMes },
              { label: 'Prontos p/ faixa', value: prontos.length },
              { label: 'Precisa atenção', value: atencaoList.length },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between font-body text-sm text-white">
                <span className="flex items-center gap-2 text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {s.label}
                </span>
                <span className="font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DistribuicaoFaixas alunos={alunos} />
      <PainelProfessor perto={perto} atencao={atencao} onSelect={onSelectAluno} />
      <ProntosParaGraduar itens={prontos} onSelect={onSelectAluno} />
    </div>
  )
}
