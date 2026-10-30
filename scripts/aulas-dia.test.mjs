import test from 'node:test'
import assert from 'node:assert/strict'
import { separarAulas } from '../lib/aulas-dia.ts'

const hoje = '2026-10-23'
const aula = (id, data, created_at = null) => ({ id, data, created_at })
const ids = lista => lista.map(a => a.id)

test('sem aulas devolve tudo vazio', () => {
  assert.deepEqual(separarAulas([], hoje), { doDia: null, proximas: [], dadas: [] })
})

test('sem aula hoje: doDia é null, futuras em proximas, passadas em dadas', () => {
  const r = separarAulas([aula('a', '2026-10-20'), aula('b', '2026-10-30')], hoje)
  assert.equal(r.doDia, null)
  assert.deepEqual(ids(r.proximas), ['b'])
  assert.deepEqual(ids(r.dadas), ['a'])
})

test('duas aulas hoje: a última lançada é a do dia e a outra vai para dadas', () => {
  const r = separarAulas([
    aula('a', hoje, '2026-10-23T22:00:00Z'),
    aula('b', hoje, '2026-10-23T23:30:00Z'),
  ], hoje)
  assert.equal(r.doDia.id, 'b')
  assert.deepEqual(ids(r.dadas), ['a'])
})

test('duas aulas hoje sem created_at: fica a primeira da entrada', () => {
  const r = separarAulas([aula('a', hoje), aula('b', hoje)], hoje)
  assert.equal(r.doDia.id, 'a')
  assert.deepEqual(ids(r.dadas), ['b'])
})

test('proximas em ordem crescente de data', () => {
  const r = separarAulas([aula('a', '2026-10-30'), aula('b', '2026-10-25'), aula('c', '2026-11-02')], hoje)
  assert.deepEqual(ids(r.proximas), ['b', 'a', 'c'])
})

test('dadas: as outras de hoje primeiro, depois da mais nova para a mais velha', () => {
  const r = separarAulas([
    aula('velha', '2026-10-01'),
    aula('h1', hoje, '2026-10-23T10:00:00Z'),
    aula('ontem', '2026-10-20'),
    aula('h2', hoje, '2026-10-23T12:00:00Z'),
  ], hoje)
  assert.equal(r.doDia.id, 'h2')
  assert.deepEqual(ids(r.dadas), ['h1', 'ontem', 'velha'])
})

test('nenhuma aula some nem se repete', () => {
  const entrada = [
    aula('a', '2026-10-01'), aula('b', hoje, '2026-10-23T10:00:00Z'), aula('c', '2026-11-02'),
    aula('d', hoje, '2026-10-23T11:00:00Z'), aula('e', '2026-10-22'), aula('f', '2026-10-24'),
    aula('g', '2026-09-30'), aula('h', hoje, null),
  ]
  const r = separarAulas(entrada, hoje)
  const saida = [r.doDia, ...r.proximas, ...r.dadas].filter(x => x !== null)
  assert.deepEqual(ids(saida).sort(), ids(entrada).sort())
  assert.equal(new Set(ids(saida)).size, entrada.length)
})

test('não altera a lista de entrada', () => {
  const entrada = [aula('a', '2026-10-30'), aula('b', '2026-10-25')]
  separarAulas(entrada, hoje)
  assert.deepEqual(ids(entrada), ['a', 'b'])
})
