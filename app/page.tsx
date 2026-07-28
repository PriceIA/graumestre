import { supabase } from '@/lib/supabase'
import AppShell from '@/components/AppShell'

export const revalidate = 0 // sempre busca dados frescos

export default async function Home() {
  const { data: alunos } = await supabase
    .from('alunos_frequencia')
    .select('*')
    .order('nome')

  const { data: aulas } = await supabase
    .from('aulas')
    .select('*, presencas(aluno_id, presente)')
    .order('data', { ascending: false })
    .limit(50)

  const { data: professor } = await supabase
    .from('professor_perfil')
    .select('*')
    .single()

  const { data: graduacoes } = await supabase
    .from('graduacoes')
    .select('aluno_id, data')
    .order('data', { ascending: false })

  // primeira ocorrência por aluno = graduação mais recente, já que veio ordenado desc
  const ultimaGraduacaoPorAluno: Record<string, string> = {}
  for (const g of graduacoes ?? []) {
    if (!ultimaGraduacaoPorAluno[g.aluno_id]) ultimaGraduacaoPorAluno[g.aluno_id] = g.data
  }

  const alunosComGraduacao = (alunos ?? []).map(a => ({
    ...a,
    ultima_graduacao_data: ultimaGraduacaoPorAluno[a.id] ?? null,
  }))

  return <AppShell alunosIniciais={alunosComGraduacao} aulasIniciais={aulas ?? []} professorInicial={professor ?? null} />
}
