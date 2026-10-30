import type { Faixa } from '@/lib/types'
import { grausMaximos, nomeFaixaExibicao } from '@/lib/regras-ibjjf'
import { BELT_COLORS } from '@/lib/cores-faixa'
import { FaixaDesenhada } from '@/components/FaixaDesenhada'
import type { Theme } from '@/lib/cores'

// ─── BeltBadge — etiqueta de texto + faixa desenhada (Etapa 4) ────────────────
// Os losangos (`Diamonds`) saíram: quem desenha os graus agora é
// `FaixaDesenhada` (components/FaixaDesenhada.tsx), com `max` sempre
// calculado aqui — regra de faixa mora em regras-ibjjf.ts, o componente de
// desenho não deduz nada sozinho.
export function BeltBadge({ faixa, graus, infantil, size = 'md', t }: { faixa: Faixa; graus: number; infantil: boolean; size?: 'sm' | 'md'; t: Theme }) {
  const belt = BELT_COLORS[faixa] ?? BELT_COLORS.branca
  const label = nomeFaixaExibicao(faixa, graus)
  const px = size === 'sm' ? '4px 8px' : '5px 11px'
  const fs = size === 'sm' ? 10 : 12
  const max = grausMaximos(faixa, infantil)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{
        background: belt.bg, color: belt.text, padding: px, borderRadius: 'var(--r)',
        fontWeight: 700, fontSize: fs, letterSpacing: 1, textTransform: 'uppercase',
        border: faixa === 'branca' ? `1px solid ${t.border}` : 'none', fontFamily: t.ui,
        flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ flex: '1 1 auto', minWidth: size === 'sm' ? 70 : 100, maxWidth: size === 'sm' ? 140 : 200 }}>
        <FaixaDesenhada faixa={faixa} graus={graus} max={max} size={size} />
      </div>
    </div>
  )
}
