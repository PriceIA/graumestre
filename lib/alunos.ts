import type { Aluno, Faixa } from '@/lib/types'
import { ehInfantil, FAIXAS_INFANTIS, FAIXAS_ADULTAS } from '@/lib/regras-ibjjf'
import { alertaGraduacao } from '@/lib/alertas-graduacao'
import { estaAfastado } from '@/lib/afastamento'
import { hojeBrasil } from '@/lib/datas'

// ─── Colunas graváveis de `alunos` ───────────────────────────────────────────
// O objeto do aluno carrega campos derivados que NÃO são colunas da tabela:
// total_presencas/total_aulas vêm da view alunos_frequencia, e
// ultima_graduacao_data/historico_graduacoes são montados em app/page.tsx.
// Mandar qualquer um deles no update faz o PostgREST rejeitar a request inteira
// (PGRST204) e trava a edição do aluno por completo — inclusive quando o valor
// é um array vazio, porque a validação é feita sobre as chaves do payload, não
// sobre os valores. Whitelist em vez de descartar campo a campo: assim um campo
// derivado novo não volta a quebrar o save silenciosamente.
export const COLUNAS_ALUNO = [
  'nome', 'faixa', 'graus', 'inicio', 'data_nascimento', 'foto_url', 'instagram', 'notas',
  'campeao_mundial_azul', 'campeao_mundial_roxa', 'campeao_mundial_marrom',
  'veio_de_faixa_juvenil', 'status_graduacao', 'provisorio_desde',
  'curso_primeiros_socorros', 'curso_regras_data', 'afastado_manual',
] as const satisfies readonly (keyof Aluno)[]

export function payloadAluno(form: Aluno): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const coluna of COLUNAS_ALUNO) out[coluna] = form[coluna]
  return out
}

// ─── Validação do formulário do aluno ────────────────────────────────────────
// Retorna a mensagem de erro, ou null quando está tudo certo.
export function validarAluno(form: Aluno): string | null {
  if (!form.nome.trim()) return 'O nome do aluno não pode ficar vazio.'

  if (form.data_nascimento) {
    // T00:00:00 força interpretação em horário local — sem isso a string ISO
    // pura é lida como UTC e uma data válida pode ser lida como inválida.
    const nascimento = new Date(`${form.data_nascimento}T00:00:00`)
    if (Number.isNaN(nascimento.getTime())) {
      return 'A data de nascimento não é uma data válida.'
    }
    // 'AAAA-MM-DD' compara certo como texto, e hojeBrasil() é o mesmo
    // "hoje" do resto do app (lib/datas.ts).
    if (form.data_nascimento > hojeBrasil()) {
      return 'A data de nascimento não pode estar no futuro.'
    }
  }

  return null
}

// ─── Filtros da lista de alunos ──────────────────────────────────────────────
// Combináveis em AND: marcar Azul + Adulto mostra quem é as duas coisas, não a
// união. Nenhum critério aqui recalcula nada — faixa lê a coluna, "prontos"
// chama a mesma alertaGraduacao() que alimenta a home e o selo do card, e
// afastado vem de estaAfastado().
export type Filtros = {
  faixa: Faixa | null
  prontos: boolean
  afastados: boolean
  categoria: 'infantil' | 'adulto' | null
}

export const FILTROS_VAZIOS: Filtros = { faixa: null, prontos: false, afastados: false, categoria: null }

// Ordem de exibição dos chips de faixa: progressão adulta primeiro, depois as
// infantis que não aparecem nela (cinza, amarela, laranja, verde e variações).
export const ORDEM_FAIXAS: Faixa[] = [
  ...FAIXAS_ADULTAS,
  ...FAIXAS_INFANTIS.filter(f => !FAIXAS_ADULTAS.includes(f)),
]

export const temFiltroAtivo = (f: Filtros) =>
  f.faixa !== null || f.prontos || f.afastados || f.categoria !== null

// Aluno sem data_nascimento conta como adulto: a turma é majoritariamente
// adulta e o cadastro costuma vir sem a data, então jogá-lo fora dos dois
// grupos faria o filtro parecer quebrado. Preencher a data corrige sozinho.
export function ehInfantilAluno(aluno: any): boolean {
  return aluno.data_nascimento ? ehInfantil(aluno.data_nascimento) : false
}

export function aplicarFiltros(alunos: any[], f: Filtros, presencasPorGrau: number): any[] {
  return alunos.filter(a => {
    if (f.faixa && a.faixa !== f.faixa) return false
    if (f.prontos && alertaGraduacao(a, a.ultima_graduacao_data ?? null, presencasPorGrau) === null) return false
    if (f.afastados && !estaAfastado(a)) return false
    if (f.categoria === 'infantil' && !ehInfantilAluno(a)) return false
    if (f.categoria === 'adulto'   &&  ehInfantilAluno(a)) return false
    return true
  })
}
