'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Aluno, Faixa, ProfessorPerfil, TabAluno } from '@/lib/types'
import { nomeFaixaExibicao } from '@/lib/regras-ibjjf'
import { alertaGraduacao, type Alerta } from '@/lib/alertas-graduacao'
import { prontoParaProximoGrau, MESES_ENTRE_GRAUS_PADRAO, PRESENCAS_POR_GRAU_PADRAO } from '@/lib/ritmo-graus'
import { sair } from '@/lib/auth'
import { eventoAtual, inscrever, descartarEvento, type EventoInstalacao } from '@/lib/instalacao'
import { carregarDados, type CargaDados } from '@/lib/carregar-dados'
import { subirFotoAula, removerFotoAula, assinarUrl } from '@/lib/foto-aula'
import DashboardProfessor from '@/components/DashboardProfessor'
import BannerInstalar from '@/components/BannerInstalar'
import { FaixaDefs } from '@/components/FaixaDesenhada'
import { theme, scrim, type Theme } from '@/lib/cores'
import Navegacao from '@/components/Navegacao'
import { definirTema, temaEfetivo, type Tema } from '@/lib/tema'
import { hojeBrasil } from '@/lib/datas'
import { FILTROS_VAZIOS, ehInfantilAluno, type Filtros } from '@/lib/alunos'
import { DIAS_LIXEIRA, mandarParaLixeira, restaurarDaLixeira, limiteLixeira, textoPrazo, type TabelaComLixeira } from '@/lib/lixeira'
import { BeltBadge } from '@/components/comum/BeltBadge'
import { Field } from '@/components/comum/Campos'
import { TelaAlunos } from '@/components/alunos/TelaAlunos'
import { PainelFiltros } from '@/components/alunos/FiltrosAlunos'
import { FichaAluno } from '@/components/alunos/FichaAluno'




const POSITIONS = [
  'Guarda Fechada', 'Meia Guarda', 'Passagem de Guarda', 'Montada',
  'Costas', 'Raspagem', 'Finalização', 'Defesa', 'Leg Locks', 'Berimbolo',
]





