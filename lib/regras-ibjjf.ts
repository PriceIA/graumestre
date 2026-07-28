// ============================================================
// GrauMestre — Motor de regras do Sistema Geral de Graduação IBJJF
// (versão 3.3, junho/2026 — ver PDF do projeto)
//
// Todo cálculo de idade, categoria, tempo mínimo, grau de faixa preta
// e permissão de assinatura passa por aqui. Nada disso deve ser
// reimplementado dentro do AppShell — importe destas funções.
// ============================================================

import type { Aluno, Faixa, ProfessorPerfil, StatusGraduacao } from './types'

// ─── Categoria etária (art. 2.2.1 / 2.2.2) ────────────────────────────────

export const CATEGORIAS = [
  { nome: 'Pré-Mirim 1', idade: 4 }, { nome: 'Pré-Mirim 2', idade: 5 }, { nome: 'Pré-Mirim 3', idade: 6 },
  { nome: 'Mirim 1', idade: 7 }, { nome: 'Mirim 2', idade: 8 }, { nome: 'Mirim 3', idade: 9 },
  { nome: 'Infantil 1', idade: 10 }, { nome: 'Infantil 2', idade: 11 }, { nome: 'Infantil 3', idade: 12 },
  { nome: 'Infanto-Juvenil 1', idade: 13 }, { nome: 'Infanto-Juvenil 2', idade: 14 }, { nome: 'Infanto-Juvenil 3', idade: 15 },
  { nome: 'Juvenil 1', idade: 16 }, { nome: 'Juvenil 2', idade: 17 },
  { nome: 'Adulto', idadeMin: 18, idadeMax: 29 },
  { nome: 'Master 1', idadeMin: 30, idadeMax: 35 }, { nome: 'Master 2', idadeMin: 36, idadeMax: 40 },
  { nome: 'Master 3', idadeMin: 41, idadeMax: 45 }, { nome: 'Master 4', idadeMin: 46, idadeMax: 50 },
  { nome: 'Master 5', idadeMin: 51, idadeMax: 55 }, { nome: 'Master 6', idadeMin: 56, idadeMax: 60 },
  { nome: 'Master 7', idadeMin: 61, idadeMax: 999 },
] as const

/** ano corrente − ano de nascimento = idade do atleta (art. 2.2.1) */
export function calcularIdade(dataNascimento: string, anoReferencia = new Date().getFullYear()): number {
  const anoNascimento = new Date(dataNascimento).getFullYear()
  return anoReferencia - anoNascimento
}

export function calcularCategoria(dataNascimento: string): string {
  const idade = calcularIdade(dataNascimento)
  if (idade < 4) return 'Abaixo da idade mínima'
  for (const c of CATEGORIAS) {
    if ('idade' in c && c.idade === idade) return c.nome
    if ('idadeMin' in c && idade >= c.idadeMin && idade <= c.idadeMax) return c.nome
  }
  return 'Master 7'
}

export const ehInfantil = (dataNascimento: string) => calcularIdade(dataNascimento) <= 15
export const ehAdulto = (dataNascimento: string) => calcularIdade(dataNascimento) >= 16

// ─── Faixas: nomes de exibição e ordem de progressão ──────────────────────

export const FAIXAS_INFANTIS: Faixa[] = [
  'branca', 'cinza_branca', 'cinza', 'cinza_preta',
  'amarela_branca', 'amarela', 'amarela_preta',
  'laranja_branca', 'laranja', 'laranja_preta',
  'verde_branca', 'verde', 'verde_preta',
]

export const FAIXAS_ADULTAS: Faixa[] = ['branca', 'azul', 'roxa', 'marrom', 'preta']

export const NOMES_FAIXA: Record<Faixa, string> = {
  branca: 'Branca',
  cinza_branca: 'Cinza e Branca', cinza: 'Cinza', cinza_preta: 'Cinza e Preta',
  amarela_branca: 'Amarela e Branca', amarela: 'Amarela', amarela_preta: 'Amarela e Preta',
  laranja_branca: 'Laranja e Branca', laranja: 'Laranja', laranja_preta: 'Laranja e Preta',
  verde_branca: 'Verde e Branca', verde: 'Verde', verde_preta: 'Verde e Preta',
  azul: 'Azul', roxa: 'Roxa', marrom: 'Marrom', preta: 'Preta',
}

/**
 * Nome de exibição considerando que Vermelha-Preta / Vermelha-Branca / Vermelha
 * são o 7º/8º/9º-10º grau da faixa preta, não faixas separadas (art. 4.1.2).
 */
