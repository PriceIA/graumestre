import LoginGate from '@/components/LoginGate'
import AppShell from '@/components/AppShell'

// A carga de dados vive no cliente, não aqui. Com a RLS exigindo
// `authenticated` (009_rls_authenticated.sql), buscar no servidor voltaria
// vazio: o token do professor está no browser, e este componente roda sem
// nenhuma sessão. O AppShell busca tudo ao montar, já com a sessão em mãos.
export default function Home() {
  return (
    <LoginGate>
      <AppShell />
    </LoginGate>
  )
}
