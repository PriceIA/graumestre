import type { Aluno } from './types'
import { ehInfantil, anosNaFaixaAtual, podeProximoGrauPreta, prontoParaProximaFaixa } from './regras-ibjjf'

// ─── Alerta de graduação — sugestão, nunca bloqueio (art. 3.1.3 / 4.1.5) ──────
// `ultimaGraduacaoData` vem do histórico em `graduacoes`; sem nenhum registro
// ainda, dataInicioFaixaAtual() cai de volta em `aluno.inicio`.
export function alertaGraduacao(aluno: Aluno, ultimaGraduacaoData: string | null): string | null {
  const infantil = aluno.data_nascimento ? ehInfantil(aluno.data_nascimento) : false
  if (infantil) return null // sem tempo mínimo infantil (art. 3.1.1)

  if (aluno.faixa === 'preta') {
    const anos = anosNaFaixaAtual(aluno, ultimaGraduacaoData)
    const { pode, proximoGrau } = podeProximoGrauPreta(anos, anos, aluno.graus)
    return pode && proximoGrau ? `Pronto para o ${proximoGrau}º grau` : null
  }

  return prontoParaProximaFaixa(aluno, ultimaGraduacaoData) ? 'Tempo mínimo cumprido — pronto para próxima faixa' : null
}