export function nomeFaixaExibicao(faixa: Faixa, graus: number): string {
  if (faixa === 'preta') {
    if (graus >= 9) return 'Vermelha (9º/10º Grau)'
    if (graus === 8) return 'Vermelha e Branca (8º Grau)'
    if (graus === 7) return 'Vermelha e Preta (7º Grau)'
  }
  return NOMES_FAIXA[faixa]
}

/** Grau máximo permitido para a faixa (infantil sugerido: 3 — Anexo I) */
export function grausMaximos(faixa: Faixa): number {
  if (faixa === 'preta') return 9
  if (FAIXAS_ADULTAS.includes(faixa)) return 4
  return 3
}

// ─── Idade mínima por faixa (art. 2°) ──────────────────────────────────────

const IDADE_MIN_INFANTIL: Partial<Record<Faixa, number>> = {
  cinza_branca: 4, cinza: 4, cinza_preta: 4,
  amarela_branca: 7, amarela: 7, amarela_preta: 7,
  laranja_branca: 10, laranja: 10, laranja_preta: 10,
  verde_branca: 13, verde: 13, verde_preta: 13,
}

const IDADE_MIN_ADULTO: Partial<Record<Faixa, number>> = {
  azul: 16, roxa: 16, marrom: 18, preta: 18,
}

/**
 * Idade mínima para a faixa. Faixa preta aos 18 só é válida se o aluno
 * for campeão mundial adulto na faixa marrom (art. 2.1.2.V / nota do doc).
 */
export function idadeMinimaValida(aluno: Aluno, faixaAlvo: Faixa): { ok: boolean; motivo?: string } {
  if (!aluno.data_nascimento) return { ok: true, motivo: 'Sem data de nascimento cadastrada — não é possível validar idade.' }
  const idade = calcularIdade(aluno.data_nascimento)

  if (ehInfantil(aluno.data_nascimento)) {
    const min = IDADE_MIN_INFANTIL[faixaAlvo] ?? 4
    return idade >= min ? { ok: true } : { ok: false, motivo: `Idade mínima para ${NOMES_FAIXA[faixaAlvo]} é ${min} anos.` }
  }

  if (faixaAlvo === 'preta' && idade === 18 && !aluno.campeao_mundial_marrom) {
    return { ok: false, motivo: 'Faixa preta aos 18 anos só é permitida para campeão mundial adulto na faixa marrom.' }
  }
  const min = IDADE_MIN_ADULTO[faixaAlvo]
  if (min && idade < min) return { ok: false, motivo: `Idade mínima para ${NOMES_FAIXA[faixaAlvo]} é ${min} anos.` }
  return { ok: true }
}

// ─── Tempo mínimo por faixa adulta (art. 3.1.3) ────────────────────────────

/** Retorna os anos mínimos exigidos na faixa ATUAL do aluno antes de graduar. */
export function tempoMinimoAnos(aluno: Aluno): number {
  switch (aluno.faixa) {
    case 'azul':
      if (aluno.campeao_mundial_azul) return 0
      if (aluno.veio_de_faixa_juvenil === 'azul_juvenil') return 0
      if (aluno.veio_de_faixa_juvenil === 'verde') return 0
      return aluno.veio_de_faixa_juvenil ? 1 : 2 // cinza/amarelo/laranja anterior = 1 ano
    case 'roxa':
      if (aluno.campeao_mundial_roxa) return 0
      if (aluno.veio_de_faixa_juvenil === 'roxa_juvenil') return 0
      if (aluno.veio_de_faixa_juvenil === 'laranja' || aluno.veio_de_faixa_juvenil === 'verde') return 0
      return aluno.veio_de_faixa_juvenil === 'azul_juvenil' ? 1 : 1.5
    case 'marrom':
      return aluno.campeao_mundial_marrom ? 0 : 1
    case 'preta':
      // Preta não tem "próxima faixa" de cor — progressão é por GRAU (ver
      // GRAUS_PRETA / podeProximoGrauPreta, que já cobre o art. 3.1.4.I /
      // 4.1.5.VII corretamente). Nunca chamar prontoParaProximaFaixa() para
      // faixa preta; este valor é só para o switch ser exaustivo.
      return Infinity
    default:
      return 0 // branca até verde/infantil: sem tempo mínimo (art. 3.1.1 / 3.1.2)
  }
}

/** Data em que o aluno entrou na faixa atual — usa a última graduação ou o `inicio`. */
export function dataInicioFaixaAtual(aluno: Aluno, ultimaGraduacaoData: string | null): string {
  return ultimaGraduacaoData ?? aluno.inicio
}

export function anosNaFaixaAtual(aluno: Aluno, ultimaGraduacaoData: string | null): number {
  const inicio = new Date(dataInicioFaixaAtual(aluno, ultimaGraduacaoData))
  const ms = Date.now() - inicio.getTime()
  return ms / (1000 * 60 * 60 * 24 * 365.25)
}

