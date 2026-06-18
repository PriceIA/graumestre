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

  return <AppShell alunosIniciais={alunos ?? []} aulasIniciais={aulas ?? []} />
}
