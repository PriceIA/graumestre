'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Aluno, Faixa, Graduacao, ProfessorPerfil } from '@/lib/types'
import {
  professorPodeAssinar, tipoAprovacaoGraduacao,
  calcularIdade, calcularCategoria, ehInfantil,
  FAIXAS_INFANTIS, FAIXAS_ADULTAS, NOMES_FAIXA,
  grausMaximos, nomeFaixaExibicao, diasRestantesProvisorio,
  anosNaFaixaAtual, prontoParaProximaFaixa, podeProximoGrauPreta,
} from '@/lib/regras-ibjjf'
import { alertaGraduacao } from '@/lib/alertas-graduacao'
import { carregarDados } from '@/lib/carregar-dados'
import DashboardProfessor from '@/components/DashboardProfessor'

// ─── Tema (paleta GrauMestre — preto/vermelho, fixa) ──────────────────────────
// Paleta única (sem alternância claro/escuro), conforme design schema do
// Dashboard do Professor.
type Theme = typeof theme
const theme = {
  bg: '#0a0a0a', surface: '#161616', surface2: '#1f1f1f',
  border: 'rgba(255,255,255,0.12)', border2: 'rgba(255,255,255,0.18)',
  text: '#FFFFFF', textSub: 'rgba(255,255,255,0.6)', textMute: 'rgba(255,255,255,0.4)',
  accent: '#df2531', inputBg: '#161616',
  accentBg: 'rgba(223,37,49,0.1)',
}

// frequência alta = branco/escuro, média = cinza, baixa = vermelho
function freqColor(ratio: number, t: Theme) {
  if (ratio >= 0.75) return t.text
  if (ratio >= 0.5)  return t.textSub
  return t.accent
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const BELT_COLORS: Record<Faixa, { bg: string; text: string }> = {
  branca: { bg: '#FFFFFF', text: '#0D0D0D' },
  cinza_branca:   { bg: '#BDBDBD', text: '#0D0D0D' },
  cinza:          { bg: '#9E9E9E', text: '#fff' },
  cinza_preta:    { bg: '#757575', text: '#fff' },
  amarela_branca: { bg: '#FFF59D', text: '#0D0D0D' },
  amarela:        { bg: '#FBC02D', text: '#0D0D0D' },
  amarela_preta:  { bg: '#F9A825', text: '#0D0D0D' },
  laranja_branca: { bg: '#FFCC80', text: '#0D0D0D' },
  laranja:        { bg: '#F57C00', text: '#fff' },
  laranja_preta:  { bg: '#E65100', text: '#fff' },
  verde_branca:   { bg: '#A5D6A7', text: '#0D0D0D' },
  verde:          { bg: '#2E7D32', text: '#fff' },
  verde_preta:    { bg: '#1B5E20', text: '#fff' },
  azul:   { bg: '#1565C0', text: '#fff' },
  roxa:   { bg: '#6A1B9A', text: '#fff' },
  marrom: { bg: '#4E342E', text: '#fff' },
  preta:  { bg: '#0D0D0D', text: '#C9A84C' },
}

const POSITIONS = [
  'Guarda Fechada', 'Meia Guarda', 'Passagem de Guarda', 'Montada',
  'Costas', 'Raspagem', 'Finalização', 'Defesa', 'Leg Locks', 'Berimbolo',
]

// ─── Colunas graváveis de `alunos` ───────────────────────────────────────────
// O objeto do aluno carrega campos derivados que NÃO são colunas da tabela:
// total_presencas/total_aulas vêm da view alunos_frequencia, e
// ultima_graduacao_data/historico_graduacoes são montados em app/page.tsx.
// Mandar qualquer um deles no update faz o PostgREST rejeitar a request inteira
// (PGRST204) e trava a edição do aluno por completo — inclusive quando o valor
// é um array vazio, porque a validação é feita sobre as chaves do payload, não
// sobre os valores. Whitelist em vez de descartar campo a campo: assim um campo
// derivado novo não volta a quebrar o save silenciosamente.
const COLUNAS_ALUNO = [
  'nome', 'faixa', 'graus', 'inicio', 'data_nascimento', 'foto_url', 'instagram', 'notas',
  'campeao_mundial_azul', 'campeao_mundial_roxa', 'campeao_mundial_marrom',
  'veio_de_faixa_juvenil', 'status_graduacao', 'provisorio_desde',
  'curso_primeiros_socorros', 'curso_regras_data',
] as const satisfies readonly (keyof Aluno)[]

function payloadAluno(form: Aluno): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const coluna of COLUNAS_ALUNO) out[coluna] = form[coluna]
  return out
}

// ─── Soft delete / lixeira ───────────────────────────────────────────────────
// Nada aqui apaga linha do banco: "apagar" só carimba deleted_at, e restaurar
// zera de volta. Os payloads são literais explícitos — nunca espalhe o objeto
// de estado num update, foi exatamente assim que a edição de aluno quebrou
// (campo derivado vazando no payload → PGRST204).
//
// ⚠ A purga física (DELETE definitivo após os 7 dias) NÃO está automatizada.
// DIAS_LIXEIRA é só um filtro de exibição: passado o prazo o item some da aba
// Lixeira, mas a linha continua no banco. Ver 005_soft_delete.sql.
const DIAS_LIXEIRA = 7

