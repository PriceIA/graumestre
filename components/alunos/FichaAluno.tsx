'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Aluno, Graduacao, ProfessorPerfil, TabAluno } from '@/lib/types'
import {
  professorPodeAssinar, tipoAprovacaoGraduacao,
  calcularIdade, calcularCategoria, ehInfantil,
  FAIXAS_INFANTIS, FAIXAS_ADULTAS, NOMES_FAIXA,
  grausMaximos, proximaFaixa, nomeFaixaExibicao, diasRestantesProvisorio,
  anosNaFaixaAtual, prontoParaProximaFaixa, podeProximoGrauPreta,
} from '@/lib/regras-ibjjf'
import { sugestaoProximoGrau, MESES_ENTRE_GRAUS_PADRAO } from '@/lib/ritmo-graus'
import { estaAfastado, motivoAfastamento, AULAS_PARA_AFASTADO } from '@/lib/afastamento'
import { BELT_COLORS } from '@/lib/cores-faixa'
import { payloadAluno, validarAluno } from '@/lib/alunos'
import { mandarParaLixeira, DIAS_LIXEIRA } from '@/lib/lixeira'
import { hojeBrasil } from '@/lib/datas'
import { BeltBadge } from '@/components/comum/BeltBadge'
import { FreqBar } from '@/components/comum/FreqBar'
import { Field, Toggle } from '@/components/comum/Campos'
import { scrim, type Theme } from '@/lib/cores'

