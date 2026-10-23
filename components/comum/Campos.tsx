import type { Theme } from '@/lib/cores'

// ─── Field ───────────────────────────────────────────────────────────────────
export function Field({ label, value, onChange, type = 'text', placeholder, t }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; t: Theme
}) {
  return (
    <div>
      <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>{label}</div>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 'var(--r)', padding: '10px 12px', color: t.text, fontSize: 14, boxSizing: 'border-box' }}
      />
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
export function Toggle({ label, checked, onChange, t }: { label: string; checked: boolean; onChange: (v: boolean) => void; t: Theme }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        padding: '10px 12px', borderRadius: 'var(--r)', cursor: 'pointer',
        background: checked ? t.ativoBg : t.surface, border: `1px solid ${checked ? t.ativo : t.border}`,
      }}
    >
      <span style={{ color: t.text, fontSize: 13 }}>{label}</span>
      <div style={{
        width: 40, height: 22, borderRadius: 20, flexShrink: 0,
        background: checked ? t.ativo : t.surface2, border: `1px solid ${t.border}`,
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2,
          width: 16, height: 16, borderRadius: '50%', background: checked ? t.sobreAtivo : t.textMute,
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  )
}