// ─── Modal Professor ─────────────────────────────────────────────────────────
function ModalProfessor({ professor, onClose, onSave, t }: {
  professor: ProfessorPerfil; onClose: () => void; onSave: (p: ProfessorPerfil) => void; t: Theme
}) {
  const [graus, setGraus] = useState(professor.graus)
  const [mesesEntreGraus, setMesesEntreGraus] = useState(
    professor.meses_entre_graus ?? MESES_ENTRE_GRAUS_PADRAO
  )
  const [presencasPorGrau, setPresencasPorGrau] = useState(
    professor.presencas_por_grau ?? PRESENCAS_POR_GRAU_PADRAO
  )
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
    // Whitelist explícita de colunas, como em todo update do app.
    const { error } = await supabase
      .from('professor_perfil')
      .update({ graus, meses_entre_graus: mesesEntreGraus, presencas_por_grau: presencasPorGrau })
      .eq('id', professor.id)
    if (error) {
      alert(`Não foi possível salvar o perfil do professor: ${error.message}`)
      setSaving(false)
      return
    }
    onSave({ ...professor, graus, meses_entre_graus: mesesEntreGraus, presencas_por_grau: presencasPorGrau })
    handleClose()
  }

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
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Nome</div>
            <div style={{ color: t.text, fontSize: 14 }}>{professor.nome}</div>
          </div>
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
              Grau na faixa preta (0–9)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Array.from({ length: 10 }, (_, g) => g).map(g => (
                <button key={g} onClick={() => setGraus(g)} style={{
                  width: 40, height: 40, borderRadius: 'var(--r)', cursor: 'pointer', fontWeight: 700,
                  background: graus === g ? t.ativo : t.surface2,
                  color: graus === g ? t.sobreAtivo : t.textMute,
                  border: `1px solid ${t.border}`, fontSize: 14,
                }}>{g}</button>
              ))}
            </div>
            <div style={{ marginTop: 10, color: t.textSub, fontSize: 12, fontFamily: t.ui }}>
              7º = Vermelha e Preta · 8º = Vermelha e Branca · 9º = Vermelha
            </div>
          </div>

          {/* ─── Ritmo de graus — preferência do professor, não regra IBJJF ────
              Mora aqui porque é a tela "do professor", onde ele já vem mexer
              nos próprios dados — o mesmo motivo da sessão logo abaixo. O valor
              é global: é o ritmo de quem gradua, não uma propriedade de quem é
              graduado. Ver lib/ritmo-graus.ts. */}
          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
              Ritmo de graus — sugestão sua
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number" min={1} max={60} inputMode="numeric"
                value={mesesEntreGraus}
                onChange={e => {
                  // Deixa o campo vazio virar o padrão em vez de NaN: o teclado
                  // numérico do celular apaga tudo antes de digitar o novo valor.
                  const n = parseInt(e.target.value, 10)
                  setMesesEntreGraus(Number.isNaN(n) ? MESES_ENTRE_GRAUS_PADRAO : Math.min(60, Math.max(1, n)))
                }}
                style={{
                  width: 80, background: t.inputBg, border: `1px solid ${t.border2}`,
                  borderRadius: 'var(--r)', padding: '10px 12px', color: t.text, fontSize: 16,
                  fontWeight: 700, textAlign: 'center', boxSizing: 'border-box',
                }}
              />
              <span style={{ color: t.textSub, fontSize: 13 }}>meses entre um grau e o próximo</span>
            </div>
            <div style={{ marginTop: 10, color: t.textMute, fontSize: 11, lineHeight: 1.5 }}>
              Só um lembrete de quando o próximo grau poderia sair, no seu ritmo. Não é
              exigência da IBJJF: o art. 4.1.3 deixa o sistema de graus a critério do Professor
              até a faixa marrom. <strong>Não altera</strong> os tempos mínimos de permanência
              por faixa (art. 3.1.3), que são regra da federação. Não se aplica à faixa preta,
              onde os intervalos entre graus são da IBJJF.
            </div>
          </div>

          {/* Critério de presença para o card "Prontos para graduar" — mesma
              natureza do ritmo em meses acima: preferência do professor
              (art. 4.1.3), não regra da IBJJF. Ver lib/ritmo-graus.ts. */}
          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
              Presenças por grau — sugestão sua
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="number" min={1} max={500} inputMode="numeric"
                value={presencasPorGrau}
                onChange={e => {
                  const n = parseInt(e.target.value, 10)
                  setPresencasPorGrau(Number.isNaN(n) ? PRESENCAS_POR_GRAU_PADRAO : Math.min(500, Math.max(1, n)))
                }}
                style={{
                  width: 80, background: t.inputBg, border: `1px solid ${t.border2}`,
                  borderRadius: 'var(--r)', padding: '10px 12px', color: t.text, fontSize: 16,
                  fontWeight: 700, textAlign: 'center', boxSizing: 'border-box',
                }}
              />
              <span style={{ color: t.textSub, fontSize: 13 }}>presenças desde o último grau</span>
            </div>
            <div style={{ marginTop: 10, color: t.textMute, fontSize: 11, lineHeight: 1.5 }}>
              É o critério do card "Prontos para graduar": conta presenças reais desde a
              última graduação registrada (ou desde a matrícula, sem nenhuma). Preferência sua
              (art. 4.1.3) — não é tempo mínimo de permanência por faixa (art. 3.1.3).
            </div>
          </div>

        </div>

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
          <button
            onClick={handleClose}
            style={{ flex: 1, padding: 12, borderRadius: 'var(--r)', border: `1px solid ${t.border}`, background: 'none', color: t.textSub, cursor: 'pointer', fontSize: 14 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: 12, borderRadius: 'var(--r)', border: 'none', background: t.ativo, color: t.sobreAtivo, fontWeight: 800, cursor: 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s' }}
          >
            {saving ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Menu lateral (hambúrguer) ─────────────────────────────────────────────────
// Mesmo padrão de modal dos outros — visible/handleClose com fade de 220ms —
// mas entra pela esquerda (lado do ícone que abre), não de baixo.
//
// Perfil do Professor e Lixeira fecham o menu NA HORA (sem esperar o fade) e
// abrem o próximo — mesmo padrão anti-empilhamento do PainelProntos. Instalar
// e Sair não abrem outro overlay, então usam o handleClose normal (com fade).
function MenuLateral({ naLixeira, onClose, onAbrirPerfil, onAbrirLixeira, t }: {
  naLixeira: number
  onClose: () => void
  onAbrirPerfil: () => void
  onAbrirLixeira: () => void
  t: Theme
}) {
  const [visible, setVisible] = useState(false)
  const [eventoInstalar, setEventoInstalar] = useState<EventoInstalacao | null>(null)
  const [saindo, setSaindo] = useState(false)
  // Apelido, não o e-mail inteiro: é o que o professor digita no login
  // (LoginGate monta apelido@graumestre.app) — o domínio é só identificador,
  // não recebe e-mail de verdade.
  const [apelido, setApelido] = useState<string | null>(null)
  // O tema vale desde o primeiro frame (script no <head>, lib/tema.ts); aqui só
  // se lê qual é para escrevê-lo no item e alternar.
  const [tema, setTema] = useState<Tema>('claro')
  useEffect(() => { setTema(temaEfetivo()) }, [])
  const alternarTema = () => {
    const proximo: Tema = tema === 'escuro' ? 'claro' : 'escuro'
    definirTema(proximo)
    setTema(proximo)
  }

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user.email ?? null
      setApelido(email ? email.split('@')[0] : null)
    })
  }, [])

  // Mesmo padrão do BannerInstalar: assina lib/instalacao.ts por conta
  // própria. A captura do beforeinstallprompt começa cedo, no layout — aqui
  // só se lê o que já foi capturado (ver CLAUDE.md / lib/instalacao.ts).
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    setEventoInstalar(eventoAtual())
    return inscrever(setEventoInstalar)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  const instalarApp = async () => {
    if (!eventoInstalar) return
    await eventoInstalar.prompt()
    await eventoInstalar.userChoice
    descartarEvento()
    handleClose()
  }

  // Não precisa fechar o menu nem trocar de tela na mão: o onAuthStateChange
  // do LoginGate derruba o app inteiro e monta a tela de login.
  const handleSair = async () => {
    setSaindo(true)
    const { error } = await sair()
    if (error) {
      alert(`Não foi possível sair: ${error.message}`)
      setSaindo(false)
    }
  }

  const ItemMenu = ({ label, badge, lado, onClick }: { label: string; badge?: number; lado?: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '14px 20px', background: 'none', border: 'none',
        borderBottom: `1px solid ${t.border}`, color: t.text, fontSize: 14, fontWeight: 600,
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span>{label}</span>
      {lado && <span style={{ color: t.textMute, fontSize: 12, fontWeight: 400 }}>{lado}</span>}
      {!!badge && (
        <span style={{
          background: t.ativo, color: t.sobreAtivo, fontSize: 11, fontWeight: 800,
          borderRadius: 999, padding: '2px 7px', minWidth: 18, textAlign: 'center',
        }}>
          {badge}
        </span>
      )}
    </button>
  )

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: scrim(visible),
        display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start',
        transition: 'background 0.22s',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.bg, width: 280, maxWidth: '80vw', height: '100%',
          borderRight: `1px solid ${t.border}`,
          display: 'flex', flexDirection: 'column',
          transform: visible ? 'translateX(0)' : 'translateX(-100%)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s ease, opacity 0.22s ease',
        }}
      >
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>Menu</div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ItemMenu label="Perfil do Professor" onClick={() => { onClose(); onAbrirPerfil() }} />
          <ItemMenu label="Lixeira" badge={naLixeira} onClick={() => { onClose(); onAbrirLixeira() }} />
          {eventoInstalar && <ItemMenu label="Instalar no celular" onClick={instalarApp} />}
          <ItemMenu label={`Tema: ${tema === 'escuro' ? 'kimono preto' : 'kimono branco'}`} lado="trocar" onClick={alternarTema} />
        </div>

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}` }}>
          {apelido && (
            <div style={{ color: t.textMute, fontSize: 12, marginBottom: 10 }}>
              Conectado como <span style={{ color: t.textSub }}>{apelido}</span>
            </div>
          )}
          <button
            onClick={handleSair} disabled={saindo}
            style={{
              width: '100%', padding: 12, borderRadius: 'var(--r)',
              border: `1px solid ${t.border2}`, background: 'none', color: t.textSub,
              fontSize: 14, cursor: saindo ? 'not-allowed' : 'pointer',
              opacity: saindo ? 0.6 : 1, transition: 'opacity 0.15s',
            }}
          >
            {saindo ? 'Saindo…' : 'Sair da conta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Painel de prontos (sininho) ──────────────────────────────────────────────
// Mesmo padrão de bottom sheet dos outros modais — visible/handleClose com
// fade de 220ms — porque é um modal como os outros, só que lista em vez de
// formulário. `itens` já vem filtrado (sem null) por quem chama.
//
// Selecionar um aluno fecha o painel NA HORA (sem esperar o fade) e abre o
// modal dele — mesmo padrão que ModalAula usa ao entregar para <Chamada />
// (`setModalAula(false); setChamadaAula(aula)`), para não empilhar dois
// overlays.
function PainelProntos({ itens, presencasPorGrau, onClose, onSelect, t }: {
  itens: { aluno: any; alerta: NonNullable<Alerta> }[]
  presencasPorGrau: number
  onClose: () => void
  onSelect: (aluno: any) => void
  t: Theme
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
          maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s ease, opacity 0.22s ease',
        }}
      >
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>Prontos para graduar</div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        {/* Estado vazio é obrigatório, não é ausência de UI: sem ele o sininho
            que abre e não mostra nada volta a parecer decoração — o problema
            que esta etapa existe para resolver. */}
        {itens.length === 0 ? (
          <div style={{ padding: 20, color: t.textSub, fontSize: 13, lineHeight: 1.6 }}>
            Nenhum aluno com {presencasPorGrau} presenças desde o último grau. O app conta a partir das aulas lançadas na chamada.
          </div>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {itens.map(({ aluno, alerta }) => {
              // Evidência abaixo do motivo — não é barra de progresso, é a
              // justificativa de quem já está na lista. Grau: presença contra
              // o critério do professor. Faixa: só chega aqui com tempo
              // mínimo da IBJJF e idade já validados (ver alertaGraduacao()).
              const evidencia = alerta.tipo === 'grau'
                ? (() => {
                    const p = prontoParaProximoGrau(aluno, presencasPorGrau)
                    return `${p.presencas} de ${p.necessarias} presenças desde o último grau`
                  })()
                : 'Tempo mínimo da faixa cumprido'

              return (
                <div
                  key={aluno.id}
                  onClick={() => onSelect(aluno)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 8px', borderRadius: 'var(--r)', cursor: 'pointer',
                    background: t.surface, border: `1px solid ${t.border}`,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    overflow: 'hidden', background: t.surface2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${t.border}`,
                  }}>
                    {/* referrerPolicy: foto é URL externa colada à mão — sem isto o
                        host dela recebe o endereço do app a cada carregamento */}
                    {aluno.foto_url
                      ? <img src={aluno.foto_url} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 15, fontWeight: 900, color: t.textSub, fontFamily: t.ui }}>{aluno.nome[0]}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: t.text, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                      {aluno.nome}
                    </div>
                    <div style={{ marginBottom: 4 }}><BeltBadge faixa={aluno.faixa} graus={aluno.graus} infantil={ehInfantilAluno(aluno)} size="sm" t={t} /></div>
                    <div style={{ color: t.alertaTexto, fontWeight: 700, fontSize: 12 }}>{alerta.msg}</div>
                    <div style={{ color: t.textMute, fontSize: 11 }}>{evidencia}</div>
                  </div>
                  <span style={{ color: t.textMute, fontSize: 20, flexShrink: 0 }}>›</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


// ─── Validação do link da gravação ───────────────────────────────────────────
// Campo opcional: vazio nunca é erro, porque o link só existe depois que o
// professor grava e sobe o vídeo. Preenchido, exige uma URL http(s) de um
// domínio do YouTube — errar o link é pior do que não ter link, já que o card
// passa a exibir um "Assistir aula" que não leva a lugar nenhum.
const HOSTS_YOUTUBE = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'studio.youtube.com']

function validarLinkYoutube(valor: string): string | null {
  const limpo = valor.trim()
  if (!limpo) return null

  let url: URL
  try {
    url = new URL(limpo)
  } catch {
    return 'O link precisa ser uma URL completa, começando com https://'
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'O link precisa começar com http:// ou https://'
  }
  if (!HOSTS_YOUTUBE.includes(url.hostname.toLowerCase())) {
    return 'O link precisa ser do YouTube (youtube.com ou youtu.be).'
  }
  return null
}