// ─── Modal Aluno ─────────────────────────────────────────────────────────────
export function FichaAluno({ aluno, professor, onClose, onSave, onDelete, onGraduacaoMudou, t, podeEditar = true, tabInicial = 'perfil' }: {
  aluno: Aluno & { total_presencas?: number; total_aulas?: number; ultima_graduacao_data?: string | null; historico_graduacoes?: Graduacao[]; ultima_presenca_data?: string | null; aulas_perdidas?: number };
  professor: ProfessorPerfil | null;
  onClose: () => void; onSave: (a: Aluno) => void; onDelete: (id: string) => void;
  // avisa o AppShell que o histórico de graduações mudou (gravou ou apagou):
  // ele recarrega a lista do banco, que é a fonte única — o selo PRONTO, o
  // histórico e o badge da lixeira dependem disso
  onGraduacaoMudou: () => void; t: Theme;
  // Hoje é sempre true (app single-user, só o professor usa). Fica preparado
  // para quando o aluno puder logar e ver o próprio perfil em modo leitura.
  podeEditar?: boolean;
  // Aba já aberta ao montar. Quem chega pelo card "Prontos para graduar" vem
  // para graduar — passar pelo perfil primeiro seria toque desperdiçado.
  tabInicial?: TabAluno;
}) {
  const [form, setForm]   = useState({ ...aluno })
  const [tab, setTab]     = useState<TabAluno>(tabInicial)
  const [saving, setSaving] = useState(false)
  const [erro, setErro]   = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  // cópia local do histórico para o ✕ sumir na hora, sem esperar recarga
  const [historico, setHistorico] = useState<Graduacao[]>(aluno.historico_graduacoes ?? [])
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))
  const tabs: TabAluno[] = ['perfil', 'frequência', 'notas', 'graduação']

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
  const maxGrausFaixa = grausMaximos(form.faixa, infantilAluno)
  const ultimaGraduacaoData = aluno.ultima_graduacao_data ?? null

  // Próxima COR — só faz sentido para quem já está no teto de graus. Depende de
  // `infantilAluno` porque `branca` está nas duas progressões.
  const proxFaixa = proximaFaixa(form.faixa, infantilAluno)

  // Ritmo do professor: SUGESTÃO dele (art. 4.1.3), não exigência da IBJJF.
  // Calculado sobre `form` e não sobre `aluno` para acompanhar a edição em
  // curso — trocar a faixa na tela já muda o que a sugestão diz.
  const mesesEntreGraus = professor?.meses_entre_graus ?? MESES_ENTRE_GRAUS_PADRAO
  const ritmo = sugestaoProximoGrau(form, ultimaGraduacaoData, mesesEntreGraus)

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
      // Modal continua aberto de propósito: o professor não perde o que digitou.
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
        // o modal aberto para o professor poder tentar o histórico de novo.
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
        <div style={{ padding: '20px 20px 0', borderBottom: `1px solid ${t.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ color: t.text, fontWeight: 800, fontSize: 18 }}>{form.nome}</div>
              <div style={{ marginTop: 6 }}><BeltBadge faixa={form.faixa} graus={form.graus} infantil={infantilAluno} t={t} /></div>
            </div>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: t.textMute, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
          </div>
          <div style={{ display: 'flex' }}>
            {tabs.map(tb => (
              <button key={tb} onClick={() => setTab(tb)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: tab === tb ? t.ativo : t.textMute,
                fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', letterSpacing: 1,
                padding: '8px 10px',
                borderBottom: tab === tb ? `2px solid ${t.ativo}` : '2px solid transparent',
              }}>{tb}</button>
            ))}
          </div>
        </div>

        {/* fieldset desabilita de uma vez todos os inputs/selects/botões que
            estiverem dentro dele — as abas ficam de fora e continuam navegáveis */}
        {/* A rolagem mora numa <div>, não no <fieldset>: no Chrome o conteúdo de
            um fieldset com overflow vazava dos limites dele e era pintado por
            cima do rodapé (reproduzido em 2026-10-23, G5.2). O fieldset fica
            dentro, só para desligar a edição. minHeight:0 deixa o flex encolher. */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
        <fieldset
          disabled={!podeEditar}
          style={{ padding: 20, border: 'none', margin: 0, minWidth: 0 }}
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
                    <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Idade</div>
                    <div style={{ color: t.text, fontSize: 14 }}>{idade} anos</div>
                  </div>
                  <div>
                    <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>Categoria</div>
                    <div style={{ color: t.text, fontSize: 14 }}>{categoria}</div>
                  </div>
                </div>
              )}
              <Field label="Instagram" value={form.instagram ?? ''} onChange={v => set('instagram', v)} t={t} />
              <Field label="Foto URL" value={form.foto_url ?? ''} onChange={v => set('foto_url', v)} placeholder="https://..." t={t} />
              <Field label="Início no jiu-jítsu" value={form.inicio} onChange={v => set('inicio', v)} type="date" t={t} />

              {/* Três estados numa tela só: o toggle liga/desliga o override, e
                  o link ao lado devolve a decisão para o cálculo automático. */}
              <div>
                <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
                  Situação
                </div>
                <Toggle
                  label="Afastado"
                  checked={form.afastado_manual ?? estaAfastado({ ...form, aulas_perdidas: aluno.aulas_perdidas })}
                  onChange={v => set('afastado_manual', v)}
                  t={t}
                />
                <div style={{ color: t.textMute, fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>
                  {form.afastado_manual === null || form.afastado_manual === undefined
                    ? `Automático: ${motivoAfastamento({ ...form, aulas_perdidas: aluno.aulas_perdidas, ultima_presenca_data: aluno.ultima_presenca_data }) ?? `menos de ${AULAS_PARA_AFASTADO} aulas perdidas seguidas`}.`
                    : (
                      <>
                        Definido manualmente como {form.afastado_manual ? 'afastado' : 'ativo'}.{' '}
                        <button
                          onClick={() => set('afastado_manual', null)}
                          style={{ background: 'none', border: 'none', color: t.ativo, fontSize: 11, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                        >
                          Voltar ao automático
                        </button>
                      </>
                    )}
                </div>
              </div>

              <div>
                <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>
                  Histórico de graduações
                </div>
                {historico.length === 0 ? (
                  <div style={{ color: t.textSub, fontSize: 12, fontStyle: 'italic' }}>Nenhuma graduação registrada ainda.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {historico.map(g => (
                      <div key={g.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 'var(--r)', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                          <span style={{ color: t.text, fontSize: 13, fontWeight: 700 }}>
                            {nomeFaixaExibicao(g.faixa_anterior, g.graus_anterior)} → {nomeFaixaExibicao(g.faixa_nova, g.graus_novo)}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui }}>{g.data}</span>
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
                        <div style={{ color: t.textSub, fontSize: 11, fontFamily: t.ui }}>
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
              <div style={{ marginTop: 16, color: t.textMute, fontSize: 12, fontFamily: t.ui }}>
                {(form as any).total_presencas ?? 0} presenças de {(form as any).total_aulas ?? 0} aulas registradas
              </div>
              <div style={{ marginTop: 12, padding: 12, background: t.surface, borderRadius: 'var(--r)', border: `1px solid ${t.border}`, color: t.textSub, fontSize: 13 }}>
                Para registrar presença, abra a aula na aba Aulas — ou crie uma no "+" — e faça a chamada.
              </div>
            </div>
          )}

          {tab === 'notas' && (
            <div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 8 }}>Observações do professor</div>
              <textarea
                value={form.notas ?? ''} onChange={e => set('notas', e.target.value)}
                placeholder="Anote evolução, pontos de atenção..."
                style={{ width: '100%', minHeight: 160, background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 'var(--r)', padding: 12, color: t.text, fontSize: 16, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {tab === 'graduação' && (
            <div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 12 }}>
                Faixa atual {form.data_nascimento && `— ${infantilAluno ? 'infantil' : 'adulto'}`}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {faixasDisponiveis.map(fx => (
                  // Ajusta faixa e graus JUNTOS: cada faixa tem seu teto (4 na
                  // branca/azul/roxa/marrom, 9 na preta, 3 no infantil), e um
                  // `set('faixa', ...)` sozinho deixaria um preta 6º grau virar
                  // "marrom 6º grau" — grau que não existe (art. 4.1.2). O
                  // banco aceitaria: o check é `graus between 0 and 9`, global,
                  // não por faixa. E como os botões de grau re-renderizam 0–4,
                  // nenhum ficaria destacado e o professor não veria o erro.
                  <button key={fx} onClick={() => setForm(f => ({
                    ...f, faixa: fx, graus: Math.min(f.graus, grausMaximos(fx, infantilAluno)),
                  }))} style={{
                    padding: '8px 14px', borderRadius: 'var(--r)', cursor: 'pointer',
                    background: BELT_COLORS[fx].bg, color: BELT_COLORS[fx].text, fontWeight: 700, fontSize: 12,
                    border: form.faixa === fx ? `2px solid ${t.ativo}` : '2px solid transparent',
                    textTransform: 'uppercase', letterSpacing: 1,
                  }}>{NOMES_FAIXA[fx]}</button>
                ))}
              </div>
              <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 10 }}>Graus</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Array.from({ length: maxGrausFaixa + 1 }, (_, g) => g).map(g => (
                  <button key={g} onClick={() => set('graus', g)} style={{
                    width: 44, height: 44, borderRadius: 'var(--r)', cursor: 'pointer', fontWeight: 700,
                    background: form.graus === g ? t.ativo : t.surface2,
                    color: form.graus === g ? t.sobreAtivo : t.textMute,
                    border: `1px solid ${t.border}`, fontSize: 15,
                  }}>{g}</button>
                ))}
              </div>
              {/* Três desfechos, não dois. No teto de graus o passo seguinte é a
                  próxima COR (art. 4.1.2) — dizer só "pronto para subir de faixa"
                  não diz qual. E na preta com 9 graus não existe faixa nenhuma
                  depois: o 10º é honorário (art. 4.1.5.X), então prometer "subir
                  de faixa" ali era errado. */}
              <div style={{ marginTop: 16, padding: 14, background: t.surface, borderRadius: 'var(--r)', border: `1px solid ${t.border}` }}>
                <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, marginBottom: 6 }}>PRÓXIMO PASSO</div>
                {form.graus < maxGrausFaixa ? (
                  <div style={{ color: t.text, fontSize: 13 }}>+1 grau → {nomeFaixaExibicao(form.faixa, form.graus + 1)}</div>
                ) : proxFaixa ? (
                  <div style={{ color: t.text, fontSize: 13 }}>
                    {maxGrausFaixa}º grau completo → promover para Faixa {NOMES_FAIXA[proxFaixa]}
                  </div>
                ) : (
                  <div style={{ color: t.text, fontSize: 13 }}>
                    {form.faixa === 'preta'
                      ? 'Topo da progressão de graus solicitáveis'
                      : 'Pronto para subir de faixa'}
                  </div>
                )}
              </div>

              {/* ─── Ritmo do professor — SUGESTÃO, não regra da federação ────────
                  Bloco deliberadamente diferente dos blocos IBJJF logo abaixo:
                  borda tracejada, sem o vermelho de "exigência", e o rótulo diz
                  de quem é a regra. O pedido era que as duas coisas não se
                  confundissem — o art. 4.1.3 deixa o sistema de graus a critério
                  do Professor até a marrom, enquanto o tempo mínimo de
                  permanência (art. 3.1.3) é da IBJJF e ninguém altera.
                  Não renderiza na faixa preta nem no teto de graus: quem decide
                  isso é sugestaoProximoGrau(), que devolve null. */}
              {ritmo && (
                <div style={{
                  marginTop: 12, padding: 14, borderRadius: 'var(--r)',
                  background: 'transparent', border: `1px dashed ${t.border2}`,
                }}>
                  <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, marginBottom: 6 }}>
                    RITMO DO PROFESSOR · SUGESTÃO SUA
                  </div>
                  <div style={{ color: t.text, fontSize: 13 }}>
                    {ritmo.proximoGrau}º grau sugerido em <strong>{ritmo.dataFormatada}</strong>
                  </div>
                  <div style={{ color: ritmo.vencido ? t.alertaTexto : t.textSub, fontSize: 12, marginTop: 4 }}>
                    {ritmo.vencido
                      ? `Já passou ${Math.abs(ritmo.diasRestantes)} dia(s) do seu ritmo de ${mesesEntreGraus} meses por grau.`
                      : `Faltam ${ritmo.diasRestantes} dia(s) — seu ritmo é de ${mesesEntreGraus} meses por grau.`}
                  </div>
                  <div style={{ color: t.textMute, fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
                    Ritmo definido por você no Perfil do Professor, editável a qualquer momento.
                    Não é exigência da IBJJF — o art. 4.1.3 deixa o sistema de graus a critério
                    do Professor até a faixa marrom.
                  </div>
                </div>
              )}

              {/* Exceções de tempo mínimo (art. 3.1.3) — só a do campeonato da faixa atual */}
              {(aluno.faixa === 'azul' || aluno.faixa === 'roxa' || aluno.faixa === 'marrom') && (
                <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* O rótulo nomeia a IBJJF de propósito: é o contraste que impede
                      ler o bloco de ritmo acima como se fosse a mesma regra. */}
                  <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase' }}>
                    Exceções de tempo mínimo · exigência IBJJF (art. 3.1.3)
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
                <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 8 }}>
                  Veio de faixa juvenil
                </div>
                <select
                  value={form.veio_de_faixa_juvenil ?? ''}
                  onChange={e => set('veio_de_faixa_juvenil', e.target.value || null)}
                  style={{ width: '100%', background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 'var(--r)', padding: '10px 12px', color: t.text, fontSize: 16, boxSizing: 'border-box' }}
                >
                  <option value="">Nenhuma</option>
                  <option value="azul_juvenil">Azul juvenil</option>
                  <option value="roxa_juvenil">Roxa juvenil</option>
                  <option value="laranja">Laranja</option>
                  <option value="verde">Verde</option>
                </select>
              </div>

              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase' }}>
                  Graduação provisória (art. 7°)
                </div>
                <Toggle
                  label="Sem histórico de faixa documentado"
                  checked={form.status_graduacao === 'provisorio'}
                  onChange={v => setForm(f => ({
                    ...f,
                    status_graduacao: v ? 'provisorio' : 'regular',
                    provisorio_desde: v ? (f.provisorio_desde ?? hojeBrasil()) : null,
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
                        alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 'var(--r)',
                        background: t.alertaBg, border: `1px solid ${t.alerta}`,
                        color: t.alertaTexto, fontSize: 12, fontFamily: t.ui,
                      }}>
                        {diasRestantesProvisorio(form.provisorio_desde)} dias restantes
                      </div>
                    )}
                  </>
                )}
              </div>

              {!professor && (
                <div style={{ marginTop: 12, padding: 12, background: t.surface, borderRadius: 'var(--r)', border: `1px solid ${t.border}`, color: t.textSub, fontSize: 12 }}>
                  Perfil do professor não encontrado — não é possível validar quem pode assinar esta graduação.
                </div>
              )}
              {professor && faixaAlterada && !aprovacao.ok && (
                <div style={{
                  marginTop: 12, padding: 12, borderRadius: 'var(--r)',
                  background: t.alertaBg, border: `1px solid ${t.alerta}`, color: t.alertaTexto, fontSize: 12, lineHeight: 1.5,
                }}>
                  ⚠ {aprovacao.motivo}
                </div>
              )}
            </div>
          )}
        </fieldset>
        </div>

        {erro && (
          <div style={{
            margin: '0 20px', padding: 12, borderRadius: 'var(--r)',
            background: t.erroBg, border: `1px solid ${t.erro}`,
            color: t.erroTexto, fontSize: 12, lineHeight: 1.5,
          }}>
            ⚠ {erro}
          </div>
        )}

        <div style={{ padding: '14px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10 }}>
          <button
            onClick={handleClose}
            style={{ flex: 1, padding: 12, borderRadius: 'var(--r)', border: `1px solid ${t.border}`, background: 'none', color: t.textSub, cursor: 'pointer', fontSize: 14 }}
          >
            {podeEditar ? 'Cancelar' : 'Fechar'}
          </button>
          {podeEditar && (
            <button
              onClick={handleSave} disabled={saving || (faixaAlterada && !aprovacao.ok)}
              style={{
                flex: 2, padding: 12, borderRadius: 'var(--r)', border: 'none',
                background: t.ativo, color: t.sobreAtivo, fontWeight: 800, fontSize: 14,
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
