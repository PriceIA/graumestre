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