type TabelaComLixeira = 'alunos' | 'aulas' | 'graduacoes'

function mandarParaLixeira(tabela: TabelaComLixeira, id: string) {
  return supabase.from(tabela).update({ deleted_at: new Date().toISOString() }).eq('id', id)
}

function restaurarDaLixeira(tabela: TabelaComLixeira, id: string) {
  return supabase.from(tabela).update({ deleted_at: null }).eq('id', id)
}

// Instante a partir do qual um item ainda é recuperável.
function limiteLixeira(): string {
  return new Date(Date.now() - DIAS_LIXEIRA * 86400000).toISOString()
}

function diasNaLixeira(deletedAt: string): number {
  return Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000)
}

function textoPrazo(deletedAt: string): string {
  const dias = diasNaLixeira(deletedAt)
  const restantes = Math.max(0, DIAS_LIXEIRA - dias)
  const apagado = dias === 0 ? 'hoje' : dias === 1 ? 'há 1 dia' : `há ${dias} dias`
  const some = restantes === 0 ? 'some hoje' : restantes === 1 ? 'some em 1 dia' : `some em ${restantes} dias`
  return `Apagado ${apagado} · ${some}`
}

// ─── Validação do formulário do aluno ────────────────────────────────────────
// Retorna a mensagem de erro, ou null quando está tudo certo.
function validarAluno(form: Aluno): string | null {
  if (!form.nome.trim()) return 'O nome do aluno não pode ficar vazio.'

  if (form.data_nascimento) {
    // T00:00:00 força interpretação em horário local — sem isso a string ISO
    // pura é lida como UTC e um nascimento de hoje pode cair no "futuro".
    const nascimento = new Date(`${form.data_nascimento}T00:00:00`)
    if (Number.isNaN(nascimento.getTime())) {
      return 'A data de nascimento não é uma data válida.'
    }
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    if (nascimento > hoje) {
      return 'A data de nascimento não pode estar no futuro.'
    }
  }

  return null
}