export function prontoParaProximaFaixa(aluno: Aluno, ultimaGraduacaoData: string | null): boolean {
  if (ehInfantil(aluno.data_nascimento ?? '')) return true // sem tempo mínimo infantil (art. 3.1.1)
  return anosNaFaixaAtual(aluno, ultimaGraduacaoData) >= tempoMinimoAnos(aluno)
}

// ─── Sistema de graus da faixa preta (art. 4.1.5) ──────────────────────────
// Cada grau pode ser solicitado pelo caminho mais curto: X anos após o grau
// anterior OU Y anos acumulados desde o diploma de faixa preta.

const GRAUS_PRETA = [
  { grau: 1, aposAnterior: 3, acumulado: 3 },
  { grau: 2, aposAnterior: 3, acumulado: 6 },
  { grau: 3, aposAnterior: 3, acumulado: 9 },
  { grau: 4, aposAnterior: 5, acumulado: 14 },
  { grau: 5, aposAnterior: 5, acumulado: 19 },
  { grau: 6, aposAnterior: 5, acumulado: 24 },
  { grau: 7, aposAnterior: 7, acumulado: 31 }, // Vermelha e Preta
  { grau: 8, aposAnterior: 7, acumulado: 38 }, // Vermelha e Branca
  { grau: 9, aposAnterior: 10, acumulado: 48 }, // Vermelha
  // 10º é honorário — não é solicitável (art. 4.1.5.X)
] as const

/**
 * Verifica se o aluno já pode solicitar o próximo grau na faixa preta.
 * `anosAcumulados` = tempo total comprovado na faixa preta (art. 4.1.6 / 4.2).
 * `anosDesdeUltimoGrau` = tempo desde a última graduação de grau.
 */
export function podeProximoGrauPreta(anosAcumulados: number, anosDesdeUltimoGrau: number, grauAtual: number): { pode: boolean; proximoGrau: number | null } {
  const proxima = GRAUS_PRETA.find(g => g.grau === grauAtual + 1)
  if (!proxima) return { pode: false, proximoGrau: null } // já no 9º, ou dado inválido
  const pode = anosDesdeUltimoGrau >= proxima.aposAnterior || anosAcumulados >= proxima.acumulado
  return { pode, proximoGrau: proxima.grau }
}

// ─── Quem pode assinar a graduação (art. 6°, 7.3, 7.4, 7.4.1) ──────────────

export type TipoAprovacao =
  | 'ate_marrom'        // qualquer faixa preta cadastrado
  | 'para_preta'        // faixa preta, mínimo 2º grau
  | 'marrom_provisoria' // faixa preta, mínimo 2 graus
  | 'preta_provisoria'  // faixa preta, mínimo 3 graus (ou 2º se veio de marrom provisória com o mesmo professor)

/**
 * Determina qual TipoAprovacao se aplica a uma graduação, a partir da faixa
 * de destino e de o aluno estar em status provisório (sem histórico de faixa
 * documentado — art. 7°). Usar o resultado como `tipo` em professorPodeAssinar().
 */
export function tipoAprovacaoGraduacao(faixaNova: Faixa, statusGraduacao: StatusGraduacao): TipoAprovacao {
  if (statusGraduacao === 'provisorio') {
    if (faixaNova === 'marrom') return 'marrom_provisoria'
    if (faixaNova === 'preta') return 'preta_provisoria'
  }
  if (faixaNova === 'preta') return 'para_preta'
  return 'ate_marrom'
}

export function professorPodeAssinar(professor: ProfessorPerfil, tipo: TipoAprovacao): { ok: boolean; motivo?: string } {
  const minimos: Record<TipoAprovacao, number> = {
    ate_marrom: 0,
    para_preta: 2,
    marrom_provisoria: 2,
    preta_provisoria: 3,
  }
  const min = minimos[tipo]
  if (professor.graus < min) {
    return { ok: false, motivo: `Esta graduação exige professor faixa preta com no mínimo ${min}º grau (professor atual: ${professor.graus}º grau).` }
  }
  return { ok: true }
}

// ─── Graduação provisória (art. 7°) ────────────────────────────────────────

/** Provisório permanece assim por 2 anos a partir da ativação do cadastro. */
export function statusProvisorioAtivo(provisorioDesde: string | null): boolean {
  if (!provisorioDesde) return false
  const anos = (Date.now() - new Date(provisorioDesde).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  return anos < 2
}

export function diasRestantesProvisorio(provisorioDesde: string): number {
  const dataFim = new Date(provisorioDesde)
  dataFim.setFullYear(dataFim.getFullYear() + 2)
  return Math.max(0, Math.ceil((dataFim.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}
