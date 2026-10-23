import test from 'node:test'
import assert from 'node:assert/strict'
import { casaBusca, agruparNaOrdem } from '../lib/busca.ts'

test('casaBusca ignora acento e maiúscula', () => {
  assert.equal(casaBusca('João Pedro', 'joao'), true)
  assert.equal(casaBusca('João Pedro', 'JOÃO'), true)
  assert.equal(casaBusca('joao', 'João'), true)
})

test('casaBusca ignora espaço nas pontas do termo e acha no meio do nome', () => {
  assert.equal(casaBusca('João Pedro', ' pedro '), true)
})

test('casaBusca não acha quem não tem o termo', () => {
  assert.equal(casaBusca('Ana', 'joao'), false)
})

test('casaBusca com termo vazio ou só espaços casa todo mundo', () => {
  assert.equal(casaBusca('Ana', ''), true)
  assert.equal(casaBusca('Ana', '   '), true)
})

test('agruparNaOrdem segue a ordem dada, esconde grupo vazio e mantém a ordem interna', () => {
  const itens = [{ f: 'azul', n: 1 }, { f: 'branca', n: 2 }, { f: 'azul', n: 3 }]
  assert.deepEqual(agruparNaOrdem(itens, x => x.f, ['preta', 'azul', 'branca']), [
    { chave: 'azul', itens: [{ f: 'azul', n: 1 }, { f: 'azul', n: 3 }] },
    { chave: 'branca', itens: [{ f: 'branca', n: 2 }] },
  ])
})

test('agruparNaOrdem não perde item com chave fora da ordem: vai para o fim', () => {
  assert.deepEqual(agruparNaOrdem([{ f: 'x' }, { f: 'azul' }], x => x.f, ['azul']), [
    { chave: 'azul', itens: [{ f: 'azul' }] },
    { chave: 'x', itens: [{ f: 'x' }] },
  ])
})
