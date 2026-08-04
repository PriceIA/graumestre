// ─── Afastado: automático por frequência, com override manual ────────────────
// Duas camadas, nesta ordem:
//
//   1. afastado_manual (true/false)  -> o professor decidiu, ponto final
//   2. afastado_manual null          -> conta os dias desde a última presença
//
// O professor sabe de coisas que a frequência não conta — lesão, viagem,
// mudança de horário —, então a decisão dele sempre ganha do cálculo. Desfazer
// o override é voltar a coluna para null, e o automático reassume.

/** Dias sem presença até o aluno ser considerado afastado. Ajuste só aqui. */
export const DIAS_PARA_AFASTADO = 21

/**
 * `ultima_presenca_data` é derivada em lib/carregar-dados.ts a partir das aulas
 * já carregadas. Aluno que nunca teve presença registrada conta como afastado:
 * nunca apareceu é, para efeito de acompanhamento, o mesmo que parou de vir.
 */
export function diasSemPresenca(ultimaPresencaData: string | null): number | null {
  if (!ultimaPresencaData) return null
  // T00:00:00 força horário local — a string ISO pura seria lida como UTC e
  // poderia deslocar a conta em um dia perto da virada.
  const ultima = new Date(`${ultimaPresencaData}T00:00:00`)
  if (Number.isNaN(ultima.getTime())) return null
  return Math.floor((Date.now() - ultima.getTime()) / 86400000)
}

export function estaAfastado(aluno: { afastado_manual?: boolean | null; ultima_presenca_data?: string | null }): boolean {
  if (aluno.afastado_manual === true)  return true
  if (aluno.afastado_manual === false) return false

  const dias = diasSemPresenca(aluno.ultima_presenca_data ?? null)
  return dias === null ? true : dias >= DIAS_PARA_AFASTADO
}

/** Texto curto para o selo/tooltip, explicando de onde veio o estado. */
export function motivoAfastamento(aluno: { afastado_manual?: boolean | null; ultima_presenca_data?: string | null }): string | null {
  if (!estaAfastado(aluno)) return null
  if (aluno.afastado_manual === true) return 'Marcado como afastado pelo professor'

  const dias = diasSemPresenca(aluno.ultima_presenca_data ?? null)
  if (dias === null) return 'Sem nenhuma presença registrada'
  return `Sem presença há ${dias} dias`
}
