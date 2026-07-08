'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Aluno } from '@/lib/types'

// ─── Tema (paleta preto / vermelho / branco) ──────────────────────────────────
type Theme = ReturnType<typeof makeTheme>
function makeTheme(dark: boolean) {
  return dark ? {
    bg: '#0D0D0D', surface: '#141414', surface2: '#1a1a1a',
    border: '#222', border2: '#2a2a2a',
    text: '#FFFFFF', textSub: '#888', textMute: '#555',
    accent: '#DC2626', inputBg: '#141414',
    heroGrad: 'linear-gradient(to bottom, rgba(13,13,13,0) 20%, #0D0D0D 100%)',
  } : {
    bg: '#F5F5F0', surface: '#FFFFFF', surface2: '#F0EFE9',
    border: '#E0DDD5', border2: '#D5D2CA',
    text: '#111111', textSub: '#555', textMute: '#999',
    accent: '#991B1B', inputBg: '#FAFAF7',
    heroGrad: 'linear-gradient(to bottom, rgba(245,245,240,0) 20%, #F5F5F0 100%)',
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
  'Guarda Fechada', 'Meia Guarda', 'Passagem de Guarda', 'Montada',
  'Costas', 'Raspagem', 'Finalização', 'Defesa', 'Leg Locks', 'Berimbolo',
]

// ─── Diamantes de grau (rotate-45, vermelho quando preenchido) ────────────────
function Diamonds({ graus, size = 8, t }: { graus: number; size?: number; t: Theme }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: size, height: size,
          transform: 'rotate(45deg)',
          background: i < graus ? t.accent : 'transparent',
          border: `1.5px solid ${i < graus ? t.accent : t.border2}`,
          flexShrink: 0,
          transition: 'background 0.2s, border-color 0.2s',
        }} />
      ))}
    </div>
  )
}

// ─── BeltBadge ───────────────────────────────────────────────────────────────
function BeltBadge({ faixa, graus, size = 'md', t }: { faixa: string; graus: number; size?: string; t: Theme }) {
  const belt = BELT_COLORS[faixa] ?? BELT_COLORS.branca
  const px = size === 'sm' ? '4px 8px' : '5px 11px'
  const fs = size === 'sm' ? 10 : 12
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        background: belt.bg, color: belt.text, padding: px, borderRadius: 3,
        fontWeight: 700, fontSize: fs, letterSpacing: 1, textTransform: 'uppercase',
        border: faixa === 'branca' ? '1px solid #ccc' : 'none', fontFamily: 'monospace',
      }}>
        {belt.label}
      </span>
      <Diamonds graus={graus} size={size === 'sm' ? 7 : 9} t={t} />
    </div>
  )
}

// ─── HeroImage ───────────────────────────────────────────────────────────────
// Para usar a foto real: substituir o <div> interno por
// <img src="/images/hero.jpg" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
function HeroImage({ t }: { t: Theme }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: 280, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(155deg, #1a0000 0%, #0f0000 40%, #200808 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Silhueta placeholder — substituir por <img> quando a foto for escolhida */}
        <svg width="110" height="160" viewBox="0 0 110 160" fill="none" opacity={0.45}>
          <ellipse cx="55" cy="26" rx="17" ry="20" fill="#3a0000" />
          <path d="M18 65 Q18 52 55 50 Q92 52 92 65 L89 125 H21 Z" fill="#2a0000" />
          <rect x="10" y="95" width="90" height="9" rx="2" fill="#DC2626" opacity="0.65" />
          <rect x="51" y="104" width="8" height="24" rx="2" fill="#DC2626" opacity="0.45" />
          <path d="M21 66 Q8 72 6 98 L21 95" fill="#260000" />
          <path d="M89 66 Q102 72 104 98 L89 95" fill="#260000" />
          <rect x="16" y="126" width="30" height="34" rx="5" fill="#2a0000" />
          <rect x="64" y="126" width="30" height="34" rx="5" fill="#2a0000" />
        </svg>
      </div>
      {/* Gradiente que esfumaça até o fundo do app */}
      <div style={{ position: 'absolute', inset: 0, background: t.heroGrad, pointerEvents: 'none' }} />
      {/* Título sobreposto */}
      <div style={{ position: 'absolute', bottom: 22, left: 20 }}>
        <div style={{
          color: t.accent, fontSize: 10, fontFamily: 'monospace',
          letterSpacing: 4, textTransform: 'uppercase', marginBottom: 5,
        }}>
          OSS
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#FFFFFF', letterSpacing: -1, textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}>
          GrauMestre
        </div>
      </div>
    </div>
  )
}

