import { supabase } from '@/lib/supabase'
import { carregarDados } from '@/lib/carregar-dados'
import AppShell from '@/components/AppShell'

export const revalidate = 0 // sempre busca dados frescos

export default async function Home() {
  // filtra deleted_at is null nas 3 tabelas — ver lib/carregar-dados.ts
  const { alunos, aulas } = await carregarDados()

  const { data: professor } = await supabase
    .from('professor_perfil')
    .select('*')
    .single()

  return <AppShell alunosIniciais={alunos} aulasIniciais={aulas} professorInicial={professor ?? null} />
}
