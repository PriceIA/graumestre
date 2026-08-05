import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Aceita tanto a anon key legada (JWT) quanto a nova publishable key (sb_publishable_...).
// Esta chave é pública por design — ela só identifica o projeto. Quem protege
// os dados são as policies de RLS (ver 009_rls_authenticated.sql), não o
// segredo da chave.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // A sessão do professor precisa sobreviver a recarregar a página e a fechar
    // o navegador — sem isso o login teria que ser refeito a cada abertura. O
    // access token dura ~1h e o autoRefresh renova sozinho enquanto o refresh
    // token valer.
    persistSession: true,
    autoRefreshToken: true,
  },
})
