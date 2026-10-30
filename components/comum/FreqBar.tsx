import type { Theme } from '@/lib/cores'

// frequência alta = branco/escuro, média = cinza, baixa = vermelho
export function freqColor(ratio: number, t: Theme) {
  if (ratio >= 0.75) return t.text
  if (ratio >= 0.5)  return t.textSub
  return t.alerta
}

// ─── FreqBar ─────────────────────────────────────────────────────────────────
export function FreqBar({ presencas, totalAulas, t }: { presencas: number; totalAulas: number; t: Theme }) {
  const pct = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0
  const color = freqColor(pct / 100, t)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', letterSpacing: 1 }}>Frequência</span>
        <span style={{ color, fontSize: 11, fontWeight: 700, fontFamily: t.ui }}>{pct}%</span>
      </div>
      <div style={{ background: t.surface2, borderRadius: 2, height: 4 }}>
        <div style={{ width: `${pct}%`, height: 4, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}
