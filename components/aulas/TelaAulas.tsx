'use client'

import { separarAulas } from '@/lib/aulas-dia'
import { hojeBrasil } from '@/lib/datas'
import { EtiquetaAulaDoDia } from '@/components/aulas/EtiquetaAulaDoDia'
import { CartaoAula } from '@/components/aulas/CartaoAula'

// A tela de Aulas: a etiqueta "Aula do dia" e, embaixo, "Próximas" (só se
// houver) e "Aulas dadas". As aulas e o estado dos modais moram no AppShell;
// aqui só se decide o que mostrar e se avisa o que foi tocado.
export function TelaAulas({ aulas, onAbrirChamada, onEditar, onNovaAula, onUrlRenovada }: {
  aulas: any[]
  onAbrirChamada: (aula: any) => void
  onEditar: (aula: any) => void
  onNovaAula: () => void
  onUrlRenovada: (id: string, url: string) => void
}) {
  // "hoje" a cada render, nunca guardado: o app aberto às 23h50 vira o dia.
  const hoje = hojeBrasil()
  const { doDia, proximas, dadas } = separarAulas(aulas, hoje)

  const cartao = (a: any, futura: boolean) => (
    <CartaoAula
      key={a.id} aula={a} futura={futura} hoje={hoje}
      onAbrir={() => onAbrirChamada(a)} onEditar={() => onEditar(a)}
      onUrlRenovada={url => onUrlRenovada(a.id, url)}
    />
  )

  return (
    <div>
      <EtiquetaAulaDoDia
        aula={doDia} onAbrirChamada={onAbrirChamada} onEditar={onEditar}
        onNovaAula={onNovaAula} onUrlRenovada={onUrlRenovada}
      />

      {proximas.length > 0 && (
        <section className="au-secao" aria-label="Próximas">
          <h3 className="au-secao-tit">Próximas <span className="num">{proximas.length}</span></h3>
          <div className="au-grade">{proximas.map(a => cartao(a, true))}</div>
        </section>
      )}

      <section className="au-secao" aria-label="Aulas dadas">
        <h3 className="au-secao-tit">Aulas dadas <span className="num">{dadas.length}</span></h3>
        {dadas.length === 0
          ? <p className="au-vazio">Nenhuma aula dada ainda.</p>
          : <div className="au-grade">{dadas.map(a => cartao(a, false))}</div>}
      </section>
    </div>
  )
}