// ─── Diamantes de grau (rotate-45, vermelho quando preenchido) ────────────────
function Diamonds({ faixa, graus, size = 8, t }: { faixa: Faixa; graus: number; size?: number; t: Theme }) {
  const max = grausMaximos(faixa)
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
      {Array.from({ length: max }, (_, i) => i).map(i => (
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
function BeltBadge({ faixa, graus, size = 'md', t }: { faixa: Faixa; graus: number; size?: string; t: Theme }) {
  const belt = BELT_COLORS[faixa] ?? BELT_COLORS.branca
  const label = nomeFaixaExibicao(faixa, graus)
  const px = size === 'sm' ? '4px 8px' : '5px 11px'
  const fs = size === 'sm' ? 10 : 12
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{
        background: belt.bg, color: belt.text, padding: px, borderRadius: 3,
        fontWeight: 700, fontSize: fs, letterSpacing: 1, textTransform: 'uppercase',
        border: faixa === 'branca' ? '1px solid #ccc' : 'none', fontFamily: 'monospace',
      }}>
        {label}
      </span>
      <Diamonds faixa={faixa} graus={graus} size={size === 'sm' ? 7 : 9} t={t} />
    </div>
  )
}

// ─── FreqBar ─────────────────────────────────────────────────────────────────
function FreqBar({ presencas, totalAulas, t }: { presencas: number; totalAulas: number; t: Theme }) {
  const pct = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0
  const color = freqColor(pct / 100, t)
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
  const ringColor = freqColor(pct, t)
  const belt     = BELT_COLORS[aluno.faixa as Faixa] ?? BELT_COLORS.branca
  const alerta   = alertaGraduacao(aluno, aluno.ultima_graduacao_data ?? null)

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
      {/* Sugestão de graduação — nunca bloqueio, só um aviso visual */}
      {alerta && (
        <div title={alerta} style={{
          position: 'absolute', top: 8, right: 8,
          background: t.accent, color: '#fff', fontSize: 8, fontWeight: 800,
          padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', letterSpacing: 0.5,
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
        textAlign: 'center',
      }}>
        {nomeFaixaExibicao(aluno.faixa, aluno.graus)}
      </div>

      {/* Graus */}
      <Diamonds faixa={aluno.faixa} graus={aluno.graus} size={8} t={t} />

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

// ─── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ label, checked, onChange, t }: { label: string; checked: boolean; onChange: (v: boolean) => void; t: Theme }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
        background: checked ? t.accentBg : t.surface, border: `1px solid ${checked ? t.accent : t.border}`,
      }}
    >
      <span style={{ color: t.text, fontSize: 13 }}>{label}</span>
      <div style={{
        width: 40, height: 22, borderRadius: 20, flexShrink: 0,
        background: checked ? t.accent : t.surface2, border: `1px solid ${t.border}`,
        position: 'relative', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  )
}

// ─── Card do Professor ────────────────────────────────────────────────────────
function ProfessorCard({ professor, onClick, t }: { professor: ProfessorPerfil; onClick: () => void; t: Theme }) {
  return (
    <div style={{ padding: '0 16px 14px' }}>
      <div
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10,
          padding: '12px 14px', cursor: 'pointer',
        }}
      >
        <div>
          <div style={{ color: t.textMute, fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
            Professor
          </div>
          <div style={{ color: t.text, fontWeight: 700, fontSize: 14 }}>{professor.nome}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BeltBadge faixa={professor.faixa} graus={professor.graus} size="sm" t={t} />
          <span style={{ color: t.accent, fontWeight: 800, fontSize: 12, fontFamily: 'monospace' }}>{professor.graus}º grau</span>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Professor ─────────────────────────────────────────────────────────
function ModalProfessor({ professor, onClose, onSave, t }: {
  professor: ProfessorPerfil; onClose: () => void; onSave: (p: ProfessorPerfil) => void; t: Theme
}) {
  const [graus, setGraus] = useState(professor.graus)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

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
    const { error } = await supabase.from('professor_perfil').update({ graus }).eq('id', professor.id)
    if (error) {
      alert(`Não foi possível salvar o grau do professor: ${error.message}`)
      setSaving(false)
      return
    }
    onSave({ ...professor, graus })
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
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>Perfil do Professor</div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Nome</div>
            <div style={{ color: t.text, fontSize: 14 }}>{professor.nome}</div>
          </div>
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
              Grau na faixa preta (0–9)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Array.from({ length: 10 }, (_, g) => g).map(g => (
                <button key={g} onClick={() => setGraus(g)} style={{
                  width: 40, height: 40, borderRadius: 6, cursor: 'pointer', fontWeight: 700,
                  background: graus === g ? t.accent : t.surface2,
                  color: graus === g ? '#fff' : t.textMute,
                  border: `1px solid ${t.border}`, fontSize: 14,
                }}>{g}</button>
              ))}
            </div>
            <div style={{ marginTop: 10, color: t.textSub, fontSize: 12, fontFamily: 'monospace' }}>
              7º = Vermelha e Preta · 8º = Vermelha e Branca · 9º = Vermelha
            </div>
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
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Aluno ─────────────────────────────────────────────────────────────
function ModalAluno({ aluno, professor, onClose, onSave, onDelete, onDeleteGraduacao, t, podeEditar = true }: {
  aluno: Aluno & { total_presencas?: number; total_aulas?: number; ultima_graduacao_data?: string | null; historico_graduacoes?: Graduacao[] };
  professor: ProfessorPerfil | null;
  onClose: () => void; onSave: (a: Aluno) => void; onDelete: (id: string) => void;
  // avisa o AppShell que algo entrou na lixeira, para o badge da aba recontar
  onDeleteGraduacao: () => void; t: Theme;
  // Hoje é sempre true (app single-user, só o professor usa). Fica preparado
  // para quando o aluno puder logar e ver o próprio perfil em modo leitura.
  podeEditar?: boolean;
}) {
  const [form, setForm]   = useState({ ...aluno })
  const [tab, setTab]     = useState('perfil')
  const [saving, setSaving] = useState(false)
  const [erro, setErro]   = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  // cópia local do histórico para o ✕ sumir na hora, sem esperar recarga
  const [historico, setHistorico] = useState<Graduacao[]>(aluno.historico_graduacoes ?? [])
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const tabs = ['perfil', 'frequência', 'notas', 'graduação']

  // Validação de quem pode assinar (art. 6°, 7.3, 7.4, 7.4.1) — só entra em
  // jogo quando a faixa está de fato mudando nesta edição.
  const faixaAlterada = form.faixa !== aluno.faixa
  const tipoAprovacao = tipoAprovacaoGraduacao(form.faixa, form.status_graduacao)
  const aprovacao: { ok: boolean; motivo?: string } = professor && faixaAlterada
    ? professorPodeAssinar(professor, tipoAprovacao)
    : { ok: true }

  // Idade/categoria (art. 2.2.1) e lista de faixas disponíveis — infantil e
  // adulto nunca aparecem juntos no seletor (art. 2°).
  const idade     = form.data_nascimento ? calcularIdade(form.data_nascimento) : null
  const categoria = form.data_nascimento ? calcularCategoria(form.data_nascimento) : null
  const infantilAluno = form.data_nascimento ? ehInfantil(form.data_nascimento) : false
  const faixasDisponiveis = infantilAluno ? FAIXAS_INFANTIS : FAIXAS_ADULTAS
  const maxGrausFaixa = grausMaximos(form.faixa)
  const ultimaGraduacaoData = aluno.ultima_graduacao_data ?? null

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  const handleDelete = async () => {
    if (!window.confirm(
      `Apagar ${aluno.nome}? O aluno vai para a lixeira e pode ser restaurado por ${DIAS_LIXEIRA} dias.`
    )) return
    setSaving(true)
    const { error } = await mandarParaLixeira('alunos', aluno.id)
    if (error) {
      setErro(`Não foi possível apagar o aluno: ${error.message}`)
      setSaving(false)
      return
    }
    onDelete(aluno.id)
    handleClose()
  }

  const handleDeleteGraduacao = async (g: Graduacao) => {
    if (!window.confirm(
      `Apagar esta graduação do histórico? Ela vai para a lixeira e pode ser restaurada por ${DIAS_LIXEIRA} dias.`
    )) return
    const { error } = await mandarParaLixeira('graduacoes', g.id)
    if (error) {
      setErro(`Não foi possível apagar a graduação: ${error.message}`)
      return
    }
    setErro(null)
    setHistorico(prev => prev.filter(h => h.id !== g.id))
    onDeleteGraduacao()
  }

  const handleSave = async () => {
    const invalido = validarAluno(form)
    if (invalido) {
      setErro(invalido)
      setTab('perfil')   // todos os campos validados vivem nessa aba
      return
    }
    setErro(null)

    // Tempo mínimo é sugestão, nunca bloqueio (art. 3.1.3 / 4.1.5) — avisa e
    // deixa o professor decidir, ao contrário do grau de assinatura (bloqueio).
    if (faixaAlterada && aluno.faixa !== 'preta' && !prontoParaProximaFaixa(aluno, ultimaGraduacaoData)) {
      const confirmado = window.confirm(
        'O tempo mínimo na faixa atual ainda não foi cumprido segundo o Sistema Geral de Graduação IBJJF. Graduar mesmo assim?'
      )
      if (!confirmado) return
    }
    if (aluno.faixa === 'preta' && form.graus > aluno.graus) {
      const anos = anosNaFaixaAtual(aluno, ultimaGraduacaoData)
      const { pode } = podeProximoGrauPreta(anos, anos, aluno.graus)
      if (!pode) {
        const confirmado = window.confirm(
          'O tempo mínimo para o próximo grau ainda não foi cumprido. Conceder o grau mesmo assim?'
        )
        if (!confirmado) return
      }
    }

    setSaving(true)
    const payload = { ...payloadAluno(form), nome: form.nome.trim() }
    const { error } = await supabase.from('alunos').update(payload).eq('id', aluno.id)
    if (error) {
      // Modal continua aberto de propósito: o professor não perde o que digitou.
      setErro(`Não foi possível salvar as alterações: ${error.message}`)
      setSaving(false)
      return
    }

    // Registra o histórico sempre que faixa ou grau mudam (mesmo grau dentro
    // da mesma faixa), para dataInicioFaixaAtual() ter uma data real a usar.
    let novaUltimaGraduacao = ultimaGraduacaoData
    if (form.faixa !== aluno.faixa || form.graus !== aluno.graus) {
      const hoje = new Date().toISOString().split('T')[0]
      const { error: gradErr } = await supabase.from('graduacoes').insert({
        aluno_id: aluno.id,
        faixa_anterior: aluno.faixa,
        faixa_nova: form.faixa,
        graus_anterior: aluno.graus,
        graus_novo: form.graus,
        data: hoje,
      })
      if (gradErr) {
        // Os dados do aluno já foram salvos — reflete isso na lista, mas mantém
        // o modal aberto para o professor poder tentar o histórico de novo.
        onSave({ ...form, nome: payload.nome as string, ultima_graduacao_data: novaUltimaGraduacao } as Aluno)
        setErro(`Os dados do aluno foram salvos, mas não foi possível registrar o histórico de graduação: ${gradErr.message}. Tente salvar novamente.`)
        setSaving(false)
        return
      }
      novaUltimaGraduacao = hoje
    }

    onSave({ ...form, nome: payload.nome as string, ultima_graduacao_data: novaUltimaGraduacao } as Aluno)
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

        {/* fieldset desabilita de uma vez todos os inputs/selects/botões que
            estiverem dentro dele — as abas ficam de fora e continuam navegáveis */}
        <fieldset
          disabled={!podeEditar}
          style={{ padding: 20, overflowY: 'auto', flex: 1, border: 'none', margin: 0, minWidth: 0 }}
        >
          {tab === 'perfil' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Nome" value={form.nome} onChange={v => set('nome', v)} t={t} />
              <Field
                label="Data de nascimento" value={form.data_nascimento ?? ''}
                onChange={v => set('data_nascimento', v || null)} type="date" t={t}
              />
              {form.data_nascimento && (
                <div style={{ display: 'flex', gap: 20 }}>
                  <div>
                    <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Idade</div>
                    <div style={{ color: t.text, fontSize: 14 }}>{idade} anos</div>
                  </div>
                  <div>
                    <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Categoria</div>
                    <div style={{ color: t.text, fontSize: 14 }}>{categoria}</div>
                  </div>
                </div>
              )}
              <Field label="Instagram" value={form.instagram ?? ''} onChange={v => set('instagram', v)} t={t} />
              <Field label="Foto URL" value={form.foto_url ?? ''} onChange={v => set('foto_url', v)} placeholder="https://..." t={t} />
              <Field label="Início no jiu-jítsu" value={form.inicio} onChange={v => set('inicio', v)} type="date" t={t} />

              <div>
                <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
                  Histórico de graduações
                </div>
                {historico.length === 0 ? (
                  <div style={{ color: t.textSub, fontSize: 12, fontStyle: 'italic' }}>Nenhuma graduação registrada ainda.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {historico.map(g => (
                      <div key={g.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                          <span style={{ color: t.text, fontSize: 13, fontWeight: 700 }}>
                            {nomeFaixaExibicao(g.faixa_anterior, g.graus_anterior)} → {nomeFaixaExibicao(g.faixa_nova, g.graus_novo)}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace' }}>{g.data}</span>
                            <button
                              onClick={() => handleDeleteGraduacao(g)}
                              title="Apagar graduação"
                              style={{
                                background: 'none', border: 'none', color: t.textMute,
                                fontSize: 13, cursor: 'pointer', padding: '0 2px', lineHeight: 1,
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        <div style={{ color: t.textSub, fontSize: 11, fontFamily: 'monospace' }}>
                          {g.graus_anterior}º → {g.graus_novo}º grau
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 12 }}>
                Faixa atual {form.data_nascimento && `— ${infantilAluno ? 'infantil' : 'adulto'}`}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {faixasDisponiveis.map(fx => (
                  <button key={fx} onClick={() => set('faixa', fx)} style={{
                    padding: '8px 14px', borderRadius: 6, cursor: 'pointer',
                    background: BELT_COLORS[fx].bg, color: BELT_COLORS[fx].text, fontWeight: 700, fontSize: 12,
                    border: form.faixa === fx ? `2px solid ${t.accent}` : '2px solid transparent',
                    textTransform: 'uppercase', letterSpacing: 1,
                  }}>{NOMES_FAIXA[fx]}</button>
                ))}
              </div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 10 }}>Graus</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Array.from({ length: maxGrausFaixa + 1 }, (_, g) => g).map(g => (
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
                {form.graus < maxGrausFaixa
                  ? <div style={{ color: t.accent, fontSize: 13 }}>+1 grau → {nomeFaixaExibicao(form.faixa, form.graus + 1)}</div>
                  : <div style={{ color: t.accent, fontSize: 13 }}>Pronto para subir de faixa</div>
                }
              </div>

              {/* Exceções de tempo mínimo (art. 3.1.3) — só a do campeonato da faixa atual */}
              {(aluno.faixa === 'azul' || aluno.faixa === 'roxa' || aluno.faixa === 'marrom') && (
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                    Exceções de tempo mínimo
                  </div>
                  {aluno.faixa === 'azul' && (
                    <Toggle label="Campeão mundial faixa azul" checked={form.campeao_mundial_azul} onChange={v => set('campeao_mundial_azul', v)} t={t} />
                  )}
                  {aluno.faixa === 'roxa' && (
                    <Toggle label="Campeão mundial faixa roxa" checked={form.campeao_mundial_roxa} onChange={v => set('campeao_mundial_roxa', v)} t={t} />
                  )}
                  {aluno.faixa === 'marrom' && (
                    <Toggle label="Campeão mundial faixa marrom" checked={form.campeao_mundial_marrom} onChange={v => set('campeao_mundial_marrom', v)} t={t} />
                  )}
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8 }}>
                  Veio de faixa juvenil
                </div>
                <select
                  value={form.veio_de_faixa_juvenil ?? ''}
                  onChange={e => set('veio_de_faixa_juvenil', e.target.value || null)}
                  style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 6, padding: '10px 12px', color: t.text, fontSize: 14, boxSizing: 'border-box' }}
                >
                  <option value="">Nenhuma</option>
                  <option value="azul_juvenil">Azul juvenil</option>
                  <option value="roxa_juvenil">Roxa juvenil</option>
                  <option value="laranja">Laranja</option>
                  <option value="verde">Verde</option>
                </select>
              </div>

              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                  Graduação provisória (art. 7°)
                </div>
                <Toggle
                  label="Sem histórico de faixa documentado"
                  checked={form.status_graduacao === 'provisorio'}
                  onChange={v => setForm(f => ({
                    ...f,
                    status_graduacao: v ? 'provisorio' : 'regular',
                    provisorio_desde: v ? (f.provisorio_desde ?? new Date().toISOString().split('T')[0]) : null,
                  }))}
                  t={t}
                />
                {form.status_graduacao === 'provisorio' && (
                  <>
                    <Field
                      label="Provisório desde" value={form.provisorio_desde ?? ''}
                      onChange={v => set('provisorio_desde', v || null)} type="date" t={t}
                    />
                    {form.provisorio_desde && (
                      <div style={{
                        alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 6,
                        background: t.accentBg, border: `1px solid ${t.accent}`,
                        color: t.accent, fontSize: 12, fontFamily: 'monospace',
                      }}>
                        {diasRestantesProvisorio(form.provisorio_desde)} dias restantes
                      </div>
                    )}
                  </>
                )}
              </div>

              {!professor && (
                <div style={{ marginTop: 12, padding: 12, background: t.surface, borderRadius: 8, border: `1px solid ${t.border}`, color: t.textSub, fontSize: 12 }}>
                  Perfil do professor não encontrado — não é possível validar quem pode assinar esta graduação.
                </div>
              )}
              {professor && faixaAlterada && !aprovacao.ok && (
                <div style={{
                  marginTop: 12, padding: 12, borderRadius: 8,
                  background: t.accentBg, border: `1px solid ${t.accent}`, color: t.accent, fontSize: 12, lineHeight: 1.5,
                }}>
                  ⚠ {aprovacao.motivo}
                </div>
              )}
            </div>
          )}
        </fieldset>

        {erro && (
          <div style={{
            margin: '0 20px', padding: 12, borderRadius: 8,
            background: t.accentBg, border: `1px solid ${t.accent}`,
            color: t.accent, fontSize: 12, lineHeight: 1.5,
          }}>
            ⚠ {erro}
          </div>
        )}

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
          <button
            onClick={handleClose}
            style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', color: t.textSub, cursor: 'pointer', fontSize: 14 }}
          >
            {podeEditar ? 'Cancelar' : 'Fechar'}
          </button>
          {podeEditar && (
            <button
              onClick={handleSave} disabled={saving || (faixaAlterada && !aprovacao.ok)}
              style={{
                flex: 2, padding: 12, borderRadius: 8, border: 'none',
                background: t.accent, color: '#fff', fontWeight: 800, fontSize: 14,
                cursor: saving || (faixaAlterada && !aprovacao.ok) ? 'not-allowed' : 'pointer',
                opacity: saving || (faixaAlterada && !aprovacao.ok) ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {saving ? 'Salvando…' : faixaAlterada && !aprovacao.ok ? 'Grau insuficiente p/ assinar' : 'Salvar alterações'}
            </button>
          )}
        </div>

        {podeEditar && (
          <div style={{ padding: '0 20px 16px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleDelete} disabled={saving}
              style={{
                background: 'none', border: 'none', color: t.textMute,
                fontSize: 12, cursor: saving ? 'not-allowed' : 'pointer',
                textDecoration: 'underline', padding: 4,
              }}
            >
              Apagar aluno
            </button>
          </div>
        )}
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
                  background: form.posicao === p ? t.accentBg : t.surface2,
                  color: form.posicao === p ? t.accent : t.textSub,
                  border: form.posicao === p ? `1px solid ${t.accent}` : `1px solid ${t.border}`,
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
                    background: presentes.includes(a.id) ? t.accentBg : t.surface,
                    border: presentes.includes(a.id) ? `1px solid ${t.accent}` : `1px solid ${t.border}`,
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, border: '2px solid',
                    borderColor: presentes.includes(a.id) ? t.accent : t.border2,
                    background: presentes.includes(a.id) ? t.accent : 'transparent',
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

// ─── Lixeira ─────────────────────────────────────────────────────────────────
type ItemLixeira = {
  tabela: TabelaComLixeira
  id: string
  deleted_at: string
  titulo: string
  detalhe: string
  rotulo: string
}

function Lixeira({ t, onRestaurado }: { t: Theme; onRestaurado: () => Promise<void> }) {
  const [itens, setItens]   = useState<ItemLixeira[] | null>(null)   // null = carregando
  const [erro, setErro]     = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  const carregar = async () => {
    // gte(limite) já descarta no banco o que passou dos 7 dias — expirado não
    // aparece, mesmo com a linha ainda existindo fisicamente
    const limite = limiteLixeira()
    const naLixeira = (q: any) => q.not('deleted_at', 'is', null).gte('deleted_at', limite)

    const [ra, rau, rg] = await Promise.all([
      naLixeira(supabase.from('alunos').select('id,nome,faixa,graus,deleted_at')),
      naLixeira(supabase.from('aulas').select('id,data,tecnica,posicao,deleted_at')),
      naLixeira(supabase.from('graduacoes').select('id,data,faixa_anterior,faixa_nova,graus_anterior,graus_novo,deleted_at,alunos(nome)')),
    ])

    const falha = ra.error ?? rau.error ?? rg.error
    if (falha) { setErro(`Não foi possível carregar a lixeira: ${falha.message}`); setItens([]); return }
    setErro(null)

    const lista: ItemLixeira[] = [
      ...(ra.data ?? []).map((a: any) => ({
        tabela: 'alunos' as const, id: a.id, deleted_at: a.deleted_at, rotulo: 'Aluno',
        titulo: a.nome, detalhe: nomeFaixaExibicao(a.faixa, a.graus),
      })),
      ...(rau.data ?? []).map((a: any) => ({
        tabela: 'aulas' as const, id: a.id, deleted_at: a.deleted_at, rotulo: 'Aula',
        titulo: a.tecnica || 'Aula sem técnica', detalhe: [a.data, a.posicao].filter(Boolean).join(' · '),
      })),
      ...(rg.data ?? []).map((g: any) => ({
        tabela: 'graduacoes' as const, id: g.id, deleted_at: g.deleted_at, rotulo: 'Graduação',
        titulo: `${nomeFaixaExibicao(g.faixa_anterior, g.graus_anterior)} → ${nomeFaixaExibicao(g.faixa_nova, g.graus_novo)}`,
        detalhe: [g.alunos?.nome, g.data].filter(Boolean).join(' · '),
      })),
    ].sort((a, b) => b.deleted_at.localeCompare(a.deleted_at))   // mais recente primeiro

    setItens(lista)
  }

  useEffect(() => { carregar() }, [])

  const restaurar = async (item: ItemLixeira) => {
    setOcupado(item.id)
    const { error } = await restaurarDaLixeira(item.tabela, item.id)
    if (error) {
      setErro(`Não foi possível restaurar "${item.titulo}": ${error.message}`)
      setOcupado(null)
      return
    }
    setErro(null)
    setItens(prev => (prev ?? []).filter(i => i.id !== item.id))
    await onRestaurado()
    setOcupado(null)
  }

  if (itens === null) {
    return <div style={{ color: t.textMute, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Carregando…</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace', lineHeight: 1.6 }}>
        Itens apagados ficam aqui por {DIAS_LIXEIRA} dias e podem ser restaurados.
        Depois disso somem desta tela.
      </div>

      {erro && (
        <div style={{
          padding: 12, borderRadius: 8, background: t.accentBg,
          border: `1px solid ${t.accent}`, color: t.accent, fontSize: 12, lineHeight: 1.5,
        }}>
          ⚠ {erro}
        </div>
      )}

      {itens.length === 0 ? (
        <div style={{
          padding: 24, textAlign: 'center', background: t.surface,
          border: `1px solid ${t.border}`, borderRadius: 10, color: t.textSub, fontSize: 13,
        }}>
          A lixeira está vazia.
        </div>
      ) : itens.map(item => (
        <div key={`${item.tabela}-${item.id}`} style={{
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10,
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: t.textMute, fontSize: 9, fontFamily: 'monospace',
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4,
            }}>
              {item.rotulo}
            </div>
            <div style={{ color: t.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.titulo}</div>
            {item.detalhe && (
              <div style={{ color: t.textSub, fontSize: 12, marginBottom: 4 }}>{item.detalhe}</div>
            )}
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: 'monospace' }}>
              {textoPrazo(item.deleted_at)}
            </div>
          </div>
          <button
            onClick={() => restaurar(item)} disabled={ocupado === item.id}
            style={{
              flexShrink: 0, padding: '9px 14px', borderRadius: 8,
              border: `1px solid ${t.accent}`, background: t.accentBg, color: t.accent,
              fontWeight: 700, fontSize: 12, cursor: ocupado === item.id ? 'not-allowed' : 'pointer',
              opacity: ocupado === item.id ? 0.5 : 1, transition: 'opacity 0.15s',
            }}
          >
            {ocupado === item.id ? '…' : 'Restaurar'}
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── AppShell ────────────────────────────────────────────────────────────────
export default function AppShell({ alunosIniciais, aulasIniciais, professorInicial }: {
  alunosIniciais: any[]; aulasIniciais: any[]; professorInicial: ProfessorPerfil | null
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const t = theme

  const [alunos, setAlunos] = useState<any[]>(alunosIniciais)
  const [aulas, setAulas]   = useState<any[]>(aulasIniciais)
  const [tab, setTab]       = useState<'alunos' | 'aulas' | 'lixeira'>('alunos')
  const [alunoSel, setAlunoSel]   = useState<any | null>(null)
  const [modalAula, setModalAula] = useState(false)
  const [professor, setProfessor] = useState<ProfessorPerfil | null>(professorInicial)
  const [modalProfessor, setModalProfessor] = useState(false)
  const [erroAula, setErroAula] = useState<string | null>(null)
  const [naLixeira, setNaLixeira] = useState(0)

  // Rebusca as listagens ativas com os mesmos filtros da carga inicial. Usado
  // depois de apagar/restaurar: router.refresh() sozinho não resolveria, porque
  // o useState acima só lê as props na montagem e ignora props novas.
  const recarregar = async () => {
    const { alunos: a, aulas: au } = await carregarDados()
    setAlunos(a)
    setAulas(au)
    startTransition(() => router.refresh())
  }

  // Conta o que está na lixeira para o badge da aba. Contagem real em vez de
  // incrementar/decrementar na mão, que dessincroniza na primeira falha.
  const contarLixeira = async () => {
    const limite = limiteLixeira()
    const contar = (tabela: TabelaComLixeira) =>
      supabase.from(tabela).select('id', { count: 'exact', head: true })
        .not('deleted_at', 'is', null).gte('deleted_at', limite)
    const rs = await Promise.all([contar('alunos'), contar('aulas'), contar('graduacoes')])
    setNaLixeira(rs.reduce((soma, r) => soma + (r.count ?? 0), 0))
  }

  useEffect(() => { contarLixeira() }, [])

  const apagarAula = async (aula: any) => {
    if (!window.confirm(`Apagar a aula de ${aula.data}? Ela vai para a lixeira e pode ser restaurada por ${DIAS_LIXEIRA} dias.`)) return
    const { error } = await mandarParaLixeira('aulas', aula.id)
    if (error) { setErroAula(`Não foi possível apagar a aula: ${error.message}`); return }
    setErroAula(null)
    setAulas(prev => prev.filter(a => a.id !== aula.id))
    contarLixeira()
  }

  const novoAluno = async () => {
    const { data, error } = await supabase
      .from('alunos')
      .insert({ nome: 'Novo Aluno', faixa: 'branca', graus: 0, inicio: new Date().toISOString().split('T')[0] })
      .select()
      .single()
    if (error) { alert(`Não foi possível cadastrar o aluno: ${error.message}`); return }
    if (data) setAlunos(prev => [...prev, { ...data, total_presencas: 0, total_aulas: 0 }])
  }

  const aulasEsseMes = aulas.filter((a: any) => a.data?.startsWith(new Date().toISOString().slice(0, 7))).length

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: 'var(--font-body), system-ui, sans-serif', color: t.text, maxWidth: 480, margin: '0 auto' }}>

      {/* Dashboard do Professor */}
      <DashboardProfessor alunos={alunos} aulasEsseMes={aulasEsseMes} onSelectAluno={setAlunoSel} />

      {/* Perfil do professor responsável — sempre visível */}
      {professor && (
        <div style={{ paddingTop: 14 }}>
          <ProfessorCard professor={professor} onClick={() => setModalProfessor(true)} t={t} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}` }}>
        {(['alunos', 'aulas', 'lixeira'] as const).map(tb => {
          // contador só na aba de alunos e na lixeira (esta, só quando tem algo)
          const contagem = tb === 'alunos' ? alunos.length : tb === 'lixeira' ? naLixeira : 0
          return (
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
              {contagem > 0 && (
                <span style={{ marginLeft: 6, fontSize: 11, color: tab === tb ? t.accent : t.textMute, opacity: 0.7 }}>
                  {contagem}
                </span>
              )}
            </button>
          )
        })}
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
            {erroAula && (
              <div style={{
                padding: 12, borderRadius: 8, background: t.accentBg,
                border: `1px solid ${t.accent}`, color: t.accent, fontSize: 12, lineHeight: 1.5,
              }}>
                ⚠ {erroAula}
              </div>
            )}
            {aulas.map((a: any) => (
              <div key={a.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ color: t.text, fontWeight: 700 }}>{a.tecnica || 'Aula'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ color: t.textMute, fontSize: 12, fontFamily: 'monospace' }}>{a.data}</div>
                    <button
                      onClick={() => apagarAula(a)}
                      title="Apagar aula"
                      style={{
                        background: 'none', border: 'none', color: t.textMute,
                        fontSize: 15, cursor: 'pointer', padding: '0 2px', lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {a.posicao && (
                  <div style={{ color: t.accent, fontSize: 12, fontFamily: 'monospace', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {a.posicao}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 4, padding: '3px 8px', fontSize: 12, color: t.textSub }}>
                    {(a.presencas ?? []).filter((p: any) => p.presente).length} presentes
                  </span>
                </div>
                {a.notas && <div style={{ marginTop: 8, color: t.textSub, fontSize: 12, fontStyle: 'italic' }}>{a.notas}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Lixeira */}
        {tab === 'lixeira' && (
          <Lixeira
            t={t}
            onRestaurado={async () => { await recarregar(); await contarLixeira() }}
          />
        )}
      </div>

      {/* FAB — não faz sentido na lixeira */}
      {tab !== 'lixeira' && (
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
      )}

      {/* Modais */}
      {alunoSel && (
        <ModalAluno
          aluno={alunoSel}
          professor={professor}
          onClose={() => setAlunoSel(null)}
          onSave={updated => {
            setAlunos(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a))
            startTransition(() => router.refresh())
          }}
          onDelete={id => {
            setAlunos(prev => prev.filter(a => a.id !== id))
            contarLixeira()
          }}
          onDeleteGraduacao={contarLixeira}
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
      {modalProfessor && professor && (
        <ModalProfessor
          professor={professor}
          onClose={() => setModalProfessor(false)}
          onSave={updated => {
            setProfessor(updated)
            startTransition(() => router.refresh())
          }}
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
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.12s ease, box-shadow 0.1s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      +
    </button>
  )
}
