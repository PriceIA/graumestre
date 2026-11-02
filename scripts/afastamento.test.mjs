import test from 'node:test'
import assert from 'node:assert/strict'
import { aulasPerdidasAte, estaAfastado } from '../lib/afastamento.ts'

const ALUNO = 'a1'
const aula = (dia, presente) => ({
  data: `2026-10-${dia}`,
  presencas: presente === undefined ? [] : [{ aluno_id: ALUNO, presente }],
})
const dias = (...ds) => ds.map(d => aula(d))

test('sem aulas: nada perdido e nenhuma presença', () => {
  assert.deepEqual(aulasPerdidasAte(ALUNO, null, [], null), { perdidas: 0, ultimaPresenca: null })
})

test('presença no meio: conta só as aulas depois dela', () => {
  const aulas = [aula('01'), aula('02', true), aula('03'), aula('04')]
  assert.deepEqual(aulasPerdidasAte(ALUNO, null, aulas, null), { perdidas: 2, ultimaPresenca: '2026-10-02' })
})

test('presente = false não conta como presença', () => {
  const aulas = [aula('01'), aula('02', true), aula('03'), aula('04', false)]
  assert.deepEqual(aulasPerdidasAte(ALUNO, null, aulas, null), { perdidas: 2, ultimaPresenca: '2026-10-02' })
})

test('nunca veio: conta as aulas desde a matrícula', () => {
  const r = aulasPerdidasAte(ALUNO, '2026-10-03', dias('01', '02', '03', '04', '05'), null)
  assert.deepEqual(r, { perdidas: 3, ultimaPresenca: null })
})

test('corte exclui a aula do corte, as do mesmo dia e as depois', () => {
  const aulas = [aula('01'), aula('02'), aula('03'), aula('04'), aula('05'), aula('06'), aula('07', true), aula('07'), aula('08')]
  const r = aulasPerdidasAte(ALUNO, '2026-10-01', aulas, '2026-10-07')
  assert.deepEqual(r, { perdidas: 6, ultimaPresenca: null })
})

test('seis perdidas antes do corte dão afastado; a presença do dia do corte não desfaz', () => {
  const aulas = [aula('01', true), aula('02'), aula('03'), aula('04'), aula('05'), aula('06'), aula('07'), aula('08', true)]
  const r = aulasPerdidasAte(ALUNO, '2026-10-01', aulas, '2026-10-08')
  assert.equal(r.perdidas, 6)
  assert.equal(estaAfastado({ afastado_manual: null, aulas_perdidas: r.perdidas }), true)
})

test('marcação manual vence o cálculo, nos dois sentidos', () => {
  assert.equal(estaAfastado({ afastado_manual: true, aulas_perdidas: 0 }), true)
  assert.equal(estaAfastado({ afastado_manual: false, aulas_perdidas: 9 }), false)
})

test('a ordem das aulas não importa', () => {
  const aulas = [aula('04'), aula('02', true), aula('01'), aula('03')]
  const r = aulasPerdidasAte(ALUNO, null, aulas, null)
  assert.deepEqual(r, { perdidas: 2, ultimaPresenca: '2026-10-02' })
  assert.deepEqual(aulasPerdidasAte(ALUNO, null, [...aulas].reverse(), null), r)
})

test('presença de outro aluno e aula sem lista de presenças não contam', () => {
  const aulas = [
    { data: '2026-10-01', presencas: [{ aluno_id: 'outro', presente: true }] },
    { data: '2026-10-02' },
    { data: '2026-10-03', presencas: null },
  ]
  assert.deepEqual(aulasPerdidasAte(ALUNO, null, aulas, null), { perdidas: 3, ultimaPresenca: null })
})
