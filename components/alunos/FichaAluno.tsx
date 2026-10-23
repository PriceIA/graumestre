'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Aluno, Graduacao, ProfessorPerfil, TabAluno } from '@/lib/types'
import {
  professorPodeAssinar, tipoAprovacaoGraduacao,
  calcularIdade, calcularCategoria, ehInfantil,
  grausMaximos, nomeFaixaExibicao,
  anosNaFaixaAtual, prontoParaProximaFaixa, podeProximoGrauPreta,
} from '@/lib/regras-ibjjf'
import { alertaGraduacao } from '@/lib/alertas-graduacao'
import { estaAfastado, motivoAfastamento, AULAS_PARA_AFASTADO } from '@/lib/afastamento'
import { payloadAluno, validarAluno, alunoAlterado, type AlunoFicha } from '@/lib/alunos'
import { mandarParaLixeira, DIAS_LIXEIRA } from '@/lib/lixeira'
import { hojeBrasil } from '@/lib/datas'
import { FaixaDesenhada } from '@/components/FaixaDesenhada'
import { FreqBar } from '@/components/comum/FreqBar'
import { Field, Toggle } from '@/components/comum/Campos'
import { AbaGraduacao } from '@/components/alunos/AbaGraduacao'
import type { Theme } from '@/lib/cores'

const TABS: TabAluno[] = ['perfil', 'frequência', 'notas', 'graduação']

