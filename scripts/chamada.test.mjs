import test from 'node:test'
import assert from 'node:assert/strict'
import {
  contarPlacar, filtrarLinhas, textoFiltro, textoMarcarTodos, selosDaLinha,
  planoAlternar, planoMarcarTodos, planoDesfazer,
} from '../lib/chamada.ts'

const linha = (id, o = {}) => ({
  id, nome: `Aluno ${id}`, presente: false, pronto: false, afastadoAntes: false, confirmadoPor: null, ...o,
})
const todos = () => true

test('placar conta pronto e voltou só entre os presentes', () => {
  const linhas = [
    linha('a', { presente: true }),
    linha('b', { presente: true, pronto: true }),
    linha('c', { presente: true, afastadoAntes: true }),
    linha('d', { pronto: true }),
    linha('e', { afastadoAntes: true }),
  ]
  assert.deepEqual(contarPlacar(linhas), { presentes: 3, total: 5, prontos: 1, voltaram: 1 })
})

test('filtro mostra marcados e não marcados', () => {
  const linhas = [
    linha('a', { presente: true, pronto: true }), linha('b', { pronto: true }),
    linha('c', { presente: true, afastadoAntes: true }), linha('d', { afastadoAntes: true }), linha('e'),
  ]
  assert.deepEqual(filtrarLinhas(linhas, 'prontos', todos).map(l => l.id), ['a', 'b'])
  assert.deepEqual(filtrarLinhas(linhas, 'voltaram', todos).map(l => l.id), ['c', 'd'])
  assert.deepEqual(filtrarLinhas(linhas, null, todos).map(l => l.id), ['a', 'b', 'c', 'd', 'e'])
})

test('busca e filtro juntos dão a interseção', () => {
  const linhas = [linha('a', { pronto: true }), linha('b', { pronto: true }), linha('c')]
  const soB = nome => nome === 'Aluno b'
  assert.deepEqual(filtrarLinhas(linhas, 'prontos', soB).map(l => l.id), ['b'])
  assert.deepEqual(filtrarLinhas(linhas, null, soB).map(l => l.id), ['b'])
  assert.deepEqual(filtrarLinhas([linha('c')], 'prontos', soB), [])
})

test('texto do filtro diz marcados de total, e a frase de total zero', () => {
  const cinco = [
    linha('a', { presente: true, pronto: true }), linha('b', { presente: true, pronto: true }),
    linha('c', { pronto: true }), linha('d', { pronto: true }), linha('e', { pronto: true }),
  ]
  assert.equal(textoFiltro('prontos', cinco), '2 de 5 prontos')
  const tres = [linha('a', { presente: true, afastadoAntes: true }), linha('b', { afastadoAntes: true }), linha('c', { afastadoAntes: true })]
  assert.equal(textoFiltro('voltaram', tres), '1 de 3 afastados')
  assert.equal(textoFiltro('prontos', [linha('x')]), 'Nenhum aluno pronto para graduar')
  assert.equal(textoFiltro('voltaram', [linha('x')]), 'Nenhum aluno estava afastado antes desta aula')
})

test('texto do botão: todos, 1 da lista, os N da lista', () => {
  assert.equal(textoMarcarTodos(9, false), 'Marcar todos')
  assert.equal(textoMarcarTodos(1, true), 'Marcar 1 da lista')
  assert.equal(textoMarcarTodos(2, true), 'Marcar os 2 da lista')
  assert.equal(textoMarcarTodos(0, false), 'Marcar todos')
})

test('selos: PRONTO, AFASTADO, VOLTOU e AGUARDA REVISÃO', () => {
  assert.deepEqual(selosDaLinha(linha('a', { pronto: true })), ['PRONTO'])
  assert.deepEqual(selosDaLinha(linha('a', { afastadoAntes: true })), ['AFASTADO'])
  assert.deepEqual(selosDaLinha(linha('a', { afastadoAntes: true, presente: true })), ['VOLTOU'])
  assert.deepEqual(selosDaLinha(linha('a', { pronto: true, afastadoAntes: true, presente: true })), ['PRONTO', 'VOLTOU'])
  assert.deepEqual(selosDaLinha(linha('a', { presente: true, confirmadoPor: 'aluno' })), ['AGUARDA REVISÃO'])
  assert.deepEqual(selosDaLinha(linha('a', { presente: true, confirmadoPor: 'professor' })), [])
  assert.deepEqual(selosDaLinha(linha('a', { confirmadoPor: 'aluno' })), [])
})

test('alternar: sem registro vira presente e desfaz para false; presente vira false e desfaz para true', () => {
  assert.deepEqual(planoAlternar('a', {}), { novos: { a: true }, desfazer: { a: false } })
  assert.deepEqual(planoAlternar('a', { a: true }), { novos: { a: false }, desfazer: { a: true } })
  assert.deepEqual(planoAlternar('a', { a: false }), { novos: { a: true }, desfazer: { a: false } })
})

test('marcar todos só mexe em quem não estava marcado', () => {
  const plano = planoMarcarTodos(['a', 'b', 'c'], { a: true, b: false })
  assert.deepEqual(plano, { novos: { b: true, c: true }, desfazer: { b: false, c: false } })
})

test('marcar todos sem ninguém para marcar devolve plano vazio', () => {
  assert.deepEqual(planoMarcarTodos(['a'], { a: true }), { novos: {}, desfazer: {} })
  assert.deepEqual(planoMarcarTodos([], {}), { novos: {}, desfazer: {} })
})

test('desfazer só a última: usa os valores de antes dela, não os da anterior', () => {
  const mapa = {}
  const p1 = planoAlternar('a', mapa); Object.assign(mapa, p1.novos)
  const p2 = planoAlternar('b', mapa); Object.assign(mapa, p2.novos)
  assert.deepEqual(planoDesfazer(p2, ['a', 'b']), { b: false })
})

test('desfazer ignora quem saiu da lista', () => {
  const acao = { novos: { a: true, b: true }, desfazer: { a: false, b: false } }
  assert.deepEqual(planoDesfazer(acao, ['a']), { a: false })
  assert.deepEqual(planoDesfazer(acao, []), {})
})

test('desfazer marcar-todos devolve cada um ao valor de antes; quem já estava presente fica de fora', () => {
  const mapa = { a: true }
  const acao = planoMarcarTodos(['a', 'b', 'c'], mapa)
  assert.deepEqual(planoDesfazer(acao, ['a', 'b', 'c']), { b: false, c: false })
})
