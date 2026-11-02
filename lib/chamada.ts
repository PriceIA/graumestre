// Contas puras da Chamada (G7): placar, filtro, selos, textos e planos de
// gravação/desfazer. Sem import de propósito (como lib/aulas-dia.ts):
// scripts/chamada.test.mjs carrega este arquivo direto no Node.
//
// "Pronto" e "afastado antes desta aula" chegam já decididos em LinhaInfo —
// quem os calcula é alertaGraduacao() e estaAfastado()/aulasPerdidasAte(), nunca
// uma conta daqui (uma pergunta, uma função).

export type FiltroChamada = 'prontos' | 'voltaram' | null

export type LinhaInfo = {
  id: string
  nome: string
  presente: boolean
  pronto: boolean
  afastadoAntes: boolean
  confirmadoPor: string | null
}

/** aluno_id → presente. Ausente = sem registro nesta aula. */
export type Mapa = Record<string, boolean>

/** `novos`: o que gravar agora. `desfazer`: o que gravar para voltar ao de antes. */
export type Plano = { novos: Mapa; desfazer: Mapa }

export type Selo = 'PRONTO' | 'AFASTADO' | 'VOLTOU' | 'AGUARDA REVISÃO'

// O número do placar conta só quem está presente; o filtro (abaixo) mostra
// todos. Por isso "2 de 5 prontos" tem dois números.
export function contarPlacar(linhas: LinhaInfo[]) {
  const presentes = linhas.filter(l => l.presente)
  return {
    presentes: presentes.length,
    total: linhas.length,
    prontos: presentes.filter(l => l.pronto).length,
    voltaram: presentes.filter(l => l.afastadoAntes).length,
  }
}

// Filtro e busca juntos: a lista visível é a interseção.
export function filtrarLinhas(
  linhas: LinhaInfo[], filtro: FiltroChamada, casa: (nome: string) => boolean,
): LinhaInfo[] {
  return linhas.filter(l =>
    casa(l.nome) &&
    (filtro === null || (filtro === 'prontos' ? l.pronto : l.afastadoAntes)),
  )
}

// "marcados de total" sobre TODOS os que cumprem o filtro, com a busca fora.
export function textoFiltro(filtro: Exclude<FiltroChamada, null>, linhas: LinhaInfo[]): string {
  const doFiltro = linhas.filter(l => (filtro === 'prontos' ? l.pronto : l.afastadoAntes))
  if (doFiltro.length === 0) {
    return filtro === 'prontos'
      ? 'Nenhum aluno pronto para graduar'
      : 'Nenhum aluno estava afastado antes desta aula'
  }
  const marcados = doFiltro.filter(l => l.presente).length
  return `${marcados} de ${doFiltro.length} ${filtro === 'prontos' ? 'prontos' : 'afastados'}`
}

// `restrito` = há busca ou filtro ligado: o texto diz quantos vai marcar.
export function textoMarcarTodos(naoMarcados: number, restrito: boolean): string {
  if (!restrito) return 'Marcar todos'
  return naoMarcados === 1 ? 'Marcar 1 da lista' : `Marcar os ${naoMarcados} da lista`
}

// Ordem dos selos: a mesma da linha. AFASTADO é de quem ainda não foi marcado;
// marcado, vira VOLTOU. AGUARDA REVISÃO é o lugar reservado da Parte 2: só
// acende com confirmado_por === 'aluno' (hoje nunca acontece).
export function selosDaLinha(l: LinhaInfo): Selo[] {
  const selos: Selo[] = []
  if (l.pronto) selos.push('PRONTO')
  if (l.afastadoAntes) selos.push(l.presente ? 'VOLTOU' : 'AFASTADO')
  if (l.presente && l.confirmadoPor === 'aluno') selos.push('AGUARDA REVISÃO')
  return selos
}

// Quem não tinha registro volta como "não presente" (false): o app nunca
// apaga linha de presença.
export function planoAlternar(id: string, mapa: Mapa): Plano {
  const antes = mapa[id] ?? false
  return { novos: { [id]: !antes }, desfazer: { [id]: antes } }
}

// Só os ainda não marcados entram: quem já estava presente fica de fora dos
// dois lados, então desfazer não o desmarca.
export function planoMarcarTodos(ids: string[], mapa: Mapa): Plano {
  const novos: Mapa = {}
  const desfazer: Mapa = {}
  for (const id of ids) {
    if (mapa[id]) continue
    novos[id] = true
    desfazer[id] = false
  }
  return { novos, desfazer }
}

// Só os ids que ainda estão na lista: aluno apagado com a chamada aberta não
// pode ganhar linha de presença por um Desfazer.
export function planoDesfazer(acao: Plano, idsNaLista: string[]): Mapa {
  const ainda = new Set(idsNaLista)
  const m: Mapa = {}
  for (const [id, v] of Object.entries(acao.desfazer)) if (ainda.has(id)) m[id] = v
  return m
}