// ─── Ficha do aluno ──────────────────────────────────────────────────────────
// Folha que sobe e cobre a tela (celular). Quatro abas — Perfil, Frequência,
// Notas, Graduação —, rodapé fixo com Cancelar e Salvar. Era o ModalAluno.
export function FichaAluno({ aluno, professor, presencasPorGrau, origem, onAlteradoMudou, onClose, onSave, onDelete, onGraduacaoMudou, t, podeEditar = true, tabInicial = 'perfil' }: {
  aluno: AlunoFicha
  professor: ProfessorPerfil | null
  // o mesmo número que alimenta o selo da lista e o painel de prontos
  presencasPorGrau: number
  // De onde veio o toque. 'alunos': a ficha mora ao lado da tabela (computador)
  // ou cobre a tela (celular). 'fora': veio do Início ou do Graduar e entra como
  // painel pela direita por cima da tela em que o professor estava.
  origem: 'alunos' | 'fora'
  // avisa o AppShell se há alteração não salva, para ele perguntar antes de
  // trocar de aluno ou de tela (o painel fixo deixa a navegação à vista)
  onAlteradoMudou: (alterado: boolean) => void
  onClose: () => void; onSave: (a: Aluno) => void; onDelete: (id: string) => void
  // avisa o AppShell que o histórico de graduações mudou (gravou ou apagou):
  // ele recarrega a lista do banco, que é a fonte única — o selo PRONTO, o
  // histórico e o badge da lixeira dependem disso
  onGraduacaoMudou: () => void
  t: Theme
  // Hoje é sempre true (app single-user, só o professor usa). Fica preparado
  // para quando o aluno puder logar e ver o próprio perfil em modo leitura.
  podeEditar?: boolean
  // Aba já aberta ao montar. Quem chega pelo painel de prontos vem para
  // graduar — passar pelo perfil primeiro seria toque desperdiçado.
  tabInicial?: TabAluno
}) {
  const [form, setForm]   = useState<AlunoFicha>({ ...aluno })
  const [tab, setTab]     = useState<TabAluno>(tabInicial)
  const [saving, setSaving] = useState(false)
  const [erro, setErro]   = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  // cópia local do histórico para o ✕ sumir na hora, sem esperar recarga
  const [historico, setHistorico] = useState<Graduacao[]>(aluno.historico_graduacoes ?? [])
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const folha = useRef<HTMLDivElement>(null)

  // Validação de quem pode assinar (art. 6°, 7.3, 7.4, 7.4.1) — só entra em
  // jogo quando a faixa está de fato mudando nesta edição.
  const faixaAlterada = form.faixa !== aluno.faixa
  const tipoAprovacao = tipoAprovacaoGraduacao(form.faixa, form.status_graduacao)
  const aprovacao: { ok: boolean; motivo?: string } = professor && faixaAlterada
    ? professorPodeAssinar(professor, tipoAprovacao)
    : { ok: true }
  const bloqueado = faixaAlterada && !aprovacao.ok

  // Idade/categoria (art. 2.2.1). Sem data de nascimento nada disso existe: a
  // ficha não inventa idade nem categoria.
  const idade     = form.data_nascimento ? calcularIdade(form.data_nascimento) : null
  const categoria = form.data_nascimento ? calcularCategoria(form.data_nascimento) : null
  const infantilAluno = form.data_nascimento ? ehInfantil(form.data_nascimento) : false
  const maxGrausFaixa = grausMaximos(form.faixa, infantilAluno)
  const ultimaGraduacaoData = aluno.ultima_graduacao_data ?? null

  // Selos: o que o professor precisa olhar. Lidos do aluno SALVO (não do form):
  // são fatos do banco, não do que está sendo digitado.
  const alerta = alertaGraduacao(aluno, ultimaGraduacaoData, presencasPorGrau)
  const afastado = estaAfastado(aluno)

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  const alterado = podeEditar && alunoAlterado(aluno, form)
  useEffect(() => { onAlteradoMudou(alterado) }, [alterado])  // eslint-disable-line react-hooks/exhaustive-deps

  // Foco na folha ao abrir: leitor de tela e teclado começam dentro dela.
  useEffect(() => { folha.current?.focus() }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  // Cancelar, ✕ e Esc: com alteração não salva, pergunta antes — um toque sem
  // querer no tatame não pode jogar fora o que foi digitado.
  const pedirFechar = () => {
    if (podeEditar && !saving && alunoAlterado(aluno, form) &&
        !window.confirm(`Descartar as alterações em ${aluno.nome}?`)) return
    handleClose()
  }

  useEffect(() => {
    const aoApertar = (e: KeyboardEvent) => { if (e.key === 'Escape') pedirFechar() }
    document.addEventListener('keydown', aoApertar)
    return () => document.removeEventListener('keydown', aoApertar)
  })

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
    onGraduacaoMudou()
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
      // A ficha continua aberta de propósito: o professor não perde o que digitou.
      setErro(`Não foi possível salvar as alterações: ${error.message}`)
      setSaving(false)
      return
    }

    // Registra o histórico sempre que faixa ou grau mudam (mesmo grau dentro
    // da mesma faixa), para dataInicioFaixaAtual() ter uma data real a usar.
    let novaUltimaGraduacao = ultimaGraduacaoData
    if (form.faixa !== aluno.faixa || form.graus !== aluno.graus) {
      const hoje = hojeBrasil()
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
        // a ficha aberta para o professor poder tentar o histórico de novo.
        onSave({ ...form, nome: payload.nome as string, ultima_graduacao_data: novaUltimaGraduacao } as Aluno)
        setErro(`Os dados do aluno foram salvos, mas não foi possível registrar o histórico de graduação: ${gradErr.message}. Tente salvar novamente.`)
        setSaving(false)
        return
      }
      novaUltimaGraduacao = hoje
      onGraduacaoMudou()
    }

    onSave({ ...form, nome: payload.nome as string, ultima_graduacao_data: novaUltimaGraduacao } as Aluno)
    handleClose()
  }

  const totalPresencas = form.total_presencas ?? 0
  const totalAulas = form.total_aulas ?? 0

  return (
    <div className={`ficha-raiz ${origem === 'fora' ? 'fora' : 'fixa'}`}>
    {/* Pano escuro só no painel que vem por cima (computador); toque nele fecha */}
    <div className={`ficha-scrim${visible ? ' aberto' : ''}`} onClick={pedirFechar} aria-hidden="true" />
    <div
      ref={folha} tabIndex={-1} role="dialog" aria-modal={origem === 'fora' ? true : undefined} aria-label={`Ficha de ${aluno.nome}`}
      className={`ficha${visible ? ' aberta' : ''}`}
    >
      <div className="ficha-rolagem">
        <div className="ficha-topo">
          {form.data_nascimento
            ? <span className="al-etq contorno">{categoria} · {idade} anos</span>
            : <span className="al-etq contorno">Sem data de nascimento</span>}
          <button type="button" className="ficha-fechar" aria-label="Fechar" onClick={pedirFechar}>
            <X aria-hidden="true" />
          </button>
        </div>

        <h2 className="ficha-nome">{form.nome || 'Sem nome'}</h2>

        {(alerta || afastado) && (
          <div className="ficha-selos">
            {alerta && <span className="al-etq alerta">{alerta.tipo === 'grau' ? 'Pronto p/ grau' : 'Pronto p/ faixa'}</span>}
            {afastado && <span className="al-etq alerta-contorno">Afastado</span>}
          </div>
        )}
        {alerta && <p className="ficha-motivo">{alerta.msg}</p>}

        <div className="ficha-quadro">
          <FaixaDesenhada faixa={form.faixa} graus={form.graus} max={maxGrausFaixa} size="md" />
          <div className="rot">Faixa {nomeFaixaExibicao(form.faixa, form.graus)} · {form.graus} de {maxGrausFaixa} graus</div>
        </div>

        <div className="ficha-abas" role="tablist" aria-label="Seções da ficha">
          {TABS.map(tb => (
            <button
              key={tb} type="button" role="tab" id={`aba-${tb}`} aria-selected={tab === tb} aria-controls="ficha-painel"
              className="ficha-aba" onClick={() => setTab(tb)}
            >
              {tb}
            </button>
          ))}
        </div>

        {/* A rolagem mora na .ficha-rolagem, não no <fieldset>: no Chrome o
            conteúdo de um fieldset com overflow vazava dos limites dele e era
            pintado por cima do rodapé (reproduzido em 2026-10-23, G5.2). O
            fieldset desabilita de uma vez todos os campos quando !podeEditar;
            as abas ficam de fora e continuam navegáveis. */}
        <fieldset disabled={!podeEditar} className="ficha-campos" id="ficha-painel" role="tabpanel" aria-labelledby={`aba-${tab}`}>
          {tab === 'perfil' && (
            <div className="ficha-conteudo">
              <Field label="Nome" value={form.nome} onChange={v => set('nome', v)} />
              <div className="ficha-duplo">
                <Field
                  label="Nascimento" value={form.data_nascimento ?? ''}
                  onChange={v => set('data_nascimento', v || null)} type="date"
                />
                <Field label="Início no jiu-jítsu" value={form.inicio} onChange={v => set('inicio', v)} type="date" />
              </div>
              {form.data_nascimento && (
                <dl className="ficha-duplo">
                  <div className="ficha-dado"><dt>Idade</dt><dd>{idade} anos</dd></div>
                  <div className="ficha-dado"><dt>Categoria</dt><dd>{categoria}</dd></div>
                </dl>
              )}
              <Field label="Instagram" value={form.instagram ?? ''} onChange={v => set('instagram', v)} />
              <Field label="Foto URL" value={form.foto_url ?? ''} onChange={v => set('foto_url', v)} placeholder="https://..." />

              {/* Três estados numa tela só: o toggle liga/desliga o override, e
                  o link ao lado devolve a decisão para o cálculo automático. */}
              <div className="fi-grupo" style={{ marginTop: 0 }}>
                <div className="fi-rot" style={{ margin: 0 }}>Situação</div>
                <Toggle
                  label="Afastado"
                  checked={form.afastado_manual ?? estaAfastado({ ...form, aulas_perdidas: aluno.aulas_perdidas })}
                  onChange={v => set('afastado_manual', v)}
                />
                <div className="fi-nota" style={{ margin: 0 }}>
                  {form.afastado_manual === null || form.afastado_manual === undefined
                    ? `Automático: ${motivoAfastamento({ ...form, aulas_perdidas: aluno.aulas_perdidas, ultima_presenca_data: aluno.ultima_presenca_data }) ?? `menos de ${AULAS_PARA_AFASTADO} aulas perdidas seguidas`}.`
                    : (
                      <>
                        Definido manualmente como {form.afastado_manual ? 'afastado' : 'ativo'}.{' '}
                        <button type="button" className="ficha-link" onClick={() => set('afastado_manual', null)}>
                          Voltar ao automático
                        </button>
                      </>
                    )}
                </div>
              </div>

              <div className="fi-grupo" style={{ marginTop: 0 }}>
                <div className="fi-rot" style={{ margin: 0 }}>Histórico de graduações</div>
                {historico.length === 0 ? (
                  <div className="fi-apoio" style={{ fontStyle: 'italic' }}>Nenhuma graduação registrada ainda.</div>
                ) : (
                  historico.map(g => (
                    <div key={g.id} className="ficha-hist">
                      <div className="ficha-hist-linha">
                        <span className="ficha-hist-faixa">
                          {nomeFaixaExibicao(g.faixa_anterior, g.graus_anterior)} → {nomeFaixaExibicao(g.faixa_nova, g.graus_novo)}
                        </span>
                        <span className="ficha-hist-data">{g.data}</span>
                        <button
                          type="button" className="ficha-hist-x" title="Apagar graduação" aria-label="Apagar graduação"
                          onClick={() => handleDeleteGraduacao(g)}
                        >
                          <X aria-hidden="true" />
                        </button>
                      </div>
                      <div className="fi-apoio">{g.graus_anterior}º → {g.graus_novo}º grau</div>
                    </div>
                  ))
                )}
              </div>

              {podeEditar && (
                <button type="button" className="ficha-apagar" onClick={handleDelete} disabled={saving}>
                  Apagar aluno
                </button>
              )}
            </div>
          )}

          {tab === 'frequência' && (
            <div className="ficha-conteudo">
              <FreqBar presencas={totalPresencas} totalAulas={totalAulas} t={t} />
              <div className="fi-apoio">{totalPresencas} presenças de {totalAulas} aulas registradas</div>
              <div className="fi-bloco" style={{ margin: 0 }}>
                Para registrar presença, abra a aula na aba Aulas — ou crie uma no "+" — e faça a chamada.
              </div>
            </div>
          )}

          {tab === 'notas' && (
            <label className="cp-campo">
              <span className="cp-rotulo">Observações do professor</span>
              <textarea
                className="cp-input ficha-notas" value={form.notas ?? ''} onChange={e => set('notas', e.target.value)}
                placeholder="Anote evolução, pontos de atenção..."
              />
            </label>
          )}

          {tab === 'graduação' && (
            <AbaGraduacao
              aluno={aluno} form={form} setForm={setForm} set={set} professor={professor}
              infantilAluno={infantilAluno} faixaAlterada={faixaAlterada} aprovacao={aprovacao}
            />
          )}
        </fieldset>
      </div>

      {erro && <div className="ficha-erro" role="alert">⚠ {erro}</div>}

      <div className="ficha-rodape">
        <button type="button" className="al-btn" onClick={pedirFechar}>
          {podeEditar ? 'Cancelar' : 'Fechar'}
        </button>
        {podeEditar && (
          <button type="button" className="al-btn cheio" onClick={handleSave} disabled={saving || bloqueado}>
            {saving ? 'Salvando…' : bloqueado ? 'Grau insuficiente p/ assinar' : 'Salvar alterações'}
          </button>
        )}
      </div>
    </div>
    </div>
  )
}
