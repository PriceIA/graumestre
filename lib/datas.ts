// ============================================================
// GrauMestre — "Hoje" é o dia de São Paulo (G4)
//
// Única fonte de "que dia é hoje" do app. Nunca use
// `new Date().toISOString().split('T')[0]`: isso é o dia em UTC, e às 21h
// de Brasília já é meia-noite lá — a aula lançada depois do treino saía
// com a data de amanhã (aconteceu: a aula de terça 08/09 foi gravada como
// quarta 09/09).
//
// Também nunca leia o ano de uma data com `new Date('2013-01-01')`: o texto
// sem hora é meia-noite UTC, que no Brasil ainda é 31/12 às 21h, e quem
// nasceu em 1º de janeiro ganhava um ano.
//
// Funções puras, sem import: os testes (scripts/datas.test.mjs) rodam este
// arquivo direto no Node.
// ============================================================

const FUSO_BRASIL = 'America/Sao_Paulo'

// en-CA formata como AAAA-MM-DD, o mesmo formato das colunas `date`.
const formatoDia = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_BRASIL, year: 'numeric', month: '2-digit', day: '2-digit',
})

/** Dia de hoje em São Paulo, 'AAAA-MM-DD' — independe do fuso do aparelho. */
export function hojeBrasil(agora: Date = new Date()): string {
  return formatoDia.format(agora)
}

/** Ano de uma data 'AAAA-MM-DD', lido do texto — sem passar por fuso. */
export function anoDaData(data: string): number {
  return Number(data.slice(0, 4))
}