// ─── InsightPanel (Painel do Professor) ──────────────────────────────────────
function InsightPanel({ alunos, t }: { alunos: any[]; t: Theme }) {
  if (alunos.length < 2) return null

  const withPct = alunos.map(a => ({
    ...a,
    pct: (a.total_aulas ?? 0) > 0 ? (a.total_presencas ?? 0) / (a.total_aulas ?? 1) : 0,
  }))

  // Aluno mais perto da graduação: maior frequência entre os que ainda podem avançar
  const perto = [...withPct]
    .filter(a => !(a.graus >= 4 && a.faixa === 'preta'))
    .sort((a, b) => b.pct - a.pct)[0]

  // Aluno que precisa de atenção: menor frequência
  const atencao = [...withPct].sort((a, b) => a.pct - b.pct)[0]

  if (!perto || !atencao) return null

  return (
    <div style={{ padding: '0 16px 14px' }}>
      <div style={{
        color: t.textMute, fontSize: 9, fontFamily: 'monospace',
        textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8,
      }}>
        Painel do Professor
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{
          background: t.surface, borderRadius: 10, padding: 13,
          border: `1px solid ${t.border}`, borderTop: `3px solid ${t.accent}`,
        }}>
          <div style={{ color: t.textMute, fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Perto da faixa
          </div>
          <div style={{ color: t.text, fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
            {perto.nome.split(' ')[0]}
          </div>
          <div style={{ color: t.accent, fontSize: 11, fontFamily: 'monospace' }}>
            {Math.round(perto.pct * 100)}% freq
          </div>
        </div>
        <div style={{
          background: t.surface, borderRadius: 10, padding: 13,
          border: `1px solid ${t.border}`, borderTop: '3px solid #F44336',
        }}>
          <div style={{ color: t.textMute, fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Precisa atenção
          </div>
          <div style={{ color: t.text, fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
            {atencao.nome.split(' ')[0]}
          </div>
          <div style={{ color: '#F44336', fontSize: 11, fontFamily: 'monospace' }}>
            {Math.round(atencao.pct * 100)}% freq
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── FreqBar ─────────────────────────────────────────────────────────────────
function FreqBar({ presencas, totalAulas, t }: { presencas: number; totalAulas: number; t: Theme }) {
  const pct = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0
  const color = pct >= 75 ? '#4CAF50' : pct >= 50 ? '#FF9800' : '#F44336'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1 }}>Frequência</span>
        <span style={{ color, fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{pct}%</span>
      </div>
      <div style={{ background: t.surface2, borderRadius: 2, height: 4 }}>
        <div style={{ width: `${pct}%`, height: 4, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

// ─── AlunoCard — crachá circular com anel de frequência ───────────────────────
function AlunoCard({ aluno, onClick, t }: { aluno: any; onClick: () => void; t: Theme }) {
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
  const ringColor = pct >= 0.75 ? '#4CAF50' : pct >= 0.5 ? '#FF9800' : '#F44336'
  const belt     = BELT_COLORS[aluno.faixa] ?? BELT_COLORS.branca

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
        background: t.surface,
        border: `1px solid ${hovered ? t.accent : t.border}`,
        borderRadius: 14,
        padding: '18px 10px 14px',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        transform: pressed ? 'scale(0.93)' : 'scale(1)',
        transition: 'transform 0.1s ease, border-color 0.2s',
        userSelect: 'none',
      }}
    >
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
          {aluno.foto_url
            ? <img src={aluno.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 26, fontWeight: 900, color: t.accent, fontFamily: 'monospace' }}>{aluno.nome[0]}</span>
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
        padding: '2px 8px', borderRadius: 3,
        fontWeight: 700, fontSize: 9, letterSpacing: 1,
        textTransform: 'uppercase', fontFamily: 'monospace',
        border: aluno.faixa === 'branca' ? '1px solid #ccc' : 'none',
      }}>
        {belt.label}
      </div>

      {/* Graus */}
      <Diamonds graus={aluno.graus} size={8} t={t} />

      {/* Tempo na arte */}
      <div style={{ color: t.textMute, fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 }}>
        {anos > 0 ? `${anos}A ` : ''}{meses}M
      </div>
    </div>
  )
}

// ─── Field ───────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', placeholder, t }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; t: Theme
}) {
  return (
    <div>
      <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>{label}</div>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 6, padding: '10px 12px', color: t.text, fontSize: 14, boxSizing: 'border-box' }}
      />
    </div>
  )
}

// ─── Modal Aluno ─────────────────────────────────────────────────────────────
function ModalAluno({ aluno, onClose, onSave, t }: {
  aluno: Aluno & { total_presencas?: number; total_aulas?: number };
  onClose: () => void; onSave: (a: Aluno) => void; t: Theme
}) {
  const [form, setForm]   = useState({ ...aluno })
  const [tab, setTab]     = useState('perfil')
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const tabs = ['perfil', 'frequência', 'notas', 'graduação']

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  const handleSave = async () => {
    setSaving(true)
    const { id, created_at, total_presencas, total_aulas, ...data } =
      form as typeof form & { created_at?: string; total_presencas?: number; total_aulas?: number }
    const { error } = await supabase.from('alunos').update(data).eq('id', id)
    if (error) {
      alert(`Não foi possível salvar as alterações: ${error.message}`)
      setSaving(false)
      return
    }
    onSave(form)
    handleClose()
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: `rgba(0,0,0,${visible ? 0.75 : 0})`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        transition: 'background 0.22s',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.bg, width: '100%', maxWidth: 480,
          borderRadius: '16px 16px 0 0', border: `1px solid ${t.border}`,
          maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s ease, opacity 0.22s ease',
        }}
      >
        <div style={{ padding: '20px 20px 0', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>{form.nome}</div>
              <div style={{ marginTop: 6 }}><BeltBadge faixa={form.faixa} graus={form.graus} t={t} /></div>
            </div>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
          </div>
          <div style={{ display: 'flex' }}>
            {tabs.map(tb => (
              <button key={tb} onClick={() => setTab(tb)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: tab === tb ? t.accent : t.textMute,
                fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1,
                padding: '8px 10px',
                borderBottom: tab === tb ? `2px solid ${t.accent}` : '2px solid transparent',
              }}>{tb}</button>
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
                Para registrar presença, use o botão "+" na aba Aulas e marque os alunos que vieram.
              </div>
            </div>
          )}

          {tab === 'notas' && (
            <div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8 }}>Observações do professor</div>
              <textarea
                value={form.notas ?? ''} onChange={e => set('notas', e.target.value)}
                placeholder="Anote evolução, pontos de atenção..."
                style={{ width: '100%', minHeight: 160, background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 8, padding: 12, color: t.text, fontSize: 14, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {tab === 'graduação' && (
            <div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 12 }}>Faixa atual</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {Object.entries(BELT_COLORS).map(([k, v]) => (
                  <button key={k} onClick={() => set('faixa', k)} style={{
                    padding: '8px 14px', borderRadius: 6, cursor: 'pointer',
                    background: v.bg, color: v.text, fontWeight: 700, fontSize: 12,
                    border: form.faixa === k ? `2px solid ${t.accent}` : '2px solid transparent',
                    textTransform: 'uppercase', letterSpacing: 1,
                  }}>{v.label}</button>
                ))}
              </div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 10 }}>Graus</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 1, 2, 3, 4].map(g => (
                  <button key={g} onClick={() => set('graus', g)} style={{
                    width: 44, height: 44, borderRadius: 6, cursor: 'pointer', fontWeight: 700,
                    background: form.graus === g ? t.accent : t.surface2,
                    color: form.graus === g ? '#fff' : t.textMute,
                    border: `1px solid ${t.border}`, fontSize: 15,
                  }}>{g}</button>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: 14, background: t.surface, borderRadius: 8, border: `1px solid ${t.border}` }}>
                <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', marginBottom: 6 }}>PRÓXIMO PASSO</div>
                {form.graus < 4
                  ? <div style={{ color: t.accent, fontSize: 13 }}>+1 grau → {form.graus + 1} graus na faixa {BELT_COLORS[form.faixa]?.label}</div>
                  : <div style={{ color: t.accent, fontSize: 13 }}>Pronto para subir de faixa</div>
                }
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
          <button
            onClick={handleClose}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', color: t.textSub, cursor: 'pointer', fontSize: 14 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: 12, borderRadius: 8, border: 'none', background: t.accent, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s' }}
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Nova Aula ─────────────────────────────────────────────────────────
function ModalNovaAula({ alunos, onClose, onSaved, t }: { alunos: Aluno[]; onClose: () => void; onSaved: () => void; t: Theme }) {
  const [form, setForm]   = useState({ data: new Date().toISOString().split('T')[0], tecnica: '', posicao: '', notas: '' })
  const [presentes, setPresentes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)
  const set    = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const toggle = (id: string) => setPresentes(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const ausentes = alunos.map(a => a.id).filter(id => !presentes.includes(id))

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/aulas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: form, presentes, ausentes }),
    })
    if (res.ok) { onSaved(); handleClose() }
    else setSaving(false)
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: `rgba(0,0,0,${visible ? 0.75 : 0})`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        transition: 'background 0.22s',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.bg, width: '100%', maxWidth: 480,
          borderRadius: '16px 16px 0 0', border: `1px solid ${t.border}`,
          maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s ease, opacity 0.22s ease',
        }}
      >
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>Registrar Aula</div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Data" value={form.data} onChange={v => set('data', v)} type="date" t={t} />
          <Field label="Técnica ensinada" value={form.tecnica} onChange={v => set('tecnica', v)} placeholder="Ex: Triângulo, Kimura..." t={t} />
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Posição</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {POSITIONS.map(p => (
                <button key={p} onClick={() => set('posicao', p)} style={{
                  padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: form.posicao === p ? '#1a3a1a' : t.surface2,
                  color: form.posicao === p ? '#4CAF50' : t.textSub,
                  border: form.posicao === p ? '1px solid #4CAF50' : `1px solid ${t.border}`,
                }}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
              Quem veio hoje ({presentes.length}/{alunos.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alunos.map(a => (
                <div
                  key={a.id} onClick={() => toggle(a.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: presentes.includes(a.id) ? '#0f1f0f' : t.surface,
                    border: presentes.includes(a.id) ? '1px solid #2a4a2a' : `1px solid ${t.border}`,
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, border: '2px solid',
                    borderColor: presentes.includes(a.id) ? '#4CAF50' : t.border2,
                    background: presentes.includes(a.id) ? '#4CAF50' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: '#000', flexShrink: 0,
                  }}>
                    {presentes.includes(a.id) ? '✓' : ''}
                  </div>
                  <span style={{ color: t.text, fontSize: 14 }}>{a.nome}</span>
                  <div style={{ marginLeft: 'auto' }}><BeltBadge faixa={a.faixa} graus={a.graus} size="sm" t={t} /></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Observações</div>
            <textarea
              value={form.notas} onChange={e => set('notas', e.target.value)}
              placeholder="Anotações gerais sobre a aula..."
              style={{ width: '100%', minHeight: 80, background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 6, padding: 10, color: t.text, fontSize: 13, resize: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
          <button
            onClick={handleClose}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', color: t.textSub, cursor: 'pointer', fontSize: 14 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: 12, borderRadius: 8, border: 'none', background: t.accent, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s' }}
          >
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
  const [dark, setDark]   = useState(true)
  const [toggleHover, setToggleHover] = useState(false)
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
    if (error) { alert(`Não foi possível cadastrar o aluno: ${error.message}`); return }
    if (data) setAlunos(prev => [...prev, { ...data, total_presencas: 0, total_aulas: 0 }])
  }

  const freqMedia = alunos.length
    ? Math.round(alunos.reduce((acc: number, a: any) => acc + ((a.total_presencas ?? 0) / Math.max(a.total_aulas ?? 1, 1)), 0) / alunos.length * 100)
    : 0

  const aulasEsseMes = aulas.filter((a: any) => a.data?.startsWith(new Date().toISOString().slice(0, 7))).length
  const paraGraduacao = alunos.filter((a: any) => a.graus === 4).length

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: 'system-ui,sans-serif', color: t.text, maxWidth: 480, margin: '0 auto' }}>

      {/* Hero */}
      <HeroImage t={t} />

      {/* Barra de stats + toggle de tema */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', flex: 1, gap: 8 }}>
          {[
            { label: 'AULAS/MÊS', value: aulasEsseMes },
            { label: 'P/ FAIXA',  value: paraGraduacao },
            { label: 'FREQ MÉD',  value: freqMedia + '%' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: t.surface, borderRadius: 8, padding: '8px 10px', border: `1px solid ${t.border}` }}>
              <div style={{ color: t.accent, fontWeight: 800, fontSize: 16, fontFamily: 'monospace' }}>{s.value}</div>
              <div style={{ color: t.textMute, fontSize: 8, fontFamily: 'monospace', letterSpacing: 1, marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Toggle de tema com rotação no hover */}
        <button
          onClick={() => setDark(d => !d)}
          onMouseEnter={() => setToggleHover(true)}
          onMouseLeave={() => setToggleHover(false)}
          style={{
            background: t.surface2, border: `1px solid ${t.border}`,
            borderRadius: 20, width: 44, height: 26, cursor: 'pointer',
            position: 'relative', flexShrink: 0,
            transform: toggleHover ? 'rotate(15deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
          }}
        >
          <div style={{
            position: 'absolute', top: 3, left: dark ? 20 : 3,
            width: 18, height: 18, borderRadius: '50%',
            background: t.accent, transition: 'left 0.25s',
          }} />
        </button>
      </div>

      {/* Painel do Professor — só na aba alunos */}
      {tab === 'alunos' && <div style={{ paddingTop: 14 }}><InsightPanel alunos={alunos} t={t} /></div>}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}` }}>
        {(['alunos', 'aulas'] as const).map(tb => (
          <button
            key={tb} onClick={() => setTab(tb)}
            style={{
              flex: 1, padding: 14, border: 'none', background: 'none', cursor: 'pointer',
              color: tab === tb ? t.accent : t.textMute,
              borderBottom: tab === tb ? `2px solid ${t.accent}` : '2px solid transparent',
              fontFamily: 'monospace', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1,
            }}
          >
            {tb}
            {tb === 'alunos' && (
              <span style={{ marginLeft: 6, fontSize: 11, color: tab === tb ? t.accent : t.textMute, opacity: 0.7 }}>
                {alunos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div style={{ padding: '16px 16px 100px' }}>

        {/* Grade de crachás circulares */}
        {tab === 'alunos' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {alunos.map((a: any) => (
              <AlunoCard key={a.id} aluno={a} onClick={() => setAlunoSel(a)} t={t} />
            ))}
          </div>
        )}

        {/* Lista de aulas */}
        {tab === 'aulas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aulas.map((a: any) => (
              <div key={a.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ color: t.text, fontWeight: 700 }}>{a.tecnica || 'Aula'}</div>
                  <div style={{ color: t.textMute, fontSize: 12, fontFamily: 'monospace' }}>{a.data}</div>
                </div>
                {a.posicao && (
                  <div style={{ color: t.accent, fontSize: 12, fontFamily: 'monospace', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {a.posicao}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
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
      <div style={{
        position: 'fixed', bottom: 24, right: '50%', transform: 'translateX(50%)',
        maxWidth: 480, width: '100%', padding: '0 16px', boxSizing: 'border-box',
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <FabButton
          onClick={tab === 'alunos' ? novoAluno : () => setModalAula(true)}
          t={t}
        />
      </div>

      {/* Modais */}
      {alunoSel && (
        <ModalAluno
          aluno={alunoSel}
          onClose={() => setAlunoSel(null)}
          onSave={updated => {
            setAlunos(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a))
            startTransition(() => router.refresh())
          }}
          t={t}
        />
      )}
      {modalAula && (
        <ModalNovaAula
          alunos={alunos}
          onClose={() => setModalAula(false)}
          onSaved={() => startTransition(() => router.refresh())}
          t={t}
        />
      )}
    </div>
  )
}

// ─── FAB com active:scale ─────────────────────────────────────────────────────
function FabButton({ onClick, t }: { onClick: () => void; t: Theme }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: t.accent, color: '#fff', border: 'none',
        borderRadius: '50%', width: 56, height: 56,
        fontSize: 28, cursor: 'pointer', fontWeight: 900,
        boxShadow: `0 4px 24px ${t.accent}66`,
        transform: pressed ? 'scale(0.88)' : 'scale(1)',
        transition: 'transform 0.1s ease, box-shadow 0.1s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      +
    </button>
  )
}
