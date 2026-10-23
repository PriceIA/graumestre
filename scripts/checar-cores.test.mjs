import test from 'node:test'
import assert from 'node:assert/strict'
import { acharCoresSoltas } from './checar-cores.mjs'

test('acha hex escrito à mão', () => {
  const r = acharCoresSoltas('color: "#fff"', 'components/X.tsx')
  assert.equal(r.length, 1)
  assert.equal(r[0].cor, '#fff')
  assert.equal(r[0].linha, 1)
})

test('não acha var(--token)', () => {
  assert.equal(acharCoresSoltas('background: var(--ativo)', 'components/X.tsx').length, 0)
})

test('ignora a linha marcada com cor-ok', () => {
  assert.equal(acharCoresSoltas('x: "#fff" // cor-ok: faixa', 'components/X.tsx').length, 0)
})

test('ignora a linha logo abaixo de um cor-ok', () => {
  const texto = '// cor-ok: cores de faixa (IBJJF)\nbranca: "#FFFFFF",\nazul: "#1565C0",'
  const r = acharCoresSoltas(texto, 'components/X.tsx')
  assert.equal(r.length, 1)
  assert.equal(r[0].linha, 3)
})

test('ignora o arquivo onde os tokens nascem', () => {
  assert.equal(acharCoresSoltas('--fundo: #F4F4F1;', 'app/globals.css').length, 0)
})

test('ignora o desenho da faixa', () => {
  assert.equal(acharCoresSoltas('fill="#BE1622"', 'components/FaixaDesenhada.tsx').length, 0)
})

test('acha rgba, rgb e hsl', () => {
  assert.equal(acharCoresSoltas('a: rgba(0,0,0,0.5)', 'components/X.tsx').length, 1)
  assert.equal(acharCoresSoltas('a: rgb(0 0 0)', 'components/X.tsx').length, 1)
  assert.equal(acharCoresSoltas('a: hsl(0, 0%, 0%)', 'components/X.tsx').length, 1)
})

test('acha hex de 3, 4, 6 e 8 dígitos, mas não id de âncora nem entidade', () => {
  assert.equal(acharCoresSoltas('"#abc" "#abcd" "#aabbcc" "#aabbccdd"', 'components/X.tsx').length, 4)
  assert.equal(acharCoresSoltas('href="#secao" url(#grad1)', 'components/X.tsx').length, 0)
})

test('uma linha com duas cores reporta as duas', () => {
  assert.equal(acharCoresSoltas('gradient(#111, #222)', 'components/X.tsx').length, 2)
})

test('caminho com barra invertida (Windows) também é reconhecido como globals.css', () => {
  assert.equal(acharCoresSoltas('--x: #fff', 'app\\globals.css').length, 0)
})

test('bloco entre cor-ok-inicio e cor-ok-fim é ignorado, e só ele', () => {
  const texto = [
    'a: "#111"',
    '// cor-ok-inicio: faixas da IBJJF',
    'b: "#222",',
    'c: "#333",',
    '// cor-ok-fim',
    'd: "#444"',
  ].join('\n')
  const r = acharCoresSoltas(texto, 'components/X.tsx')
  assert.deepEqual(r.map(x => x.linha), [1, 6])
})

test('cor-ok-inicio sem cor-ok-fim cobre até o fim do arquivo (erro de quem escreveu, mas não esconde nada em silêncio)', () => {
  const r = acharCoresSoltas('// cor-ok-inicio: x\n"#111"\n"#222"', 'components/X.tsx')
  assert.equal(r.length, 0)
})
