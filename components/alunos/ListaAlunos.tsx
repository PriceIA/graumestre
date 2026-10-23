'use client'

import { useState } from 'react'
import { grausMaximos, NOMES_FAIXA } from '@/lib/regras-ibjjf'
import { alertaGraduacao } from '@/lib/alertas-graduacao'
import { estaAfastado, motivoAfastamento } from '@/lib/afastamento'
import { agruparPorFaixa, ehInfantilAluno } from '@/lib/alunos'
import { FaixaDesenhada } from '@/components/FaixaDesenhada'

const grausTxt = (g: number) => (g === 0 ? 'sem grau' : g === 1 ? '1 grau' : `${g} graus`)

// Uma linha por aluno, toda tocável. Foto de aluno é URL externa colada à mão:
// `referrerPolicy` impede o host da imagem de receber o endereço do app, e uma
// URL quebrada cai na inicial em vez de deixar o círculo vazio.
export function LinhaAluno({ aluno, presencasPorGrau, aberto, onClick }: {
  aluno: any; presencasPorGrau: number; aberto: boolean; onClick: () => void
}) {
  const [fotoQuebrada, setFotoQuebrada] = useState(false)
  const alerta = alertaGraduacao(aluno, aluno.ultima_graduacao_data ?? null, presencasPorGrau)
  const afastado = estaAfastado(aluno)
  const totalAulas = aluno.total_aulas ?? 0
  const totalPresencas = aluno.total_presencas ?? 0
  const selos = (
    <>
      {alerta && <span className="al-etq alerta" title={alerta.msg}>Pronto</span>}
      {afastado && <span className="al-etq alerta-contorno" title={motivoAfastamento(aluno) ?? 'Afastado'}>Afastado</span>}
    </>
  )

  return (
    <button type="button" className="al-linha" aria-current={aberto} onClick={onClick}>
      <span className="al-av" aria-hidden="true">
        {aluno.foto_url && !fotoQuebrada
          ? <img
              src={aluno.foto_url} alt="" referrerPolicy="no-referrer" onError={() => setFotoQuebrada(true)}
              // erro que aconteceu antes de o React ligar o onError (página vinda do servidor)
              ref={el => { if (el && el.complete && el.naturalWidth === 0) setFotoQuebrada(true) }}
            />
          : (aluno.nome?.[0] ?? '?').toUpperCase()}
      </span>
      <span className="al-nome">{aluno.nome}</span>
      <span className="al-faixa">
        <FaixaDesenhada
          faixa={aluno.faixa} graus={aluno.graus}
          max={grausMaximos(aluno.faixa, ehInfantilAluno(aluno))} size="sm"
        />
      </span>
      <span className="al-meta">
        <span>{NOMES_FAIXA[aluno.faixa as keyof typeof NOMES_FAIXA]}, {grausTxt(aluno.graus)}</span>
        <span className="num">{totalPresencas} de {totalAulas} aulas</span>
        {selos}
      </span>
      {/* Colunas da tabela (computador, a partir de 1240 px). Escondidas no
          celular e nas larguras médias, onde a linha de cima já diz tudo. */}
      <span className="al-col num">
        {totalAulas > 0 ? <>{totalPresencas} de {totalAulas} <span className="suave">({Math.round(totalPresencas / totalAulas * 100)}%)</span></> : '—'}
      </span>
      <span className="al-col st">{alerta || afastado ? selos : <span className="suave">Em dia</span>}</span>
    </button>
  )
}

export function ListaAlunos({ alunos, presencasPorGrau, idAberto, onAbrir }: {
  alunos: any[]; presencasPorGrau: number; idAberto: string | null; onAbrir: (aluno: any) => void
}) {
  return (
    <div className="al-lista">
      <div className="al-cab" aria-hidden="true">
        <span /><span>Nome</span><span>Faixa</span><span>Frequência</span><span>Situação</span>
      </div>
      {agruparPorFaixa(alunos).map(g => (
        <section key={g.faixa} className="al-grupo" aria-label={NOMES_FAIXA[g.faixa]}>
          <h3>
            <span className="al-etq rotulo">{NOMES_FAIXA[g.faixa]}</span>
            <span className="num">{g.alunos.length}</span>
          </h3>
          {g.alunos.map(a => (
            <LinhaAluno
              key={a.id} aluno={a} presencasPorGrau={presencasPorGrau}
              aberto={a.id === idAberto} onClick={() => onAbrir(a)}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
