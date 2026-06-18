'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Aluno, Aula } from '@/lib/types'

// ─── Tema ────────────────────────────────────────────────────────────────────
type Theme = ReturnType<typeof makeTheme>
function makeTheme(dark: boolean) {
  return dark ? {
    bg: '#0D0D0D', surface: '#141414', surface2: '#1a1a1a',
    border: '#222', border2: '#2a2a2a',
    text: '#FFFFFF', textSub: '#888', textMute: '#555',
    accent: '#C9A84C', inputBg: '#141414', cardHover: '#C9A84C',
  } : {
    bg: '#F5F5F0', surface: '#FFFFFF', surface2: '#F0EFE9',
    border: '#E0DDD5', border2: '#D5D2CA',
    text: '#111111', textSub: '#555', textMute: '#999',
    accent: '#8B6914', inputBg: '#FAFAF7', cardHover: '#8B6914',
  }
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const BELT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  branca: { bg: '#FFFFFF', text: '#0D0D0D', label: 'Branca' },
  cinza:  { bg: '#9E9E9E', text: '#fff',    label: 'Cinza'  },
  azul:   { bg: '#1565C0', text: '#fff',    label: 'Azul'   },
  roxa:   { bg: '#6A1B9A', text: '#fff',    label: 'Roxa'   },
  marrom: { bg: '#4E342E', text: '#fff',    label: 'Marrom' },
  preta:  { bg: '#0D0D0D', text: '#C9A84C', label: 'Preta'  },
}

const POSITIONS = [
  'Guarda Fechada','Meia Guarda','Passagem de Guarda','Montada',
  'Costas','Raspagem','Finalização','Defesa','Leg Locks','Berimbolo',
]

// ─── Sub-componentes ─────────────────────────────────────────────────────────
function BeltBadge({ faixa, graus, size = 'md', t }: { faixa: string; graus: number; size?: string; t: Theme }) {
  const belt = BELT_COLORS[faixa] ?? BELT_COLORS.branca
  const px = size === 'sm' ? '5px 9px' : '6px 13px'
  const fs = size === 'sm' ? 11 : 13
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ background: belt.bg, color: belt.text, padding: px, borderRadius: 4, fontWeight: 700, fontSize: fs, letterSpacing: 1, textTransform: 'uppercase', border: faixa === 'branca' ? '1px solid #ccc' : 'none', fontFamily: 'monospace' }}>{belt.label}</span>
      <span style={{ color: t.accent, fontSize: fs, fontFamily: 'monospace' }}>{'◆'.repeat(graus)}{'◇'.repeat(4 - graus)}</span>
    </div>
  )
}

function FreqBar({ presencas, totalAulas, t }: { presencas: number; totalAulas: number; t: Theme }) {
  const pct = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0
  const color = pct >= 75 ? '#4CAF50' : pct >= 50 ? '#FF9800' : '#F44336'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace' }}>FREQUÊNCIA</span>
        <span style={{ color, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{pct}%</span>
      </div>
      <div style={{ background: t.surface2, borderRadius: 2, height: 4 }}>
        <div style={{ width: `${pct}%`, height: 4, background: color, borderRadius: 2, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, t }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; t: Theme }) {
  return (
    <div>
      <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 6, padding: '10px 12px', color: t.text, fontSize: 14, boxSizing: 'border-box' }} />
    </div>
  )
}

