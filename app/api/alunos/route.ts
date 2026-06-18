import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { id, ...data } = body

  if (id) {
    // Atualizar
    const { error } = await supabase.from('alunos').update(data).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  } else {
    // Criar
    const { error } = await supabase.from('alunos').insert(data)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const { error } = await supabase.from('alunos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
