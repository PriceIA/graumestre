import test from 'node:test'
import assert from 'node:assert/strict'
import { valoresDiferentes } from '../lib/comparar.ts'

test('objetos iguais não são diferentes', () => {
  assert.equal(valoresDiferentes({ nome: 'Ana', graus: 2 }, { nome: 'Ana', graus: 2 }), false)
})

test('um campo mudado é diferença', () => {
  assert.equal(valoresDiferentes({ nome: 'Ana' }, { nome: 'Ana Maria' }), true)
})

test('campo de texto vazio e null contam como o mesmo (apagar o que se digitou não é alteração)', () => {
  assert.equal(valoresDiferentes({ instagram: null }, { instagram: '' }), false)
  assert.equal(valoresDiferentes({ instagram: undefined }, { instagram: null }), false)
})

test('null e false NÃO são o mesmo: afastado automático x "ativo" decidido na mão', () => {
  assert.equal(valoresDiferentes({ afastado_manual: null }, { afastado_manual: false }), true)
})

test('zero não é vazio: 0 grau x campo vazio é diferença', () => {
  assert.equal(valoresDiferentes({ graus: 0 }, { graus: null }), true)
})
