// ─── Afastado: automático por AULAS perdidas, com override manual ────────────
// Duas camadas, nesta ordem:
//
//   1. afastado_manual (true/false)  -> o professor decidiu, ponto final
//   2. afastado_manual null          -> conta aulas ativas perdidas seguidas
//      desde a última presença (ou desde a matrícula, se nunca teve nenhuma)
//
// Por que AULAS e não dias de calendário (mudança da Etapa 3B, lote de
// agosto/2026): um aluno que ficou 21 dias sem vir numa quinzena em que não
// houve aula nenhuma não faltou a nada, mas levava o carimbo do mesmo jeito —
// o app não sabia que ninguém tinha aula naquele período. "Aulas perdidas" é
// a pergunta certa: quantas vezes ele podia ter vindo e não veio.
//
// O professor sabe de coisas que a frequência não conta — lesão, viagem,
// mudança de horário —, então a decisão dele sempre ganha do cálculo. Desfazer
// o override é voltar a coluna para null, e o automático reassume.

/** Aulas ativas perdidas seguidas até o aluno ser considerado afastado. Ajuste só aqui. */
export const AULAS_PARA_AFASTADO = 6

/**
 * `aulas_perdidas` é campo DERIVADO, montado em lib/carregar-dados.ts a
 * partir das mesmas aulas que alimentam `ultima_presenca_data` — nunca pode
 * entrar em payload de update.
 */
export function estaAfastado(aluno: { afastado_manual?: boolean | null; aulas_perdidas?: number | null }): boolean {
  if (aluno.afastado_manual === true)  return true
  if (aluno.afastado_manual === false) return false
  return (aluno.aulas_perdidas ?? 0) >= AULAS_PARA_AFASTADO
}

/** Texto curto para o selo/tooltip, explicando de onde veio o estado. */
export function motivoAfastamento(aluno: { afastado_manual?: boolean | null; aulas_perdidas?: number | null; ultima_presenca_data?: string | null }): string | null {
  if (!estaAfastado(aluno)) return null
  if (aluno.afastado_manual === true) return 'Marcado como afastado pelo professor'

  const perdidas = aluno.aulas_perdidas ?? 0
  // Distingue "nunca veio" de "veio e parou" — mesmo critério de contagem,
  // motivo diferente para o professor ler.
  if (!aluno.ultima_presenca_data) return `Nunca esteve presente (${perdidas} aulas lançadas)`
  return `Faltou às últimas ${perdidas} aulas`
}

// ─── Aulas perdidas até um corte ─────────────────────────────────────────────
// A conta de `aulas_perdidas` mora aqui, num lugar só: lib/carregar-dados.ts a
// usa sem corte ("até agora") e a Chamada a usa com o corte na data da aula
// aberta. "Voltou" (G7) = estava afastado considerando só o que veio ANTES
// desta aula; sem o corte, marcar um aluno sumido e reabrir a chamada o faria
// deixar de ser afastado — o "voltaram" daria 0 justo quando o professor foi
// dar as boas-vindas.

export type AulaComPresencas = {
  data: string
  presencas?: { aluno_id: string; presente: boolean }[] | null
}

/**
 * `aulasDadas`: aulas ativas com data <= hoje, em qualquer ordem. `corte`: só
 * contam aulas com data ESTRITAMENTE menor (outra aula no mesmo dia do corte
 * fica de fora); null = sem corte. Datas 'AAAA-MM-DD' se comparam como texto.
 *
 * Com presença antes do corte: `perdidas` = aulas antes do corte com data
 * depois da última presença. Sem nenhuma: aulas antes do corte desde `inicio`
 * (todas, se `inicio` for null) — quem nunca veio e entrou depois não perdeu o
 * que aconteceu antes de entrar.
 */
export function aulasPerdidasAte(
  alunoId: string,
  inicio: string | null,
  aulasDadas: AulaComPresencas[],
  corte: string | null,
): { perdidas: number; ultimaPresenca: string | null } {
  const antes = corte === null ? aulasDadas : aulasDadas.filter(au => au.data < corte)

  let ultimaPresenca: string | null = null
  for (const au of antes) {
    // presente = false registra que faltou: o oposto do que se mede aqui.
    const veio = (au.presencas ?? []).some(p => p.aluno_id === alunoId && p.presente)
    if (veio && (ultimaPresenca === null || au.data > ultimaPresenca)) ultimaPresenca = au.data
  }

  const perdidas = ultimaPresenca !== null
    ? antes.filter(au => au.data > ultimaPresenca!).length
    : antes.filter(au => inicio === null || au.data >= inicio).length

  return { perdidas, ultimaPresenca }
}
