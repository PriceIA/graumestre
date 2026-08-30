import type { Aluno, Faixa } from './types'
import {
  anosNaFaixaAtual, podeProximoGrauPreta, prontoParaProximaFaixa,
  grausMaximos, proximaFaixa, idadeMinimaValida, ehInfantil, NOMES_FAIXA,
} from './regras-ibjjf'
import { prontoParaProximoGrau, PRESENCAS_POR_GRAU_PADRAO } from './ritmo-graus'

// ─── Alerta de graduação — sugestão, nunca bloqueio ────────────────────────
//
// Discriminado por `tipo` porque grau e faixa são coisas diferentes: grau é
// rotina do professor (critério de presença, lib/ritmo-graus.ts), faixa é
// regra da IBJJF (tempo mínimo + idade, lib/regras-ibjjf.ts). Ver a seção
// "Graus" do CLAUDE.md — não reabrir a separação dos dois arquivos.
export type Alerta =
  | { tipo: 'grau'; msg: string; proximoGrau: number }
  | { tipo: 'faixa'; msg: string; faixaAlvo: Faixa }
  | null

// `ultimaGraduacaoData` vem do histórico em `graduacoes`; sem nenhum registro
// ainda, dataInicioFaixaAtual() cai de volta em `aluno.inicio`.
//
// `presencasPorGrau` vem de `professor_perfil.presencas_por_grau` — quem
// chama já resolveu o default (professor?.presencas_por_grau ?? 48).
export function alertaGraduacao(
  aluno: Aluno,
  ultimaGraduacaoData: string | null,
  presencasPorGrau: number = PRESENCAS_POR_GRAU_PADRAO,
): Alerta {
  // Faixa preta: intocado. Os intervalos entre graus são da IBJJF
  // (3/5/7/10 anos — GRAUS_PRETA), não critério de presença.
  if (aluno.faixa === 'preta') {
    const anos = anosNaFaixaAtual(aluno, ultimaGraduacaoData)
    const { pode, proximoGrau } = podeProximoGrauPreta(anos, anos, aluno.graus)
    return pode && proximoGrau ? { tipo: 'grau', msg: `Pronto para o ${proximoGrau}º grau`, proximoGrau } : null
  }

  const noTeto = aluno.graus >= grausMaximos(aluno.faixa)

  // Abaixo do teto de graus: alerta de GRAU, só pelo critério de presença do
  // professor. Vale para infantil também — o professor decide os graus das
  // crianças do mesmo jeito, e o próprio teto (3 graus infantil) já cobra
  // 3 × presencasPorGrau antes de qualquer alerta de faixa entrar em jogo.
  if (!noTeto) {
    const prontidao = prontoParaProximoGrau(aluno, presencasPorGrau)
    if (!prontidao.pronto) return null
    const proximoGrau = aluno.graus + 1
    return { tipo: 'grau', msg: `Pronto para o ${proximoGrau}º grau`, proximoGrau }
  }

  // No teto de graus: alerta de FAIXA, e só quando é verdade de verdade —
  // tempo mínimo da IBJJF cumprido E idade mínima válida. `proximaFaixa`
  // precisa do infantil porque `branca` está nas duas listas de progressão.
  const infantil = aluno.data_nascimento ? ehInfantil(aluno.data_nascimento) : false
  const faixaAlvo = proximaFaixa(aluno.faixa, infantil)
  if (!faixaAlvo) return null
  if (!prontoParaProximaFaixa(aluno, ultimaGraduacaoData)) return null
  if (!idadeMinimaValida(aluno, faixaAlvo).ok) return null

  return { tipo: 'faixa', msg: `Pronto para faixa ${NOMES_FAIXA[faixaAlvo]}`, faixaAlvo }
}