// ─── Modal Aluno ─────────────────────────────────────────────────────────────
function ModalAluno({ aluno, onClose, onSave, t }: { aluno: Aluno & { total_presencas?: number; total_aulas?: number }; onClose: () => void; onSave: (a: Aluno) => void; t: Theme }) {
  const [form, setForm] = useState({ ...aluno })
  const [tab, setTab] = useState('perfil')
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const tabs = ['perfil', 'frequência', 'notas', 'graduação']

  const handleSave = async () => {
    setSaving(true)
    const { id, created_at, total_presencas, total_aulas, ...data } = form as typeof form & { created_at?: string; total_presencas?: number; total_aulas?: number }
    const { error } = await supabase.from('alunos').update(data).eq('id', id)
    if (error) {
      alert(`Não foi possível salvar as alterações: ${error.message}`)
      setSaving(false)
      return
    }
    onSave(form)
    onClose()
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, width: '100%', maxWidth: 480, borderRadius: '16px 16px 0 0', border: `1px solid ${t.border}`, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 0', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>{form.nome}</div>
              <div style={{ marginTop: 6 }}><BeltBadge faixa={form.faixa} graus={form.graus} t={t} /></div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex' }}>
            {tabs.map(tb => (
              <button key={tb} onClick={() => setTab(tb)} style={{ background: 'none', border: 'none', color: tab === tb ? t.accent : t.textMute, fontSize: 12, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, padding: '8px 12px', cursor: 'pointer', borderBottom: tab === tb ? `2px solid ${t.accent}` : '2px solid transparent' }}>{tb}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {tab === 'perfil' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Nome" value={form.nome} onChange={v => set('nome', v)} t={t} />
              <Field label="Instagram" value={form.instagram ?? ''} onChange={v => set('instagram', v)} t={t} />
              <Field label="Foto URL" value={form.foto_url ?? ''} onChange={v => set('foto_url', v)} placeholder="https://..." t={t} />
              <Field label="Início no jiu-jítsu" value={form.inicio} onChange={v => set('inicio', v)} type="date" t={t} />
            </div>
          )}

          {tab === 'frequência' && (
            <div>
              <FreqBar presencas={(form as any).total_presencas ?? 0} totalAulas={(form as any).total_aulas ?? 0} t={t} />
              <div style={{ marginTop: 16, color: t.textMute, fontSize: 12, fontFamily: 'monospace' }}>
                {(form as any).total_presencas ?? 0} presenças de {(form as any).total_aulas ?? 0} aulas registradas
              </div>
              <div style={{ marginTop: 12, padding: 12, background: t.surface, borderRadius: 8, border: `1px solid ${t.border}`, color: t.textSub, fontSize: 13 }}>
                💡 Para registrar presença, use o botão "+" na aba Aulas e marque os alunos que vieram.
              </div>
            </div>
          )}

          {tab === 'notas' && (
            <div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8 }}>Observações do professor</div>
              <textarea value={form.notas ?? ''} onChange={e => set('notas', e.target.value)} placeholder="Anote evolução, pontos de atenção..."
                style={{ width: '100%', minHeight: 160, background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 8, padding: 12, color: t.text, fontSize: 14, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          )}

          {tab === 'graduação' && (
            <div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 12 }}>Faixa atual</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {Object.entries(BELT_COLORS).map(([k, v]) => (
                  <button key={k} onClick={() => set('faixa', k)} style={{ padding: '8px 14px', borderRadius: 6, cursor: 'pointer', background: v.bg, color: v.text, fontWeight: 700, fontSize: 12, border: form.faixa === k ? `2px solid ${t.accent}` : '2px solid transparent', textTransform: 'uppercase', letterSpacing: 1 }}>{v.label}</button>
                ))}
              </div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 10 }}>Graus</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 1, 2, 3, 4].map(g => (
                  <button key={g} onClick={() => set('graus', g)} style={{ width: 44, height: 44, borderRadius: 6, cursor: 'pointer', fontWeight: 700, background: form.graus === g ? t.accent : t.surface2, color: form.graus === g ? '#000' : t.textMute, border: `1px solid ${t.border}`, fontSize: 15 }}>{g}</button>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: 14, background: t.surface, borderRadius: 8, border: `1px solid ${t.border}` }}>
                <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', marginBottom: 6 }}>PRÓXIMO PASSO</div>
                {form.graus < 4
                  ? <div style={{ color: t.accent, fontSize: 13 }}>+1 grau → {form.graus + 1} graus na faixa {BELT_COLORS[form.faixa]?.label}</div>
                  : <div style={{ color: t.accent, fontSize: 13 }}>Pronto para subir de faixa 🥋</div>
                }
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', color: t.textSub, cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 8, border: 'none', background: t.accent, color: '#000', fontWeight: 800, cursor: 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Nova Aula ─────────────────────────────────────────────────────────
function ModalNovaAula({ alunos, onClose, onSaved, t }: { alunos: Aluno[]; onClose: () => void; onSaved: () => void; t: Theme }) {
  const [form, setForm] = useState({ data: new Date().toISOString().split('T')[0], tecnica: '', posicao: '', notas: '' })
  const [presentes, setPresentes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const toggle = (id: string) => setPresentes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const ausentes = alunos.map(a => a.id).filter(id => !presentes.includes(id))

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/aulas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: form, presentes, ausentes }) })
    if (res.ok) { onSaved(); onClose() }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, width: '100%', maxWidth: 480, borderRadius: '16px 16px 0 0', border: `1px solid ${t.border}`, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>Registrar Aula</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Data" value={form.data} onChange={v => set('data', v)} type="date" t={t} />
          <Field label="Técnica ensinada" value={form.tecnica} onChange={v => set('tecnica', v)} placeholder="Ex: Triângulo, Kimura..." t={t} />
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Posição</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {POSITIONS.map(p => (
                <button key={p} onClick={() => set('posicao', p)} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: form.posicao === p ? '#1a3a1a' : t.surface2, color: form.posicao === p ? '#4CAF50' : t.textSub, border: form.posicao === p ? '1px solid #4CAF50' : `1px solid ${t.border}` }}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
              Quem veio hoje ({presentes.length}/{alunos.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alunos.map(a => (
                <div key={a.id} onClick={() => toggle(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: presentes.includes(a.id) ? '#0f1f0f' : t.surface, border: presentes.includes(a.id) ? '1px solid #2a4a2a' : `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: '2px solid', borderColor: presentes.includes(a.id) ? '#4CAF50' : t.border2, background: presentes.includes(a.id) ? '#4CAF50' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#000', flexShrink: 0 }}>{presentes.includes(a.id) ? '✓' : ''}</div>
                  <span style={{ color: t.text, fontSize: 14 }}>{a.nome}</span>
                  <div style={{ marginLeft: 'auto' }}><BeltBadge faixa={a.faixa} graus={a.graus} size="sm" t={t} /></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Observações</div>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Anotações gerais sobre a aula..."
              style={{ width: '100%', minHeight: 80, background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 6, padding: 10, color: t.text, fontSize: 13, resize: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', color: t.textSub, cursor: 'pointer', fontSize: 14 }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 8, border: 'none', background: t.accent, color: '#000', fontWeight: 800, cursor: 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Salvando…' : `Salvar aula (${presentes.length} presentes)`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AppShell ────────────────────────────────────────────────────────────────
export default function AppShell({ alunosIniciais, aulasIniciais }: { alunosIniciais: any[]; aulasIniciais: any[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [dark, setDark] = useState(true)
  const t = makeTheme(dark)

  const [alunos, setAlunos] = useState<any[]>(alunosIniciais)
  const [aulas]             = useState<any[]>(aulasIniciais)
  const [tab, setTab]       = useState<'alunos' | 'aulas'>('alunos')
  const [alunoSel, setAlunoSel]   = useState<any | null>(null)
  const [modalAula, setModalAula] = useState(false)

const novoAluno = async () => {
  const { data, error } = await supabase
    .from('alunos')
    .insert({ nome: 'Novo Aluno', faixa: 'branca', graus: 0, inicio: new Date().toISOString().split('T')[0] })
    .select()
    .single()
  if (error) {
    alert(`Não foi possível cadastrar o aluno: ${error.message}`)
    return
  }
  if (data) {
    setAlunos(prev => [...prev, { ...data, total_presencas: 0, total_aulas: 0 }])
  }
}
  const freqMedia = alunos.length
    ? Math.round(alunos.reduce((acc: number, a: any) => acc + ((a.total_presencas ?? 0) / Math.max(a.total_aulas ?? 1, 1)), 0) / alunos.length * 100)
    : 0

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: 'system-ui,sans-serif', color: t.text, maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: t.accent, fontSize: 11, fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Oss 🥋</div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, color: t.text }}>GrauMestre</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: t.accent, fontWeight: 700, fontSize: 20 }}>{alunos.length}</div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace' }}>ALUNOS</div>
            </div>
            <button onClick={() => setDark(d => !d)} style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 20, width: 44, height: 26, cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: dark ? 20 : 3, width: 18, height: 18, borderRadius: '50%', background: t.accent, transition: 'left 0.25s' }} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {[
            { label: 'Aulas este mês', value: aulas.filter((a: any) => a.data?.startsWith(new Date().toISOString().slice(0, 7))).length },
            { label: 'P/ graduação',   value: alunos.filter((a: any) => a.graus === 4).length },
            { label: 'Freq. média',    value: freqMedia + '%' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: t.surface, borderRadius: 8, padding: '10px 12px', border: `1px solid ${t.border}` }}>
              <div style={{ color: t.accent, fontWeight: 700, fontSize: 18 }}>{s.value}</div>
              <div style={{ color: t.textMute, fontSize: 10, fontFamily: 'monospace', lineHeight: 1.3 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}` }}>
        {(['alunos', 'aulas'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ flex: 1, padding: 14, border: 'none', background: 'none', color: tab === tb ? t.accent : t.textMute, borderBottom: tab === tb ? `2px solid ${t.accent}` : '2px solid transparent', fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, cursor: 'pointer' }}>{tb}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '16px 16px 100px' }}>
        {tab === 'alunos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alunos.map((a: any) => {
              const dias  = Math.floor((Date.now() - new Date(a.inicio).getTime()) / 86400000)
              const anos  = Math.floor(dias / 365)
              const meses = Math.floor((dias % 365) / 30)
              return (
                <div key={a.id} onClick={() => setAlunoSel(a)}
                  style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 16, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = t.cardHover)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = t.border)}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 6, background: t.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden', border: `1px solid ${t.border}` }}>
                      {a.foto_url ? <img src={a.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: t.textMute }}>{a.nome[0]}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: t.text, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{a.nome}</div>
                      <BeltBadge faixa={a.faixa} graus={a.graus} size="sm" t={t} />
                    </div>
                    <div style={{ textAlign: 'right', color: t.textMute, fontSize: 11, fontFamily: 'monospace' }}>{anos > 0 ? `${anos}a ` : ''}{meses}m</div>
                  </div>
                  <FreqBar presencas={a.total_presencas ?? 0} totalAulas={a.total_aulas ?? 0} t={t} />
                  {a.notas && <div style={{ marginTop: 10, color: t.textSub, fontSize: 12, fontStyle: 'italic', lineHeight: 1.4 }}>"{a.notas.slice(0, 80)}{a.notas.length > 80 ? '…' : ''}"</div>}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'aulas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aulas.map((a: any) => (
              <div key={a.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ color: t.text, fontWeight: 700 }}>{a.tecnica || 'Aula'}</div>
                  <div style={{ color: t.textMute, fontSize: 12, fontFamily: 'monospace' }}>{a.data}</div>
                </div>
                {a.posicao && <div style={{ color: t.accent, fontSize: 12, fontFamily: 'monospace', marginBottom: 8 }}>{a.posicao}</div>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ background: '#1a3a1a', border: '1px solid #2a4a2a', borderRadius: 4, padding: '3px 8px', fontSize: 12, color: '#4CAF50' }}>
                    {(a.presencas ?? []).filter((p: any) => p.presente).length} presentes
                  </span>
                </div>
                {a.notas && <div style={{ marginTop: 8, color: t.textSub, fontSize: 12, fontStyle: 'italic' }}>{a.notas}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <div style={{ position: 'fixed', bottom: 24, right: '50%', transform: 'translateX(50%)', maxWidth: 480, width: '100%', padding: '0 16px', boxSizing: 'border-box', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={tab === 'alunos' ? novoAluno : () => setModalAula(true)}
          style={{ background: t.accent, color: '#000', border: 'none', borderRadius: 50, width: 56, height: 56, fontSize: 26, cursor: 'pointer', fontWeight: 900, boxShadow: `0 4px 20px ${t.accent}55` }}>+</button>
      </div>

      {alunoSel && <ModalAluno aluno={alunoSel} onClose={() => setAlunoSel(null)} onSave={updated => { setAlunos(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a)); startTransition(() => router.refresh()) }} t={t} />}
      {modalAula && <ModalNovaAula alunos={alunos} onClose={() => setModalAula(false)} onSaved={() => startTransition(() => router.refresh())} t={t} />}
    </div>
  )
}
