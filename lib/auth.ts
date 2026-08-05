'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Estado da sessão do professor.
//
//   'carregando' -> ainda lendo o storage; NÃO renderize login nem app aqui,
//                   senão a tela de login pisca a cada F5 antes da sessão
//                   salva ser lida.
//   'anonimo'    -> sem sessão, mostra o login
//   'logado'     -> sessão válida, mostra o app
export type EstadoSessao = 'carregando' | 'anonimo' | 'logado'

export function useSessao(): { estado: EstadoSessao; sessao: Session | null } {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let vivo = true

    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return
      setSessao(data.session)
      setCarregando(false)
    })

    // Cobre login, logout, refresh de token e a sessão sendo encerrada em outra
    // aba. Sem isso, sair numa aba deixaria a outra achando que ainda está
    // logada até o próximo reload.
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      if (!vivo) return
      setSessao(novaSessao)
      setCarregando(false)
    })

    return () => {
      vivo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return {
    estado: carregando ? 'carregando' : sessao ? 'logado' : 'anonimo',
    sessao,
  }
}

export function sair() {
  return supabase.auth.signOut()
}
