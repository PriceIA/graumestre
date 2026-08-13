// ============================================================
// GrauMestre — Ritmo de graus DO PROFESSOR (sugestão, não regra)
//
// ⚠ Este arquivo é separado de lib/regras-ibjjf.ts DE PROPÓSITO.
//
// Lá vive o que a federação exige: tempo mínimo de permanência por faixa
// (art. 3.1.3 — 2 anos para virar azul, etc.), idade mínima, quem pode
// assinar, o sistema de graus da faixa preta. Nada disso o professor pode
// mudar.
//
// Aqui vive o ritmo de trabalho DELE: de quantos em quantos meses costuma
// dar um grau. O art. 4.1.3 diz que, até a faixa marrom, o sistema de graus
// fica a critério de cada Professor — então isto é preferência, editável a
// qualquer momento, e nunca bloqueia nada.
//
// A separação é lógica, não só visual. Se as duas coisas morassem no mesmo
// arquivo, a próxima sessão trataria uma como a outra — que é exatamente o
// que a tela também não pode deixar acontecer.
// ============================================================

import type { Aluno } from './types'
import { dataInicioFaixaAtual, grausMaximos } from './regras-ibjjf'

/** Ritmo padrão quando o professor nunca mexeu no valor. */
export const MESES_ENTRE_GRAUS_PADRAO = 5

export interface SugestaoGrau {
  proximoGrau: number
  /** ISO (yyyy-mm-dd) — quando o próximo grau "sai" no ritmo do professor. */
  data: string
  /** Formatado dd/mm/aaaa, pronto para a tela. */
  dataFormatada: string
  /** Negativo quando a data já passou. */
  diasRestantes: number
  vencido: boolean
}

/** dd/mm/aaaa a partir de um ISO yyyy-mm-dd, sem passar por Date (evita fuso). */
function formatarBR(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

/**
 * Soma meses a uma data ISO, em UTC.
 *
 * O `setUTCMonth` do JS transborda quando o dia não existe no mês de destino
 * (31/01 + 1 mês vira 03/03). O ajuste devolve para o último dia do mês certo,
 * que é o que "cinco meses depois" significa para quem lê.
 */
function somarMeses(iso: string, meses: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const d = new Date(Date.UTC(ano, mes - 1 + meses, 1))
  const ultimoDia = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(dia, ultimoDia))
  return d.toISOString().split('T')[0]
}

/**
 * Quando o próximo grau sai, no ritmo do professor.
 *
 * `null` = a sugestão não se aplica, e a tela não deve mostrar nada:
 *
 * - **Faixa preta.** Ali os intervalos entre graus são exigência da IBJJF
 *   (3/5/7/10 anos — ver GRAUS_PRETA em regras-ibjjf.ts). Sugerir "5 meses"
 *   ao lado disso seria contradizer a federação na cara do professor.
 * - **Já no teto de graus da faixa.** No 4º grau da branca/azul/roxa/marrom o
 *   próximo passo é mudar de COR, não ganhar grau (art. 4.1.2) — quem diz isso
 *   é o painel "Próximo passo", não este cálculo.
 *
 * A data base é `dataInicioFaixaAtual()`, reusada de regras-ibjjf.ts: a última
 * graduação registrada, ou a matrícula quando não há nenhuma. Serve como "data
 * do último grau" porque o ModalAluno grava uma linha em `graduacoes` a cada
 * mudança de grau, não só de faixa.
 */
export function sugestaoProximoGrau(
  aluno: Aluno,
  ultimaGraduacaoData: string | null,
  mesesEntreGraus: number = MESES_ENTRE_GRAUS_PADRAO,
): SugestaoGrau | null {
  if (aluno.faixa === 'preta') return null
  if (aluno.graus >= grausMaximos(aluno.faixa)) return null

  const base = dataInicioFaixaAtual(aluno, ultimaGraduacaoData)
  if (!base) return null

  const data = somarMeses(base, mesesEntreGraus)
  const hoje = new Date().toISOString().split('T')[0]
  const diasRestantes = Math.ceil(
    (Date.parse(`${data}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / 86_400_000,
  )

  return {
    proximoGrau: aluno.graus + 1,
    data,
    dataFormatada: formatarBR(data),
    diasRestantes,
    vencido: diasRestantes <= 0,
  }
}
