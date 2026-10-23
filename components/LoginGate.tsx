'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSessao } from '@/lib/auth'
import { theme as t } from '@/lib/cores'

// Gate no topo do app: sem sessão, nada do app é montado — nem a UI, nem as
// queries. Não há redirect nem middleware porque o app é de uma rota só; um
// gate de componente resolve com muito menos peça móvel.
//
// Isto é conforto de navegação, não a proteção em si: quem protege os dados
// são as policies de RLS (009_rls_authenticated.sql). Mesmo que alguém
// contornasse esta tela, o PostgREST recusaria toda leitura e escrita sem um
// token válido.


// O professor entra com um apelido, não com e-mail: é o que ele lembra e o que
// se digita rápido no celular. O Supabase Auth exige e-mail, então montamos um
// aqui. O domínio não precisa existir de verdade nem receber e-mail — só serve
// de identificador único. A conta em Authentication > Users tem que ser criada
// exatamente com este formato: apelido@graumestre.app.
const DOMINIO_LOGIN = 'graumestre.app'

function emailDoUsuario(usuario: string): string {
  const limpo = usuario.trim().toLowerCase().replace(/\s+/g, '')
  // Digitou o e-mail inteiro? Aceita em vez de montar
  // "pedro@graumestre.app@graumestre.app" e devolver "usuário ou senha
  // incorretos" sem nenhuma pista do motivo.
  return limpo.includes('@') ? limpo : `${limpo}@${DOMINIO_LOGIN}`
}

function TelaLogin() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  const entrar = async () => {
    if (!usuario.trim() || !senha) {
      setErro('Preencha usuário e senha.')
      return
    }
    setEntrando(true)
    setErro(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: emailDoUsuario(usuario),
      password: senha,
    })

    if (error) {
      // A mensagem do Supabase vem em inglês e é genérica de propósito (não
      // revela se o e-mail existe). Mantemos essa discrição em português.
      setErro(
        error.message === 'Invalid login credentials'
          ? 'Usuário ou senha incorretos.'
          : `Não foi possível entrar: ${error.message}`
      )
      setEntrando(false)
      return
    }
    // Sucesso não mexe em estado local: o onAuthStateChange do useSessao troca
    // a tela sozinho, e este componente desmonta.
  }

  return (
    <div style={{
      minHeight: '100vh', background: t.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            color: t.text, fontSize: 28, fontWeight: 900, letterSpacing: 2,
            textTransform: 'uppercase', fontFamily: 'var(--font-display), sans-serif',
          }}>
            GrauMestre
          </div>
          <div style={{ color: t.textMute, fontSize: 12, fontFamily: t.ui, marginTop: 6 }}>
            Acesso do professor
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>
              Usuário
            </div>
            <input
              type="text" value={usuario} onChange={e => setUsuario(e.target.value)}
              placeholder="ex.: pedrobenedetti"
              autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
              onKeyDown={e => { if (e.key === 'Enter') entrar() }}
              style={{
                width: '100%', background: t.inputBg, border: `1px solid ${t.border2}`,
                borderRadius: 'var(--r)', padding: '12px 14px', color: t.text, fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <div style={{ color: t.textMute, fontSize: 11, fontFamily: t.ui, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1 }}>
              Senha
            </div>
            <input
              type="password" value={senha} onChange={e => setSenha(e.target.value)}
              autoComplete="current-password"
              onKeyDown={e => { if (e.key === 'Enter') entrar() }}
              style={{
                width: '100%', background: t.inputBg, border: `1px solid ${t.border2}`,
                borderRadius: 'var(--r)', padding: '12px 14px', color: t.text, fontSize: 15,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {erro && (
          <div style={{
            padding: 12, borderRadius: 'var(--r)', background: t.erroBg,
            border: `1px solid ${t.erro}`, color: t.erroTexto, fontSize: 12, lineHeight: 1.5,
          }}>
            ⚠ {erro}
          </div>
        )}

        <button
          onClick={entrar} disabled={entrando}
          style={{
            padding: 14, borderRadius: 'var(--r)', border: 'none', background: t.ativo,
            color: t.sobreAtivo, fontWeight: 800, fontSize: 15,
            cursor: entrando ? 'not-allowed' : 'pointer',
            opacity: entrando ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          {entrando ? 'Entrando…' : 'Entrar'}
        </button>

        <div style={{ color: t.textMute, fontSize: 11, textAlign: 'center', lineHeight: 1.6 }}>
          Não há cadastro público. A conta do professor é criada direto no
          painel do Supabase, como <span style={{ fontFamily: t.ui }}>usuário@{DOMINIO_LOGIN}</span>.
        </div>
      </div>
    </div>
  )
}

export default function LoginGate({ children }: { children: React.ReactNode }) {
  const { estado } = useSessao()

  // Nada na tela enquanto a sessão salva é lida: renderizar o login aqui faria
  // ele piscar a cada recarga antes de o storage responder.
  if (estado === 'carregando') {
    return <div style={{ minHeight: '100vh', background: t.bg }} />
  }
  if (estado === 'anonimo') return <TelaLogin />
  return <>{children}</>
}
