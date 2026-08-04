import { supabase } from '@/lib/supabase'

// Carrega as listagens ATIVAS — o que está na lixeira (deleted_at preenchido)
// fica de fora de tudo, inclusive das graduações que alimentam
// ultima_graduacao_data e o histórico do aluno.
//
// Vive aqui, e não dentro de app/page.tsx, porque roda nos dois lados: o server
// component usa na carga inicial, e o AppShell usa depois de apagar ou
// restaurar, para as telas refletirem a mudança sem recarregar a página. Se as
// duas versões vivessem separadas elas iam divergir no primeiro filtro novo.
export async function carregarDados() {
  const [{ data: alunos }, { data: aulas }, { data: graduacoes }] = await Promise.all([
    supabase
      .from('alunos_frequencia')
      .select('*')
      .is('deleted_at', null)
      .order('nome'),
    supabase
      .from('aulas')
      .select('*, presencas(aluno_id, presente)')
      .is('deleted_at', null)
      .order('data', { ascending: false })
      .limit(50),
    supabase
      .from('graduacoes')
      .select('*')
      .is('deleted_at', null)
      .order('data', { ascending: false }),
  ])

  // primeira ocorrência por aluno = graduação mais recente, já que veio ordenado desc
  const ultimaGraduacaoPorAluno: Record<string, string> = {}
  const historicoPorAluno: Record<string, any[]> = {}
  for (const g of graduacoes ?? []) {
    if (!ultimaGraduacaoPorAluno[g.aluno_id]) ultimaGraduacaoPorAluno[g.aluno_id] = g.data
    ;(historicoPorAluno[g.aluno_id] ??= []).push(g)
  }

  const alunosComGraduacao = (alunos ?? []).map(a => ({
    ...a,
    ultima_graduacao_data: ultimaGraduacaoPorAluno[a.id] ?? null,
    historico_graduacoes: historicoPorAluno[a.id] ?? [],
  }))

  return { alunos: alunosComGraduacao, aulas: aulas ?? [] }
}
