'use client'

import { House, Users, CalendarDays, Award, Menu } from 'lucide-react'

// Navegação do app: barra de abas embaixo no celular, menu lateral no
// computador. A troca é só CSS (app/globals.css, a partir de 960 px) — o
// componente é o mesmo e não detecta aparelho.
//
// Início, Alunos e Aulas são telas (marcam aria-current). Graduar e Mais são
// ações: abrem o painel de prontos e o menu de sempre, então nunca ficam
// "ativas". Classes de CSS em vez de inline style porque a troca de layout
// precisa de media query, que inline style não tem.

export type Aba = 'inicio' | 'alunos' | 'aulas'

export default function Navegacao({ atual, onIr, onGraduar, onMais, qtdProntos }: {
  atual: Aba | 'lixeira'
  onIr: (aba: Aba) => void
  onGraduar: () => void
  onMais: () => void
  qtdProntos: number
}) {
  const aba = (id: Aba, rotulo: string, Icone: typeof House) => (
    <button
      key={id} type="button" className="nav-item"
      aria-current={atual === id ? 'page' : undefined}
      onClick={() => onIr(id)}
    >
      <Icone aria-hidden="true" />
      {rotulo}
    </button>
  )

  return (
    <nav className="nav" aria-label="Navegação principal">
      <div className="marca">
        <span className="logo" aria-hidden="true">GM</span>
        <b>Grau<br />Mestre</b>
      </div>
      {aba('inicio', 'Início', House)}
      {aba('alunos', 'Alunos', Users)}
      {aba('aulas', 'Aulas', CalendarDays)}
      <button type="button" className="nav-item" onClick={onGraduar}>
        <Award aria-hidden="true" />
        Graduar
        {qtdProntos > 0 && (
          <span className="nav-badge" aria-label={`${qtdProntos} prontos para graduar`}>{qtdProntos}</span>
        )}
      </button>
      <button type="button" className="nav-item" onClick={onMais}>
        <Menu aria-hidden="true" />
        Mais
      </button>
    </nav>
  )
}
