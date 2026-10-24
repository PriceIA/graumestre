import test from 'node:test'
import assert from 'node:assert/strict'
import { hojeBrasil, anoDaData, dataCurta } from '../lib/datas.ts'

// Cada caso roda com o processo em três fusos: o resultado não pode depender
// do relógio da máquina, só do instante. O Node relê process.env.TZ a cada
// troca.
const FUSOS = ['UTC', 'America/Sao_Paulo', 'Asia/Tokyo']

function emCadaFuso(fn) {
  const original = process.env.TZ
  try {
    for (const tz of FUSOS) {
      process.env.TZ = tz
      fn(tz)
    }
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
}

// Instantes escritos com o offset de Brasília (-03:00), para o caso ler como
// o professor vive a hora.
const casosHoje = [
  ['20h59 ainda é o mesmo dia',            '2026-09-08T20:59:59-03:00', '2026-09-08'],
  ['21h00 ainda é o mesmo dia (bug G4)',   '2026-09-08T21:00:00-03:00', '2026-09-08'],
  ['23h42 da aula de 08/09 (bug real)',    '2026-09-08T23:42:39-03:00', '2026-09-08'],
  ['23h59:59 ainda é o mesmo dia',         '2026-09-08T23:59:59-03:00', '2026-09-08'],
  ['meia-noite vira o dia',                '2026-09-09T00:00:00-03:00', '2026-09-09'],
  ['31/12 às 23h não é ano novo',          '2026-12-31T23:00:00-03:00', '2026-12-31'],
  ['1º/01 à meia-noite é ano novo',        '2027-01-01T00:00:00-03:00', '2027-01-01'],
  ['29/02 bissexto às 21h continua 29/02', '2028-02-29T21:00:00-03:00', '2028-02-29'],
  ['28/02 não bissexto às 21h não pula',   '2027-02-28T21:00:00-03:00', '2027-02-28'],
  ['28/02 bissexto às 23h59 não pula',     '2028-02-28T23:59:59-03:00', '2028-02-28'],
]

for (const [nome, instante, esperado] of casosHoje) {
  test(`hojeBrasil: ${nome}`, () => {
    emCadaFuso(tz => assert.equal(hojeBrasil(new Date(instante)), esperado, `TZ=${tz}`))
  })
}

test('hojeBrasil sem argumento devolve AAAA-MM-DD', () => {
  assert.match(hojeBrasil(), /^\d{4}-\d{2}-\d{2}$/)
})

// Idade pela regra da IBJJF (art. 2.2.1): ano corrente − ano de nascimento.
const idade = (nascimento, agora) => anoDaData(hojeBrasil(new Date(agora))) - anoDaData(nascimento)

const casosIdade = [
  ['nascido em 1º/01 (bug G4)',        '2013-01-01', '2026-10-23T12:00:00-03:00', 13],
  ['nascido em 31/12',                 '2013-12-31', '2026-10-23T12:00:00-03:00', 13],
  ['nascido em 29/02 bissexto',        '2012-02-29', '2026-10-23T12:00:00-03:00', 14],
  ['31/12 às 23h ainda conta o ano velho', '2010-01-01', '2026-12-31T23:00:00-03:00', 16],
  ['1º/01 à meia-noite já conta o ano novo', '2010-01-01', '2027-01-01T00:00:00-03:00', 17],
]

for (const [nome, nascimento, agora, esperado] of casosIdade) {
  test(`idade: ${nome}`, () => {
    emCadaFuso(tz => assert.equal(idade(nascimento, agora), esperado, `TZ=${tz}`))
  })
}

test('anoDaData lê o ano do texto, sem passar por fuso', () => {
  emCadaFuso(tz => {
    assert.equal(anoDaData('2013-01-01'), 2013, `TZ=${tz}`)
    assert.equal(anoDaData('2000-12-31'), 2000, `TZ=${tz}`)
  })
})

// Registro do defeito que a G4 corrigiu: era assim que calcularIdade lia o ano.
test('o jeito antigo erra 1º de janeiro no fuso do Brasil', () => {
  const original = process.env.TZ
  process.env.TZ = 'America/Sao_Paulo'
  try {
    assert.equal(new Date('2013-01-01').getFullYear(), 2012)
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
})

// Data curta do card de aula (G6): dia da semana vem do calendário, nunca de
// new Date('AAAA-MM-DD'), então não pode depender do fuso do processo.
const casosDataCurta = [
  ['mesmo ano, hoje',              '2026-10-23', '2026-10-23', 'sex, 23 out'],
  ['mesmo ano, dia sem zero',      '2026-09-08', '2026-10-23', 'ter, 8 set'],
  ['1º de janeiro do mesmo ano',   '2026-01-01', '2026-10-23', 'qui, 1 jan'],
  ['ano passado mostra o ano',     '2025-12-31', '2026-10-23', 'qua, 31 dez 2025'],
  ['ano que vem mostra o ano',     '2027-01-04', '2026-10-23', 'seg, 4 jan 2027'],
]

for (const [nome, data, hoje, esperado] of casosDataCurta) {
  test(`dataCurta: ${nome}`, () => {
    emCadaFuso(tz => assert.equal(dataCurta(data, hoje), esperado, `TZ=${tz}`))
  })
}
