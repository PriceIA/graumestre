import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { data, presentes, ausentes } = await req.json()
  // data = { data, tecnica, posicao, notas }
  // presentes = string[] de aluno_id
  // ausentes  = string[] de aluno_id

  // 1. Cria a aula
  const { data: aula, error: aulaErr } = await supabase
    .from('aulas')
    .insert(data)
    .select()
    .single()

  if (aulaErr) return NextResponse.json({ error: aulaErr.message }, { status: 400 })

  // 2. Insere presenças
  const registros = [
    ...presentes.map((aluno_id: string) => ({ aula_id: aula.id, aluno_id, presente: true  })),
    ...ausentes.map( (aluno_id: string) => ({ aula_id: aula.id, aluno_id, presente: false })),
  ]

  if (registros.length > 0) {
    const { error: presErr } = await supabase.from('presencas').insert(registros)
    if (presErr) return NextResponse.json({ error: presErr.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, aula })
}
