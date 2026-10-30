// Reprova cor escrita à mão fora dos tokens (DESIGN.md, "A Regra do Tema").
//
//   npm run checar-cores
//
// Cor nasce em app/globals.css e chega ao código por var(--token) ou por
// lib/cores.ts. Exceções, ditas no código e não aqui:
//   - app/globals.css e components/FaixaDesenhada.tsx são ignorados por inteiro
//     (tokens e desenho da faixa);
//   - uma linha com `cor-ok` — ou a linha logo abaixo de um comentário
//     `cor-ok` — passa. Serve para cor que NÃO é de tema, como as de faixa da
//     IBJJF. Escreva o motivo depois de `cor-ok:`;
//   - um bloco entre `cor-ok-inicio: <motivo>` e `cor-ok-fim` passa inteiro
//     (a tabela de faixas tem 17 linhas).

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const IGNORADOS = ['app/globals.css', 'components/FaixaDesenhada.tsx']
const PASTAS = ['app', 'components', 'lib']
const EXTENSOES = new Set(['.ts', '.tsx', '.js', '.jsx', '.css'])

const HEX = '#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])'
const FUNCAO = '\\b(?:rgba?|hsla?)\\('
// (?<![&\w]) tira entidade HTML (&#039;) e id colado em palavra.
const COR = new RegExp(`(?<![&\\w])${HEX}|${FUNCAO}`, 'g')

export function acharCoresSoltas(texto, caminho) {
  const norm = caminho.replace(/\\/g, '/')
  if (IGNORADOS.some(i => norm.endsWith(i))) return []
  const linhas = texto.split(/\r?\n/)
  const achados = []
  let dentroDoBloco = false
  linhas.forEach((linha, i) => {
    if (linha.includes('cor-ok-inicio')) { dentroDoBloco = true; return }
    if (linha.includes('cor-ok-fim')) { dentroDoBloco = false; return }
    if (dentroDoBloco) return
    if (linha.includes('cor-ok')) return
    if (i > 0 && linhas[i - 1].includes('cor-ok') && !linhas[i - 1].includes('cor-ok-fim')) return
    for (const m of linha.matchAll(COR)) {
      achados.push({ linha: i + 1, cor: m[0] })
    }
  })
  return achados
}

function arquivos(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...arquivos(p))
    else if (EXTENSOES.has(path.extname(e.name))) out.push(p)
  }
  return out
}

function main() {
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  let total = 0
  for (const pasta of PASTAS) {
    const dir = path.join(raiz, pasta)
    if (!fs.existsSync(dir)) continue
    for (const arq of arquivos(dir)) {
      const rel = path.relative(raiz, arq).replace(/\\/g, '/')
      for (const a of acharCoresSoltas(fs.readFileSync(arq, 'utf8'), rel)) {
        console.log(`${rel}:${a.linha}  ${a.cor}`)
        total++
      }
    }
  }
  if (total > 0) {
    console.error(`\n${total} cor(es) escrita(s) à mão. Use um token (var(--...) ou lib/cores.ts) ou, se não for cor de tema, marque a linha com "cor-ok: <motivo>".`)
    process.exit(1)
  }
  console.log('checar-cores: nenhuma cor solta.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
