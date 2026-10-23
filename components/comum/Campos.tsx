import type { Theme } from '@/lib/cores'

// Campos de formulário do app. A pele vem de app/comum.css (classes `cp-`):
// 48 px de altura, 16 px de letra (o iOS não dá zoom ao focar), borda de 1,5 px.
// `t` ainda é aceito para não mexer em todo chamador, mas já não é usado: a cor
// vem dos tokens.

export function Field({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; t?: Theme
}) {
  return (
    <label className="cp-campo">
      <span className="cp-rotulo">{label}</span>
      <input
        className="cp-input" type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  )
}

// Interruptor de verdade (botão com role="switch"): alcançável por teclado e
// desligado de uma vez pelo <fieldset disabled> da ficha.
export function Toggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; t?: Theme
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="cp-toggle" onClick={() => onChange(!checked)}>
      <span>{label}</span>
      <span className="cp-chave" aria-hidden="true"><span /></span>
    </button>
  )
}
