import test from 'node:test'
import assert from 'node:assert/strict'
import { enviarComOrdemSegura } from '../lib/envio-foto.ts'

// Operações falsas que anotam a ordem das chamadas. Cada uma pode falhar.
function ops({ falhaSubir = null, falhaGravar = null, url = 'https://assinada' } = {}) {
  const log = []
  return {
    log,
    subir: async c => { log.push(`subir ${c}`); return falhaSubir },
    gravarCaminho: async c => { log.push(`gravar ${c}`); return falhaGravar },
    remover: async c => { log.push(`remover ${c}`) },
    assinar: async c => { log.push(`assinar ${c}`); return url },
  }
}

test('caminho feliz: sobe, grava, apaga a anterior DEPOIS e devolve a URL', async () => {
  const o = ops()
  const r = await enviarComOrdemSegura(o, 'aula/nova.jpg', 'aula/velha.jpg')
  assert.deepEqual(r, { foto_path: 'aula/nova.jpg', foto_url: 'https://assinada' })
  assert.deepEqual(o.log, ['subir aula/nova.jpg', 'gravar aula/nova.jpg', 'remover aula/velha.jpg', 'assinar aula/nova.jpg'])
})

test('falha no upload: lança e não grava nem apaga nada', async () => {
  const o = ops({ falhaSubir: 'sem rede' })
  await assert.rejects(enviarComOrdemSegura(o, 'aula/nova.jpg', 'aula/velha.jpg'),
    { message: 'Não foi possível enviar a foto: sem rede' })
  assert.deepEqual(o.log, ['subir aula/nova.jpg'])
})

test('falha no banco: apaga o recém-subido, mantém a anterior e lança', async () => {
  const o = ops({ falhaGravar: 'timeout' })
  await assert.rejects(enviarComOrdemSegura(o, 'aula/nova.jpg', 'aula/velha.jpg'),
    { message: 'A foto subiu, mas não foi possível associá-la à aula: timeout' })
  assert.deepEqual(o.log, ['subir aula/nova.jpg', 'gravar aula/nova.jpg', 'remover aula/nova.jpg'])
})

// Achado da revisão final da G6: a foto JÁ está gravada e a antiga JÁ foi
// apagada quando a assinatura falha. Lançar aqui fazia a tela oferecer "tentar
// de novo", e a nova tentativa deixava a foto anterior órfã no bucket.
test('falha só na assinatura: NÃO lança, devolve o caminho gravado com foto_url null', async () => {
  const o = ops({ url: null })
  const r = await enviarComOrdemSegura(o, 'aula/nova.jpg', 'aula/velha.jpg')
  assert.deepEqual(r, { foto_path: 'aula/nova.jpg', foto_url: null })
})

test('sem foto anterior: não apaga nada', async () => {
  const o = ops()
  await enviarComOrdemSegura(o, 'aula/nova.jpg', null)
  assert.deepEqual(o.log, ['subir aula/nova.jpg', 'gravar aula/nova.jpg', 'assinar aula/nova.jpg'])
})
