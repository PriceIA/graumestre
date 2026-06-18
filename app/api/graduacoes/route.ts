import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { aluno_id, faixa_anterior, faixa_nova, graus_anterior, graus_novo, notas } = await req.json()

  // 1. Salva no histórico
  const { error: gradErr } = await supabase.from('graduacoes').insert({
    aluno_id, faixa_anterior, faixa_nova, graus_anterior, graus_novo, notas,
    data: new Date().toISOString().split('T')[0],
  })
  if (gradErr) return NextResponse.json({ error: gradErr.message }, { status: 400 })

  // 2. Atualiza o aluno
  const { error: alunoErr } = await supabase
    .from('alunos')
    .update({ faixa: faixa_nova, graus: graus_novo })
    .eq('id', aluno_id)
  if (alunoErr) return NextResponse.json({ error: alunoErr.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
