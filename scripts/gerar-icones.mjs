// Gera os PNGs do PWA a partir do logo da academia.
//
// Rodar na mão quando o logo mudar:  node scripts/gerar-icones.mjs
// Não roda no build — os PNGs são commitados, e regerar a cada deploy só
// gastaria tempo de build para produzir bytes idênticos.
//
// A origem já é quadrada (2048x2048) e com o emblema centralizado, então aqui
// só há redimensionamento: nada de crop nem de reenquadramento. Nos tamanhos
// pequenos o texto fino ("Flavio Oliveira", "Life Style") vira borrão — tudo
// bem, o que precisa sobreviver é o emblema circular com o "FO".

import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

// Atenção: o arquivo tem extensão dupla (.jpg.jpeg), como foi salvo.
const ORIGEM = join(raiz, 'public', 'icons', 'source-logo.jpg.jpeg')
const DESTINO = join(raiz, 'public', 'icons')

const SAIDAS = [
  { arquivo: 'icon-512.png', tamanho: 512 },
  { arquivo: 'icon-192.png', tamanho: 192 },
  { arquivo: 'apple-touch-icon.png', tamanho: 180 },
  { arquivo: 'favicon.png', tamanho: 32 },
]

for (const { arquivo, tamanho } of SAIDAS) {
  await sharp(ORIGEM)
    .resize(tamanho, tamanho, { fit: 'contain', background: '#ffffff' })
    // O JPEG de origem não tem canal alfa; achatar contra branco mantém o
    // fundo do logo igual ao original em vez de virar transparência.
    .flatten({ background: '#ffffff' })
    .png()
    .toFile(join(DESTINO, arquivo))

  console.log(`ok  ${arquivo}  ${tamanho}x${tamanho}`)
}