// Extrai o id do vídeo para montar a miniatura (Etapa 6) — nunca lança.
// `studio.youtube.com` passa em validarLinkYoutube() (está em
// HOSTS_YOUTUBE) mas não tem id extraível no mesmo formato: cai no `return
// null` final, e quem chama trata isso como "sem miniatura, mostra o botão
// de texto", nunca como erro.
function extrairIdYoutube(link: string): string | null {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase()
  if (host === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] ?? null
  }
  if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') return url.searchParams.get('v')
    const partes = url.pathname.split('/').filter(Boolean)
    if (partes[0] === 'shorts' || partes[0] === 'embed') return partes[1] ?? null
  }
  return null
}

// ─── Foto da aula (com reassinatura) ─────────────────────────────────────────
// A URL assinada vence em 1h (VALIDADE_URL_SEGUNDOS). A imagem já pintada
// continua na tela depois disso — o que expira é o direito de baixar de novo —,
// mas se o app ficar aberto e o browser descartar a imagem do cache, o próximo
// pedido leva 403 e a foto some sem explicação. Aqui o `onError` assina de novo
// e repõe.
//
// O anti-loop é o par onError/onLoad: uma tentativa por exibição bem-sucedida.
// Objeto que sumiu de vez do bucket erra, tenta uma vez, erra de novo e para —
// nunca dispara onLoad, então nunca rearma. Rearmar no onLoad, e não quando a
// prop muda, é o que evita o ciclo em que a URL renovada realimenta a tentativa.
function FotoAula({ path, url, onUrlRenovada, style, t }: {
  path: string | null
  url: string | null
  onUrlRenovada?: (url: string) => void
  style: React.CSSProperties
  t: Theme
}) {
  const [src, setSrc] = useState(url)
  const [falhou, setFalhou] = useState(false)
  const jaTentou = useRef(false)

  useEffect(() => { setSrc(url); setFalhou(false) }, [url])

  const renovar = async () => {
    if (jaTentou.current || !path) { setFalhou(true); return }
    jaTentou.current = true
    const nova = await assinarUrl(path)
    if (!nova) { setFalhou(true); return }
    setSrc(nova)
    onUrlRenovada?.(nova)
  }

  // Caixa no lugar da imagem em vez de ícone quebrado: some a dúvida entre
  // "esta aula não tem foto" e "a foto não carregou agora".
  if (falhou || !src) {
    return (
      <div style={{
        ...style,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: t.surface2, color: t.textMute, fontSize: 11, textAlign: 'center',
        padding: 8, boxSizing: 'border-box',
      }}>
        Não foi possível carregar a foto agora.
      </div>
    )
  }

  return (
    <img
      src={src} alt="" referrerPolicy="no-referrer" style={style}
      onError={renovar}
      onLoad={() => { jaTentou.current = false }}
    />
  )
}

// ─── Miniatura do vídeo da aula (Etapa 6) ─────────────────────────────────────
// Mesmo padrão do FotoAula acima: cai de volta num estado visível em vez de
// deixar retângulo quebrado ou uma miniatura minúscula sem sentido. Aqui o
// "de volta" é o botão de texto que o card já usava antes desta etapa. `id`
// pode ser `null` (link válido pelo validador mas sem id extraível —
// studio.youtube.com, por exemplo) e cai no mesmo botão.
//
// ⚠ Vídeo privado/removido NÃO dá erro de rede — `i.ytimg.com` devolve
// HTTP 200 com uma imagem de placeholder 120×90 (bem menor que os 480×360
// do hqdefault.jpg de verdade). `onError` nunca dispara nesse caso; quem
// pega isso é o `onLoad`, comparando `naturalWidth`/`naturalHeight` da
// imagem carregada contra o tamanho do placeholder. Confirmado testando
// contra vídeo privado de verdade — não "simular" com id inventado de novo
// achando que vai reproduzir (um id que nunca existiu costuma dar o mesmo
// placeholder, mas o teste que importa é com vídeo privado/removido real).
const LARGURA_PLACEHOLDER_YOUTUBE = 120
const ALTURA_PLACEHOLDER_YOUTUBE = 90

function MiniaturaYoutube({ id, link, style, t }: {
  id: string | null; link: string; style: React.CSSProperties; t: Theme
}) {
  const [falhou, setFalhou] = useState(false)

  if (!id || falhou) {
    return (
      <a
        href={link} target="_blank" rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{
          ...style,
          background: t.ativoBg, border: `1px solid ${t.ativo}`,
          color: t.ativo, fontWeight: 700, fontSize: 12, textDecoration: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}
      >
        ▶ Assistir aula
      </a>
    )
  }

  return (
    <a
      href={link} target="_blank" rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{ ...style, position: 'relative', display: 'block', overflow: 'hidden' }}
    >
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt="" referrerPolicy="no-referrer"
        onError={() => setFalhou(true)}
        // Vídeo privado/removido: HTTP 200 com o placeholder 120×90 do
        // YouTube, não erro de rede — só o onLoad + naturalWidth pega isso.
        onLoad={e => {
          const img = e.currentTarget
          if (img.naturalWidth === LARGURA_PLACEHOLDER_YOUTUBE && img.naturalHeight === ALTURA_PLACEHOLDER_YOUTUBE) {
            setFalhou(true)
          }
        }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* ▶ sobreposto: lado a lado e do mesmo tamanho da foto da aula, sem
          isto as duas imagens ficam indistinguíveis — só descobriria qual é
          o vídeo tocando, o toque desperdiçado que este app evita. */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          // cor-ok: ▶ sobre a miniatura do vídeo; independe do tema
          width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 0, height: 0, marginLeft: 3,
            borderTop: '7px solid transparent', borderBottom: '7px solid transparent',
            // cor-ok: triângulo do ▶ sobre a miniatura
            borderLeft: '11px solid #fff',
          }} />
        </div>
      </div>
    </a>
  )
}

