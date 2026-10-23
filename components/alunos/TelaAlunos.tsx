'use client'

import { aplicarFiltros, type Filtros } from '@/lib/alunos'
import { casaBusca } from '@/lib/busca'
import { BarraFiltros } from '@/components/alunos/FiltrosAlunos'
import { ListaAlunos } from '@/components/alunos/ListaAlunos'

// A tela de Alunos: busca + filtros no alto, lista agrupada por faixa embaixo.
// Os alunos, os filtros e a busca moram no AppShell (sobrevivem à troca de aba);
// aqui só se decide o que mostrar. "Pronto" e "afastado" vêm de
// alertaGraduacao()/estaAfastado(), as mesmas funções do resto do app.
export function TelaAlunos({ alunos, filtros, setFiltros, busca, setBusca, presencasPorGrau, idAberto, onAbrir, onAbrirFiltros }: {
  alunos: any[]
  filtros: Filtros; setFiltros: React.Dispatch<React.SetStateAction<Filtros>>
  busca: string; setBusca: (v: string) => void
  presencasPorGrau: number
  idAberto: string | null
  onAbrir: (aluno: any) => void
  onAbrirFiltros: () => void
}) {
  const visiveis = aplicarFiltros(alunos, filtros, presencasPorGrau).filter(a => casaBusca(a.nome, busca))

  return (
    <>
      <BarraFiltros
        alunos={alunos} filtros={filtros} setFiltros={setFiltros}
        busca={busca} setBusca={setBusca}
        totalVisivel={visiveis.length} onAbrirPainel={onAbrirFiltros}
      />
      {visiveis.length === 0 ? (
        <div className="al-vazio" role="status">
          {busca.trim() !== '' ? `Nenhum aluno com "${busca.trim()}".` : 'Nenhum aluno com esses filtros.'}
        </div>
      ) : (
        <ListaAlunos alunos={visiveis} presencasPorGrau={presencasPorGrau} idAberto={idAberto} onAbrir={onAbrir} />
      )}
    </>
  )
}
