import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Evita que a Vercel cacheie a resposta: o ping tem que bater no banco de verdade.
export const dynamic = 'force-dynamic'

// Chamada pelo Vercel Cron (vercel.json). A Vercel envia
// `Authorization: Bearer <CRON_SECRET>` sozinha quando a variável existe.
// Usa só a chave pública — nunca a service_role.
export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET
  // Sem CRON_SECRET definido a rota recusa tudo: nunca "aberta por padrão".
  if (!segredo || request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const { error } = await supabase.rpc('ping')
  if (error) {
    return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