// ─── Modal Aula (criar e editar) ─────────────────────────────────────────────
// Só os dados da aula. A chamada não vive aqui: ao criar, o botão grava a aula
// e entrega o registro pronto para o AppShell abrir a <Chamada />. Sem aula
// gravada não existe aula_id, e sem aula_id a presença não teria onde ser
// salva a cada toque.
//
// Com `aula` preenchida vira edição: mesmos campos, update em vez de insert, e
// nenhuma presença é tocada. É o caminho para cadastrar o link do YouTube
// depois, que é como acontece na prática — grava a aula, sobe o vídeo, e só
// então tem link para colar.
function ModalAula({ aula, onClose, onCriada, onEditada, onFotoAlterada, t }: {
  aula?: any; onClose: () => void; onCriada: (aula: any) => void; onEditada: (aula: any) => void;
  // Avisa a lista que a foto mudou, SEM fechar o modal. Não dá para reusar
  // onEditada aqui: ela desmonta o modal, e o professor que acabou de escolher
  // uma foto ainda está no meio da edição.
  onFotoAlterada?: (aulaId: string, fotoPath: string | null, fotoUrl: string | null) => void;
  t: Theme
}) {
  const editando = !!aula
  const [form, setForm]   = useState({
    data:         aula?.data         ?? hojeBrasil(),
    tecnica:      aula?.tecnica      ?? '',
    posicao:      aula?.posicao      ?? '',
    notas:        aula?.notas        ?? '',
    link_youtube: aula?.link_youtube ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [erro, setErro]   = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const set    = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // Foto vive fora de `form` de propósito: ela é gravada na hora do upload, não
  // no "Salvar alterações". Misturá-la ao form sugeriria que ela espera o botão.
  const [fotoPath, setFotoPath] = useState<string | null>(aula?.foto_path ?? null)
  const [fotoUrl, setFotoUrl]   = useState<string | null>(aula?.foto_url ?? null)
  const [fotoOcupada, setFotoOcupada] = useState(false)
  const [erroFoto, setErroFoto] = useState<string | null>(null)
  const inputFoto = useRef<HTMLInputElement>(null)

  const escolherFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    // Zera o input no fim: sem isso, escolher o MESMO arquivo de novo depois de
    // um erro não dispara change, e a tela parece travada.
    e.target.value = ''
    if (!arquivo || !aula) return

    setFotoOcupada(true)
    setErroFoto(null)
    try {
      const r = await subirFotoAula(aula.id, arquivo, fotoPath)
      setFotoPath(r.foto_path)
      setFotoUrl(r.foto_url)
      onFotoAlterada?.(aula.id, r.foto_path, r.foto_url)
    } catch (err) {
      setErroFoto(err instanceof Error ? err.message : String(err))
    }
    setFotoOcupada(false)
  }

  const apagarFoto = async () => {
    if (!aula || !fotoPath) return
    if (!window.confirm('Remover a foto desta aula? Isso não tem lixeira — o arquivo é apagado de vez.')) return

    setFotoOcupada(true)
    setErroFoto(null)
    try {
      await removerFotoAula(aula.id, fotoPath)
      setFotoPath(null)
      setFotoUrl(null)
      onFotoAlterada?.(aula.id, null, null)
    } catch (err) {
      setErroFoto(err instanceof Error ? err.message : String(err))
    }
    setFotoOcupada(false)
  }

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  const handleSave = async () => {
    const linkInvalido = validarLinkYoutube(form.link_youtube)
    if (linkInvalido) {
      setErro(linkInvalido)
      return
    }
    setSaving(true)

    // Whitelist explícita das colunas de `aulas` — mesmo motivo da edição de
    // aluno: campo que não é coluna derruba a request inteira (PGRST204). Vale
    // dobrado aqui, porque o objeto da aula que vem da listagem carrega
    // `presencas` embutido, que não é coluna.
    const payload = {
      data:         form.data,
      tecnica:      form.tecnica || null,
      posicao:      form.posicao || null,
      notas:        form.notas   || null,
      link_youtube: form.link_youtube.trim() || null,
      // O caminho, nunca a URL: `foto_url` é derivada (assinada no
      // carregamento) e mandá-la aqui derrubaria a request com PGRST204.
      // Redundante com o update que o upload já fez — de propósito, para o
      // payload continuar sendo a lista completa das colunas que este modal
      // controla, e não uma lista que esconde uma exceção.
      foto_path:    fotoPath,
    }

    const { data: salva, error } = editando
      ? await supabase.from('aulas').update(payload).eq('id', aula.id).select().single()
      : await supabase.from('aulas').insert(payload).select().single()

    if (error) {
      setErro(`Não foi possível ${editando ? 'salvar' : 'criar'} a aula: ${error.message}`)
      setSaving(false)
      return
    }
    // foto_url não volta do banco (é derivada), então vai junto daqui — senão a
    // lista perderia a URL assinada e o card ficaria sem miniatura até recarregar.
    editando ? onEditada({ ...salva, foto_url: fotoUrl }) : onCriada(salva)
    handleClose()
  }

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
          maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.22s ease, opacity 0.22s ease',
        }}
      >
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>{editando ? 'Editar Aula' : 'Registrar Aula'}</div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Data" value={form.data} onChange={v => set('data', v)} type="date" t={t} />
          <Field label="Técnica ensinada" value={form.tecnica} onChange={v => set('tecnica', v)} placeholder="Ex: Triângulo, Kimura..." t={t} />
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Posição</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {POSITIONS.map(p => (
                <button key={p} onClick={() => set('posicao', p)} style={{
                  padding: '6px 10px', borderRadius: 'var(--r)', fontSize: 12, cursor: 'pointer',
                  background: form.posicao === p ? t.ativoBg : t.surface2,
                  color: form.posicao === p ? t.ativo : t.textSub,
                  border: form.posicao === p ? `1px solid ${t.ativo}` : `1px solid ${t.border}`,
                }}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <Field
              label="Link do YouTube (opcional)"
              value={form.link_youtube}
              onChange={v => set('link_youtube', v)}
              type="url"
              placeholder="https://youtu.be/..."
              t={t}
            />
            <div style={{ color: t.textMute, fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
              Para quem faltou assistir depois. Pode deixar vazio agora e colar o link
              aqui quando a gravação subir.
              <br />
              Use &quot;Não listado&quot;. Vídeo &quot;Privado&quot; não gera miniatura nem abre para o aluno.
            </div>
          </div>

          {/* Foto da aula — só depois que a aula existe, porque o arquivo é
              guardado numa pasta com o id dela. Mesma lógica do link do
              YouTube: registra a aula agora, sobe a foto quando der, sem prazo. */}
          {editando && (
            <div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
                Foto da aula
              </div>

              {/* Sem `capture`: com ele o Android abre direto a câmera e tira a
                  galeria da jogada. Sem ele o próprio sistema oferece as duas,
                  que é o que o professor precisa para subir foto de outro dia. */}
              <input
                ref={inputFoto} type="file" accept="image/*"
                onChange={escolherFoto} style={{ display: 'none' }}
              />

              {/* A condição é `fotoPath`, não `fotoUrl`: a URL é derivada e pode
                  falhar sozinha. Ramificar por ela faria uma aula COM foto
                  aparecer como "adicionar foto" num tropeço de assinatura — e
                  deixaria o botão Remover inalcançável justamente aí. */}
              {fotoPath ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <FotoAula
                    path={fotoPath} url={fotoUrl} onUrlRenovada={setFotoUrl} t={t}
                    style={{
                      width: '100%', height: 220, objectFit: 'cover',
                      borderRadius: 'var(--r)', border: `1px solid ${t.border}`,
                      opacity: fotoOcupada ? 0.5 : 1, transition: 'opacity 0.15s',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => inputFoto.current?.click()} disabled={fotoOcupada}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 'var(--r)', fontSize: 13,
                        background: t.surface2, color: t.textSub,
                        border: `1px solid ${t.border}`, cursor: fotoOcupada ? 'default' : 'pointer',
                      }}
                    >
                      {fotoOcupada ? 'Enviando…' : 'Trocar foto'}
                    </button>
                    <button
                      onClick={apagarFoto} disabled={fotoOcupada}
                      style={{
                        padding: '10px 12px', borderRadius: 'var(--r)', fontSize: 13,
                        background: 'none', color: t.erroTexto,
                        border: `1px solid ${t.erro}`, cursor: fotoOcupada ? 'default' : 'pointer',
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => inputFoto.current?.click()} disabled={fotoOcupada}
                  style={{
                    width: '100%', padding: '22px 12px', borderRadius: 'var(--r)',
                    background: t.surface, color: fotoOcupada ? t.textMute : t.textSub,
                    border: `1px dashed ${t.border2}`, cursor: fotoOcupada ? 'default' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  {fotoOcupada ? 'Enviando…' : '＋ Adicionar foto da turma'}
                </button>
              )}

              {erroFoto && (
                <div style={{
                  marginTop: 8, padding: 10, borderRadius: 'var(--r)', background: t.erroBg,
                  border: `1px solid ${t.erro}`, color: t.erroTexto, fontSize: 12, lineHeight: 1.5,
                }}>
                  ⚠ {erroFoto}
                </div>
              )}

              <div style={{ color: t.textMute, fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
                Uma foto por aula. Sobe na hora ou dias depois, sem prazo — e é salva
                assim que você escolhe, sem esperar o botão abaixo.
              </div>
            </div>
          )}
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Observações</div>
            <textarea
              value={form.notas} onChange={e => set('notas', e.target.value)}
              placeholder="Anotações gerais sobre a aula..."
              style={{ width: '100%', minHeight: 80, background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 'var(--r)', padding: 10, color: t.text, fontSize: 16, resize: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {erro && (
            <div style={{
              padding: 12, borderRadius: 'var(--r)', background: t.erroBg,
              border: `1px solid ${t.erro}`, color: t.erroTexto, fontSize: 12, lineHeight: 1.5,
            }}>
              ⚠ {erro}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleClose}
              style={{ flex: 1, padding: 12, borderRadius: 'var(--r)', border: `1px solid ${t.border}`, background: 'none', color: t.textSub, cursor: 'pointer', fontSize: 14 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave} disabled={saving}
              style={{ flex: 2, padding: 12, borderRadius: 'var(--r)', border: 'none', background: t.ativo, color: t.sobreAtivo, fontWeight: 800, cursor: 'pointer', fontSize: 14, opacity: saving ? 0.7 : 1, transition: 'opacity 0.15s' }}
            >
              {editando
                ? (saving ? 'Salvando…' : 'Salvar alterações')
                : (saving ? 'Criando…'  : 'Iniciar chamada →')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Chamada ─────────────────────────────────────────────────────────────────
// Hoje quem lança presença é sempre o professor. Quando o aluno tiver login e
// confirmar a própria presença, só este literal muda para 'aluno' na chamada
// dele — o formato do registro já comporta os dois casos, e a decisão de QUEM
// pode gravar continua fora daqui (RLS/papel). Ver 006_presenca_autoria.sql.
const CONFIRMADO_POR_PROFESSOR = 'professor'

// Whitelist explícita das colunas de `presencas` — mesmo padrão do update de
// aluno, nada derivado entra no payload.
function payloadPresenca(aulaId: string, alunoId: string, presente: boolean) {
  return {
    aula_id:        aulaId,
    aluno_id:       alunoId,
    presente,
    confirmado_por: CONFIRMADO_POR_PROFESSOR,
    confirmado_em:  new Date().toISOString(),
  }
}

// upsert em vez de insert/update: o unique(aula_id, aluno_id) da 001 resolve o
// conflito sozinho, então marcar e desmarcar o mesmo aluno à vontade nunca
// duplica linha nem exige um select antes para saber se já existe.
function gravarPresencas(registros: ReturnType<typeof payloadPresenca>[]) {
  return supabase.from('presencas').upsert(registros, { onConflict: 'aula_id,aluno_id' })
}

// Tela cheia, uma linha por aluno, um toque alterna presente/ausente e grava na
// hora. Sem botão "Salvar" de propósito: professor no tatame com o celular na
// mão sai da tela a qualquer momento, e o que já foi tocado tem que estar no
// banco. Desmarcar é update de `presente` para false, nunca delete — o registro
// de que o aluno não veio naquele dia também é histórico.
function Chamada({ aula, alunos, onClose, t }: {
  aula: any; alunos: any[]; onClose: () => void; t: Theme
}) {
  // null = ainda carregando o que já está gravado para esta aula
  const [presentes, setPresentes] = useState<Record<string, boolean> | null>(null)
  const [busca, setBusca]   = useState('')
  const [erro, setErro]     = useState<string | null>(null)
  const [salvando, setSalvando] = useState<Set<string>>(new Set())
  const [visible, setVisible]   = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  // Estado inicial vem do banco, não da memória: reabrir a chamada da mesma
  // aula tem que mostrar exatamente o que foi gravado antes.
  useEffect(() => {
    let cancelado = false
    ;(async () => {
      const { data, error } = await supabase
        .from('presencas')
        .select('aluno_id, presente')
        .eq('aula_id', aula.id)
      if (cancelado) return
      if (error) {
        setErro(`Não foi possível carregar a chamada: ${error.message}`)
        setPresentes({})
        return
      }
      const mapa: Record<string, boolean> = {}
      for (const p of data ?? []) mapa[p.aluno_id] = p.presente
      setPresentes(mapa)
    })()
    return () => { cancelado = true }
  }, [aula.id])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  const termo = busca.trim().toLowerCase()
  const visiveis = termo ? alunos.filter(a => a.nome.toLowerCase().includes(termo)) : alunos
  const totalPresentes = presentes ? alunos.filter(a => presentes[a.id]).length : 0

  const marcarSalvando = (ids: string[], ativo: boolean) =>
    setSalvando(prev => {
      const proximo = new Set(prev)
      for (const id of ids) ativo ? proximo.add(id) : proximo.delete(id)
      return proximo
    })

  // Otimista: pinta antes de gravar e desfaz se o banco recusar, para a tela
  // nunca mostrar presença que não foi salva de verdade.
  const alternar = async (alunoId: string) => {
    if (!presentes) return
    const anterior = presentes[alunoId] ?? false
    const novo = !anterior

    setPresentes(p => ({ ...p!, [alunoId]: novo }))
    marcarSalvando([alunoId], true)

    const { error } = await gravarPresencas([payloadPresenca(aula.id, alunoId, novo)])

    marcarSalvando([alunoId], false)
    if (error) {
      setPresentes(p => ({ ...p!, [alunoId]: anterior }))
      const nome = alunos.find(a => a.id === alunoId)?.nome ?? 'aluno'
      setErro(`Não foi possível salvar a presença de ${nome}: ${error.message}`)
      return
    }
    setErro(null)
  }

  // Age sobre a lista visível: com busca ativa, marcar quem está fora da tela
  // seria uma surpresa ruim. Sem busca, é a turma inteira.
  const marcarTodos = async () => {
    if (!presentes) return
    const alvos = visiveis.filter(a => !presentes[a.id])
    if (alvos.length === 0) return

    const anterior = { ...presentes }
    setPresentes(p => {
      const proximo = { ...p! }
      for (const a of alvos) proximo[a.id] = true
      return proximo
    })
    const ids = alvos.map(a => a.id)
    marcarSalvando(ids, true)

    const { error } = await gravarPresencas(alvos.map(a => payloadPresenca(aula.id, a.id, true)))

    marcarSalvando(ids, false)
    if (error) {
      setPresentes(anterior)
      setErro(`Não foi possível marcar todos: ${error.message}`)
      return
    }
    setErro(null)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 120,
      background: t.bg,
      display: 'flex', flexDirection: 'column',
      opacity: visible ? 1 : 0, transition: 'opacity 0.22s ease',
    }}>
      {/* Cabeçalho fixo: contador ao vivo + busca sempre à mão */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>Chamada</div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, marginTop: 2 }}>
              {[aula.data, aula.tecnica].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer', padding: 4, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ color: t.ativo, fontWeight: 800, fontSize: 22, fontFamily: t.ui }}>
            {totalPresentes}
          </div>
          <div style={{ color: t.textSub, fontSize: 13 }}>de {alunos.length} presentes</div>
          <button
            onClick={marcarTodos}
            style={{
              marginLeft: 'auto', padding: '8px 12px', borderRadius: 'var(--r)',
              border: `1px solid ${t.ativo}`, background: t.ativoBg, color: t.ativo,
              fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0,
            }}
          >
            Marcar todos
          </button>
        </div>

        <input
          value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome…"
          style={{
            width: '100%', background: t.inputBg, border: `1px solid ${t.border2}`,
            borderRadius: 'var(--r)', padding: '10px 12px', color: t.text, fontSize: 16,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {erro && (
        <div style={{
          margin: '12px 16px 0', padding: 12, borderRadius: 'var(--r)', background: t.erroBg,
          border: `1px solid ${t.erro}`, color: t.erroTexto, fontSize: 12, lineHeight: 1.5, flexShrink: 0,
        }}>
          ⚠ {erro}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {presentes === null ? (
          <div style={{ color: t.textMute, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Carregando…</div>
        ) : visiveis.length === 0 ? (
          <div style={{
            padding: 24, textAlign: 'center', background: t.surface,
            border: `1px solid ${t.border}`, borderRadius: 'var(--r)', color: t.textSub, fontSize: 13,
          }}>
            Nenhum aluno com esse nome.
          </div>
        ) : visiveis.map(a => {
          const presente = presentes[a.id] ?? false
          const emVoo = salvando.has(a.id)
          return (
            <div
              key={a.id} onClick={() => alternar(a.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 'var(--r)', cursor: 'pointer',
                background: presente ? t.ativoBg : t.surface,
                border: presente ? `1px solid ${t.ativo}` : `1px solid ${t.border}`,
                opacity: emVoo ? 0.6 : 1,
                transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
                background: t.surface2, border: `1px solid ${t.border}`, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {a.foto_url
                  ? <img src={a.foto_url} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 16, fontWeight: 900, color: t.textSub, fontFamily: t.ui }}>{a.nome[0]}</span>
                }
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: t.text, fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{a.nome}</div>
                <BeltBadge faixa={a.faixa} graus={a.graus} infantil={ehInfantilAluno(a)} size="sm" t={t} />
              </div>

              <div style={{
                width: 28, height: 28, borderRadius: '50%', border: '2px solid',
                borderColor: presente ? t.ativo : t.border2,
                background: presente ? t.ativo : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, color: t.sobreAtivo, flexShrink: 0,
                transition: 'background 0.15s, border-color 0.15s',
              }}>
                {presente ? '✓' : ''}
              </div>
            </div>
          )
        })}
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

function Lixeira({ t, onRestaurado, onVoltar }: { t: Theme; onRestaurado: () => Promise<void>; onVoltar: () => void }) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Cabeçalho próprio: sem a aba destacada acima (a barra só mostra
          ALUNOS/AULAS), nada mais na tela diria "você está na lixeira" nem
          "como sair daqui". A linha inteira é tocável, mesmo peso do ✕ dos
          modais — voltar para Alunos é o caminho óbvio. */}
      <button
        onClick={onVoltar}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', padding: '4px 0 8px', margin: 0,
          color: t.text, fontWeight: 800, fontSize: 16, cursor: 'pointer',
          textAlign: 'left', width: '100%',
        }}
      >
        <span style={{ color: t.textMute, fontSize: 18 }}>‹</span> Lixeira
      </button>

      {itens === null ? (
        <div style={{ color: t.textMute, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Carregando…</div>
      ) : (
        <>
      <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, lineHeight: 1.6 }}>
        Itens apagados ficam aqui por {DIAS_LIXEIRA} dias e podem ser restaurados.
        Depois disso somem desta tela.
      </div>

      {erro && (
        <div style={{
          padding: 12, borderRadius: 'var(--r)', background: t.erroBg,
          border: `1px solid ${t.erro}`, color: t.erroTexto, fontSize: 12, lineHeight: 1.5,
        }}>
          ⚠ {erro}
        </div>
      )}

      {itens.length === 0 ? (
        <div style={{
          padding: 24, textAlign: 'center', background: t.surface,
          border: `1px solid ${t.border}`, borderRadius: 'var(--r)', color: t.textSub, fontSize: 13,
        }}>
          A lixeira está vazia.
        </div>
      ) : itens.map(item => (
        <div key={`${item.tabela}-${item.id}`} style={{
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: 'var(--r)',
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: t.textMute, fontSize: 9, fontFamily: t.ui,
              textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4,
            }}>
              {item.rotulo}
            </div>
            <div style={{ color: t.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.titulo}</div>
            {item.detalhe && (
              <div style={{ color: t.textSub, fontSize: 12, marginBottom: 4 }}>{item.detalhe}</div>
            )}
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui }}>
              {textoPrazo(item.deleted_at)}
            </div>
          </div>
          <button
            onClick={() => restaurar(item)} disabled={ocupado === item.id}
            style={{
              flexShrink: 0, padding: '9px 14px', borderRadius: 'var(--r)',
              border: `1px solid ${t.ativo}`, background: t.ativoBg, color: t.ativo,
              fontWeight: 700, fontSize: 12, cursor: ocupado === item.id ? 'not-allowed' : 'pointer',
              opacity: ocupado === item.id ? 0.5 : 1, transition: 'opacity 0.15s',
            }}
          >
            {ocupado === item.id ? '…' : 'Restaurar'}
          </button>
        </div>
      ))}
        </>
      )}
    </div>
  )
}

type FichaAberta = { id: string; origem: 'alunos' | 'fora'; aba: TabAluno }

// ─── AppShell ────────────────────────────────────────────────────────────────
// Sem props de dados: a carga inteira acontece aqui, no cliente, ao montar.
// Antes vinha pronta do server component, mas com a RLS exigindo
// `authenticated` o servidor busca sem sessão e recebe vazio — o token do
// professor vive no browser. Ver app/page.tsx e 009_rls_authenticated.sql.
export default function AppShell() {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const t = theme

  const [alunos, setAlunos] = useState<any[]>([])
  const [aulas, setAulas]   = useState<any[]>([])
  const [carregandoDados, setCarregandoDados] = useState(true)
  // Dois erros separados porque têm consequências diferentes: o de dados
  // significa "a lista pode estar velha", o de perfil significa "a validação de
  // quem pode assinar graduação está fora do ar". Juntar os dois numa string só
  // faria um sumir quando o outro aparecesse.
  const [erroCarga, setErroCarga] = useState<string | null>(null)
  const [erroPerfil, setErroPerfil] = useState<string | null>(null)
  const [retentando, setRetentando] = useState(false)
  const [tab, setTab]       = useState<'inicio' | 'alunos' | 'aulas' | 'lixeira'>('inicio')
  // Ficha aberta: guardamos o ID (e a origem e a aba), não o objeto. O objeto é
  // lido da lista a cada render, então a recarga depois de graduar chega na
  // ficha aberta, e um aluno apagado some da tela sozinho.
  const [ficha, setFicha] = useState<FichaAberta | null>(null)
  const [modalAula, setModalAula] = useState(false)
  // aula cuja chamada está aberta — recém-criada pelo modal ou reaberta pelo card
  const [chamadaAula, setChamadaAula] = useState<any | null>(null)
  // aula aberta no modal de edição pelo ✎ do card
  const [aulaEdicao, setAulaEdicao] = useState<any | null>(null)
  const [professor, setProfessor] = useState<ProfessorPerfil | null>(null)
  const [modalProfessor, setModalProfessor] = useState(false)
  const [painelProntos, setPainelProntos] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [filtroAberto, setFiltroAberto] = useState(false)
  const [erroAula, setErroAula] = useState<string | null>(null)
  const [naLixeira, setNaLixeira] = useState(0)
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS)
  // Busca por nome da tela de Alunos: mora aqui (como os filtros) para
  // sobreviver à troca de aba.
  const [buscaAluno, setBuscaAluno] = useState('')

  // Critério de presença deste professor para "pronto para o próximo grau" —
  // único ponto de leitura, thread-ado para todo call site de alertaGraduacao
  // (LinhaAluno, aplicarFiltros, DashboardProfessor, PainelProntos) para todos
  // lerem o mesmo número. Perfil ausente cai no padrão de lib/ritmo-graus.ts.
  const presencasPorGrau = professor?.presencas_por_grau ?? PRESENCAS_POR_GRAU_PADRAO


  // Lista de prontos, computada uma vez aqui — o badge do sininho
  // (DashboardProfessor) recebe só a contagem, e o painel do sininho
  // (PainelProntos, montado lá embaixo com os outros modais) recebe a lista
  // inteira. Etapa 2: a lista saiu da home, mas continua a mesma função.
  const prontos = alunos
    .map(aluno => ({ aluno, alerta: alertaGraduacao(aluno, aluno.ultima_graduacao_data ?? null, presencasPorGrau) }))
    .filter((x): x is { aluno: any; alerta: NonNullable<Alerta> } => x.alerta !== null)

  // Aplica uma carga na tela.
  //
  // A regra que importa está no ramo de erro: o que já está na tela FICA. Uma
  // rede instável no tatame não pode transformar a turma inteira em "nenhum
  // aluno" — visualmente isso é idêntico a uma exclusão em massa, e o professor
  // não tem como saber a diferença. Melhor dado velho com aviso do que tela
  // vazia sem aviso.
  //
  // A exceção é a primeira carga, quando não há nada a preservar: aí vale
  // mostrar o que veio, que pode ser parcial — as três queries são
  // independentes e uma pode ter passado enquanto as outras falhavam.
  const aplicarCarga = (carga: CargaDados) => {
    if (!carga.erro) {
      setAlunos(carga.alunos)
      setAulas(carga.aulas)
      setErroCarga(null)
      return
    }
    setAlunos(prev => (prev.length > 0 ? prev : carga.alunos))
    setAulas(prev => (prev.length > 0 ? prev : carga.aulas))
    setErroCarga(carga.erro)
  }

  // Rebusca as listagens ativas com os mesmos filtros da carga inicial. Usado
  // depois de apagar/restaurar e na montagem.
  const recarregar = async () => {
    aplicarCarga(await carregarDados())
    startTransition(() => router.refresh())
  }

  // Carga inicial. Só roda dentro do LoginGate, então a sessão já existe e as
  // policies deixam passar. O professor vem junto: é ele que valida quem pode
  // assinar graduação.
  useEffect(() => {
    let vivo = true
    ;(async () => {
      const [carga, perfil] = await Promise.all([
        carregarDados(),
        supabase.from('professor_perfil').select('*').single(),
      ])
      if (!vivo) return
      aplicarCarga(carga)
      setProfessor(perfil.data ?? null)
      // Perfil ausente não impede usar o app — só a validação de assinatura
      // depende dele —, então o erro é informativo e não bloqueia a tela.
      setErroPerfil(perfil.error ? `Não foi possível carregar o perfil do professor: ${perfil.error.message}` : null)
      setCarregandoDados(false)
    })()
    return () => { vivo = false }
  }, [])

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

  // Ponto único de abertura da ficha do aluno: quem não pede aba cai em
  // 'perfil'. Sem isso a aba escolhida por uma abertura anterior sobreviveria
  // para a próxima, porque a aba é estado do AppShell, não da ficha. `origem`
  // diz de onde veio o toque (a tela de Alunos ou o Início/Graduar) — a G5.4 usa.
  const abrirAluno = (aluno: any, aba: TabAluno = 'perfil', origem: FichaAberta['origem'] = 'alunos') => {
    // tocar de novo no aluno que já está aberto não faz nada (nem pergunta)
    if (ficha && ficha.id === aluno.id && ficha.aba === aba && ficha.origem === origem) return
    if (!confirmarDescarte()) return
    setFicha({ id: aluno.id, aba, origem })
  }

  const alunoAberto = ficha ? alunos.find(a => a.id === ficha.id) ?? null : null

  // A ficha avisa (onAlteradoMudou) se há alteração não salva. Com o painel
  // fixo ao lado da tabela, a navegação fica à vista: trocar de aluno ou de
  // tela passa por esta pergunta, ou o que foi digitado se perderia sem aviso.
  const fichaAlterada = useRef(false)
  useEffect(() => { if (!ficha) fichaAlterada.current = false }, [ficha])
  const confirmarDescarte = () =>
    !ficha || !fichaAlterada.current ||
    window.confirm(`Descartar as alterações em ${alunoAberto?.nome ?? 'este aluno'}?`)

  // Troca de tela: fecha a ficha (depois da pergunta, se houver alteração).
  const irPara = (aba: typeof tab) => {
    if (!confirmarDescarte()) return
    setFicha(null)
    setTab(aba)
  }
  // aluno apagado (ou sumido da lista): a ficha não pode ficar aberta sobre nada
  useEffect(() => { if (ficha && !alunoAberto) setFicha(null) }, [ficha, alunoAberto])

  const apagarAula = async (aula: any) => {
    if (!window.confirm(`Apagar a aula de ${aula.data}? Ela vai para a lixeira e pode ser restaurada por ${DIAS_LIXEIRA} dias.`)) return
    const { error } = await mandarParaLixeira('aulas', aula.id)
    if (error) { setErroAula(`Não foi possível apagar a aula: ${error.message}`); return }
    setErroAula(null)
    setAulas(prev => prev.filter(a => a.id !== aula.id))
    contarLixeira()
  }

  const novoAluno = async () => {
    if (!confirmarDescarte()) return
    const { data, error } = await supabase
      .from('alunos')
      .insert({ nome: 'Novo Aluno', faixa: 'branca', graus: 0, inicio: hojeBrasil() })
      .select()
      .single()
    if (error) { alert(`Não foi possível cadastrar o aluno: ${error.message}`); return }
    if (data) {
      setAlunos(prev => [...prev, { ...data, total_presencas: 0, total_aulas: 0, presencas_desde_graduacao: 0, aulas_desde_graduacao: 0, aulas_perdidas: 0 }])
      // Um toque a menos: a ficha do aluno recém-criado já abre, para dar o
      // nome na hora em vez de caçar "Novo Aluno" na lista.
      setFicha({ id: data.id, aba: 'perfil', origem: 'alunos' })
    }
  }

  // Só as aulas já dadas: uma lançada para o fim do mês ainda não conta.
  const hoje = hojeBrasil()
  const aulasEsseMes = aulas.filter((a: any) => a.data?.startsWith(hoje.slice(0, 7)) && a.data <= hoje).length

  // Sem isto o dashboard pisca com 0 alunos e 0% de frequência antes da carga
  // chegar, o que parece uma academia vazia em vez de uma tela carregando.
  if (carregandoDados) {
    return (
      <div style={{
        background: t.bg, minHeight: '100vh', color: t.textMute,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: t.ui, fontSize: 13,
      }}>
        Carregando…
      </div>
    )
  }

  // A ficha do aluno aberta. Origem 'alunos': vai para a vaga ao lado da
  // tabela; 'fora' (Início, Graduar): painel por cima, na raiz.
  const fichaEl = ficha && alunoAberto ? (
    <FichaAluno
      key={`${ficha.id}-${ficha.origem}-${ficha.aba}`}
      aluno={alunoAberto}
      professor={professor}
      presencasPorGrau={presencasPorGrau}
      origem={ficha.origem}
      onAlteradoMudou={alterado => { fichaAlterada.current = alterado }}
      onClose={() => setFicha(null)}
      onSave={updated => {
        setAlunos(prev => prev.map(a => a.id === updated.id ? { ...a, ...updated } : a))
        startTransition(() => router.refresh())
      }}
      onDelete={id => {
        setAlunos(prev => prev.filter(a => a.id !== id))
        contarLixeira()
      }}
      // A gravação já está no banco; recarregar traz o histórico novo, o selo
      // PRONTO recalculado pela view e o badge da lixeira certo.
      onGraduacaoMudou={async () => { await recarregar(); await contarLixeira() }}
      tabInicial={ficha.aba}
      t={t}
    />
  ) : null

  return (
    <div className="app" style={{ fontFamily: t.ui, color: t.text }}>
      <Navegacao
        atual={tab} onIr={irPara}
        onGraduar={() => setPainelProntos(true)} onMais={() => setMenuAberto(true)}
        qtdProntos={prontos.length}
      />
      <main className={`conteudo${tab === 'alunos' ? ' larga' : ''}`}>

      {/* Gradientes + trama da faixa desenhada — declarados UMA VEZ aqui,
          referenciados por url(#id) em toda faixa da tela. Monta um <svg>
          0×0 fora do fluxo; a posição na árvore não importa. */}
      <FaixaDefs />

      {/* Convite para instalar. É position:fixed, então a posição aqui na
          árvore não importa — fica no topo só para não se perder no meio. */}
      <BannerInstalar />

      {/* Início: o painel com frequência, distribuição e destaques. Era a
          cabeça da tela de Alunos; virou aba própria (G3.3). */}
      {tab === 'inicio' && (
        <DashboardProfessor
          alunos={alunos} aulasEsseMes={aulasEsseMes} qtdProntos={prontos.length}
          onAbrirProntos={() => setPainelProntos(true)}
          onSelectAluno={(aluno, aba) => abrirAluno(aluno, aba, 'fora')}
        />
      )}

      {(tab === 'alunos' || tab === 'aulas') && (
        <header className="topo">
          <h1>{tab === 'alunos' ? 'Alunos' : 'Aulas'}</h1>
          <span className="sub">{tab === 'alunos' ? `${alunos.length} alunos` : `${aulas.length} aulas`}</span>
          {tab === 'alunos' && (
            <span className="acoes-topo">
              <button type="button" className="al-btn cheio al-novo" onClick={novoAluno}>+ Novo aluno</button>
            </span>
          )}
        </header>
      )}

      {/* Falha de carga: o aviso é obrigatório justamente porque a lista
          continua na tela. Sem ele o professor veria dado velho achando que é
          o atual. Com "Tentar de novo" à mão, porque a causa mais comum é
          rede que já voltou. */}
      {erroCarga && (
        <div style={{
          margin: '14px 16px 0', padding: 12, borderRadius: 'var(--r)', background: t.erroBg,
          border: `1px solid ${t.erro}`, color: t.erroTexto, fontSize: 12, lineHeight: 1.5,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>⚠ {erroCarga}</div>
          <button
            onClick={async () => {
              setRetentando(true)
              await recarregar()
              setRetentando(false)
            }}
            disabled={retentando}
            style={{
              flexShrink: 0, padding: '6px 10px', borderRadius: 'var(--r)',
              border: `1px solid ${t.erro}`, background: 'transparent',
              color: t.erroTexto, fontSize: 11, fontWeight: 700,
              cursor: retentando ? 'not-allowed' : 'pointer', opacity: retentando ? 0.6 : 1,
            }}
          >
            {retentando ? 'Tentando…' : 'Tentar de novo'}
          </button>
        </div>
      )}

      {erroPerfil && (
        <div style={{
          margin: '14px 16px 0', padding: 12, borderRadius: 'var(--r)', background: t.erroBg,
          border: `1px solid ${t.erro}`, color: t.erroTexto, fontSize: 12, lineHeight: 1.5,
        }}>
          ⚠ {erroPerfil}
        </div>
      )}

      {/* Conteúdo */}
      <div className="area">

        {tab === 'alunos' && (
          <TelaAlunos
            alunos={alunos} filtros={filtros} setFiltros={setFiltros}
            busca={buscaAluno} setBusca={setBuscaAluno}
            presencasPorGrau={presencasPorGrau} idAberto={ficha?.id ?? null}
            onAbrir={aluno => abrirAluno(aluno)} onAbrirFiltros={() => setFiltroAberto(true)}
            ficha={ficha?.origem === 'alunos' ? fichaEl : null}
          />
        )}

        {/* Lista de aulas */}
        {tab === 'aulas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {erroAula && (
              <div style={{
                padding: 12, borderRadius: 'var(--r)', background: t.erroBg,
                border: `1px solid ${t.erro}`, color: t.erroTexto, fontSize: 12, lineHeight: 1.5,
              }}>
                ⚠ {erroAula}
              </div>
            )}
            {aulas.map((a: any) => {
              // Calculado uma vez por card: usado para decidir se a
              // miniatura entra na linha de imagens (2 casos: sem link
              // nenhum, ou link válido mas sem id extraível — studio.youtube.com
              // ou algo fora dos formatos cobertos) e para montar a própria
              // miniatura, sem repetir a extração.
              const idYoutube = a.link_youtube ? extrairIdYoutube(a.link_youtube) : null
              return (
              // card inteiro abre a chamada daquela aula — sem botão extra
              <div
                key={a.id} onClick={() => setChamadaAula(a)}
                style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 'var(--r)', padding: 16, cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ color: t.text, fontWeight: 700 }}>{a.tecnica || 'Aula'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ color: t.textMute, fontSize: 12, fontFamily: t.ui }}>{a.data}</div>
                    <button
                      // stopPropagation em todos os controles do card: o toque no
                      // card em si segue reservado para abrir a chamada
                      onClick={e => { e.stopPropagation(); setAulaEdicao(a) }}
                      title="Editar aula"
                      style={{
                        background: 'none', border: 'none', color: t.textMute,
                        fontSize: 14, cursor: 'pointer', padding: '0 2px', lineHeight: 1,
                      }}
                    >
                      ✎
                    </button>
                    {/* Alvo de 44×44 (mínimo de toque), mas com margens negativas:
                        a área cresce para dentro do padding do card — que é
                        espaço morto — em vez de aumentar a altura da linha. O
                        glifo continua do mesmo tamanho e na mesma posição.
                        marginLeft afasta do ✎; o resto do card abre a chamada, e
                        errar o toque aqui já apagou aula em teste real. */}
                    <button
                      onClick={e => { e.stopPropagation(); apagarAula(a) }}
                      title="Apagar aula"
                      style={{
                        background: 'none', border: 'none', color: t.textMute,
                        fontSize: 15, cursor: 'pointer', padding: 0, lineHeight: 1,
                        width: 44, height: 44,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: -14, marginBottom: -14, marginRight: -10, marginLeft: 4,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {a.posicao && (
                  <div style={{ color: t.textSub, fontSize: 12, fontFamily: t.ui, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {a.posicao}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 'var(--r)', padding: '3px 8px', fontSize: 12, color: t.textSub }}>
                    {(a.presencas ?? []).filter((p: any) => p.presente).length} presentes
                  </span>
                </div>
                {/* Foto + miniatura do vídeo, lado a lado (Etapa 6). Foto à
                    esquerda (não muda de lugar), miniatura à direita (a
                    novidade); cada uma ocupa a linha inteira quando é a
                    única. Sem nenhuma das duas, nada ocupa este espaço —
                    mesmo princípio de sempre, nada de placeholder. */}
                {(a.foto_path || a.link_youtube) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    {a.foto_path && (
                      <FotoAula
                        path={a.foto_path} url={a.foto_url} t={t}
                        // guarda a URL renovada na lista: sem isto o próximo render
                        // do card voltaria à URL vencida e erraria de novo
                        onUrlRenovada={nova =>
                          setAulas(prev => prev.map(x => x.id === a.id ? { ...x, foto_url: nova } : x))
                        }
                        style={{
                          flex: 1, minWidth: 0, height: 110, objectFit: 'cover',
                          borderRadius: 'var(--r)', border: `1px solid ${t.border}`, display: 'block',
                        }}
                      />
                    )}
                    {/* `idYoutube` pode ser null aqui (studio.youtube.com, ou
                        qualquer formato fora dos cobertos) — MiniaturaYoutube
                        trata isso como o mesmo botão de texto do onError,
                        nunca deixa a linha com buraco do lado da foto. */}
                    {a.link_youtube && (
                      <MiniaturaYoutube
                        id={idYoutube} link={a.link_youtube} t={t}
                        style={{ flex: 1, minWidth: 0, height: 110, borderRadius: 'var(--r)', border: `1px solid ${t.border}` }}
                      />
                    )}
                  </div>
                )}
                {a.notas && <div style={{ marginTop: 8, color: t.textSub, fontSize: 12, fontStyle: 'italic' }}>{a.notas}</div>}
              </div>
              )
            })}
          </div>
        )}

        {/* Lixeira */}
        {tab === 'lixeira' && (
          <Lixeira
            t={t}
            onRestaurado={async () => { await recarregar(); await contarLixeira() }}
            onVoltar={() => setTab('alunos')}
          />
        )}
      </div>

      </main>

      {/* FAB — só onde há o que criar: Alunos e Aulas. No Início e na lixeira
          não há (no Início o "+" abriria uma aula, o que ninguém espera). */}
      {(tab === 'alunos' || tab === 'aulas') && (
        <div className={`fab-area${tab === 'alunos' ? ' so-celular' : ''}`}>
          <FabButton
            onClick={tab === 'alunos' ? novoAluno : () => setModalAula(true)}
            t={t}
          />
        </div>
      )}

      {/* Modais */}
      {ficha?.origem === 'fora' && fichaEl}
      {modalAula && (
        <ModalAula
          onClose={() => setModalAula(false)}
          // aula criada: o modal sai e a chamada dela entra, sem passo intermediário
          onCriada={aula => { setModalAula(false); setChamadaAula(aula) }}
          onEditada={() => {}}
          t={t}
        />
      )}
      {aulaEdicao && (
        <ModalAula
          aula={aulaEdicao}
          onClose={() => setAulaEdicao(null)}
          onCriada={() => {}}
          onEditada={atualizada => {
            // preserva `presencas`, que vem do join da listagem e não volta no update
            setAulas(prev => prev.map(a => a.id === atualizada.id ? { ...a, ...atualizada } : a))
            setAulaEdicao(null)
            startTransition(() => router.refresh())
          }}
          // A foto é gravada no momento do upload, então a lista precisa
          // acompanhar sem esperar o "Salvar alterações" — e sem fechar o modal.
          onFotoAlterada={(id, foto_path, foto_url) => {
            setAulas(prev => prev.map(a => a.id === id ? { ...a, foto_path, foto_url } : a))
          }}
          t={t}
        />
      )}
      {chamadaAula && (
        <Chamada
          aula={chamadaAula}
          alunos={alunos}
          onClose={async () => {
            setChamadaAula(null)
            // recarrega para o card da aula refletir o novo total de presentes
            await recarregar()
          }}
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
      {painelProntos && (
        <PainelProntos
          itens={prontos}
          presencasPorGrau={presencasPorGrau}
          onClose={() => setPainelProntos(false)}
          // Fecha o painel na hora e abre o modal na aba de graduação — sem
          // empilhar overlays, mesmo padrão do ModalAula → Chamada.
          onSelect={aluno => { setPainelProntos(false); abrirAluno(aluno, 'graduação', 'fora') }}
          t={t}
        />
      )}
      {menuAberto && (
        <MenuLateral
          naLixeira={naLixeira}
          onClose={() => setMenuAberto(false)}
          onAbrirPerfil={() => { setMenuAberto(false); setModalProfessor(true) }}
          onAbrirLixeira={() => { setMenuAberto(false); irPara('lixeira') }}
          t={t}
        />
      )}
      {filtroAberto && (
        <PainelFiltros
          alunos={alunos} filtros={filtros} setFiltros={setFiltros}
          presencasPorGrau={presencasPorGrau}
          onClose={() => setFiltroAberto(false)}
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
        background: t.ativo, color: t.sobreAtivo, border: 'none',
        borderRadius: '50%', width: 56, height: 56,
        fontSize: 28, cursor: 'pointer', fontWeight: 900,
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
