import test from 'node:test'
import assert from 'node:assert/strict'
import { validarLinkYoutube, extrairIdYoutube } from '../lib/youtube.ts'

test('extrairIdYoutube lê watch?v= e ignora &t=', () => {
  assert.equal(extrairIdYoutube('https://www.youtube.com/watch?v=abc123&t=42'), 'abc123')
})

test('extrairIdYoutube lê youtu.be e ignora ?si=', () => {
  assert.equal(extrairIdYoutube('https://youtu.be/abc123?si=x'), 'abc123')
})

test('extrairIdYoutube lê /shorts/ e /embed/', () => {
  assert.equal(extrairIdYoutube('https://youtube.com/shorts/abc123'), 'abc123')
  assert.equal(extrairIdYoutube('https://www.youtube.com/embed/abc123'), 'abc123')
})

test('extrairIdYoutube lê o host m.youtube.com', () => {
  assert.equal(extrairIdYoutube('https://m.youtube.com/watch?v=abc123'), 'abc123')
})

test('extrairIdYoutube devolve null para studio.youtube.com e para texto que não é URL', () => {
  assert.equal(extrairIdYoutube('https://studio.youtube.com/video/abc123/edit'), null)
  assert.equal(extrairIdYoutube('não é url'), null)
})

test('validarLinkYoutube aceita vazio e só espaços (campo opcional)', () => {
  assert.equal(validarLinkYoutube(''), null)
  assert.equal(validarLinkYoutube('   '), null)
})

test('validarLinkYoutube recusa o que não é URL completa, nem http(s), nem YouTube', () => {
  assert.equal(validarLinkYoutube('youtu.be/x'), 'O link precisa ser uma URL completa, começando com https://')
  assert.equal(validarLinkYoutube('ftp://youtube.com/x'), 'O link precisa começar com http:// ou https://')
  assert.equal(validarLinkYoutube('https://vimeo.com/1'), 'O link precisa ser do YouTube (youtube.com ou youtu.be).')
})

test('validarLinkYoutube aceita studio.youtube.com (passa no validador, sem id extraível)', () => {
  assert.equal(validarLinkYoutube('https://studio.youtube.com/x'), null)
})
