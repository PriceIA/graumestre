// Backup por API: tabelas (JSON + CSV) e fotos do bucket aulas-fotos.
//
// Não contém senha nem chave. Tudo entra por variável de ambiente:
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY  (use --env-file=.env.local)
//   GM_APELIDO, GM_SENHA   login do professor (apelido, sem o @graumestre.app)
//   BACKUP_DIR             pasta de destino, FORA do repositório
//
//   node --env-file=.env.local scripts/backup-graumestre.mjs
//
// Só LÊ. Não filtra deleted_at: a lixeira também é dado do professor.
// Aborta (exit 1) se o login falhar ou se algo vier incoerente — um backup
// vazio e "bem-sucedido" é pior do que nenhum backup.

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { mkdir, writeFile, readFile, readdir, stat } from 'node:fs/promises'
import { join, resolve, relative, sep } from 'node:path'

const TABELAS = ['alunos', 'aulas', 'graduacoes', 'presencas', 'professor_perfil', 'alunos_frequencia']
const BUCKET = 'aulas-fotos'
const LOTE = 1000

function exigir(nome) {
  const v = process.env[nome]
  if (!v) {
    console.error(`Falta a variável de ambiente ${nome}.`)
    process.exit(1)
  }
  return v
}

const url = exigir('NEXT_PUBLIC_SUPABASE_URL')
const anon = exigir('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const apelido = exigir('GM_APELIDO')
const senha = exigir('GM_SENHA')
const destino = resolve(exigir('BACKUP_DIR'))

// Dado de crianças: recusa gravar dentro do repositório.
const repo = resolve(import.meta.dirname, '..')
if (destino === repo || destino.startsWith(repo + sep)) {
  console.error(`BACKUP_DIR (${destino}) está dentro do repositório. Use uma pasta fora dele.`)
  process.exit(1)
}

const sb = createClient(url, anon, { auth: { persistSession: false } })

function csvCelula(v) {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function paraCsv(linhas) {
  if (linhas.length === 0) return ''
  const colunas = [...new Set(linhas.flatMap((l) => Object.keys(l)))]
  return [colunas.join(','), ...linhas.map((l) => colunas.map((c) => csvCelula(l[c])).join(','))].join('\n') + '\n'
}

async function lerTudo(tabela) {
  const linhas = []
  for (let de = 0; ; de += LOTE) {
    const { data, error } = await sb.from(tabela).select('*').order('id').range(de, de + LOTE - 1)
    if (error) throw new Error(`${tabela}: ${error.message}`)
    linhas.push(...data)
    if (data.length < LOTE) break
  }
  return linhas
}

// O painel do Supabase deixa um `.emptyFolderPlaceholder` vazio na pasta de
// onde se apagou o último arquivo. Não é foto nem perda: fica fora das
// contagens e da lista de órfãs, mas aparece no manifesto. Só quando tem 0
// bytes — com conteúdo, é um arquivo como outro qualquer e entra no alarme.
const MARCADOR_PASTA = '.emptyFolderPlaceholder'
const marcadoresIgnorados = []

async function listarBucket(prefixo = '') {
  const arquivos = []
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await sb.storage.from(BUCKET).list(prefixo, { limit: 100, offset })
    if (error) throw new Error(`bucket ${BUCKET}: ${error.message}`)
    for (const item of data) {
      const caminho = prefixo ? `${prefixo}/${item.name}` : item.name
      // pasta = sem id (a API de listagem devolve id nulo para prefixos)
      if (item.id === null) arquivos.push(...(await listarBucket(caminho)))
      else if (item.name === MARCADOR_PASTA && (item.metadata?.size ?? 0) === 0) marcadoresIgnorados.push(caminho)
      else arquivos.push(caminho)
    }
    if (data.length < 100) break
  }
  return arquivos
}

async function sha256(arquivo) {
  return createHash('sha256').update(await readFile(arquivo)).digest('hex')
}

async function todosArquivos(pasta) {
  const saida = []
  for (const e of await readdir(pasta, { withFileTypes: true })) {
    const p = join(pasta, e.name)
    if (e.isDirectory()) saida.push(...(await todosArquivos(p)))
    else saida.push(p)
  }
  return saida
}

const { error: erroLogin } = await sb.auth.signInWithPassword({
  email: `${apelido.trim().toLowerCase()}@graumestre.app`,
  password: senha,
})
if (erroLogin) {
  console.error(`Login falhou: ${erroLogin.message}. Nada foi gravado.`)
  process.exit(1)
}

const pastaApi = join(destino, 'api')
const pastaFotos = join(destino, 'fotos')
await mkdir(pastaApi, { recursive: true })
await mkdir(pastaFotos, { recursive: true })

const manifesto = [`Backup GrauMestre por API — ${new Date().toISOString()}`, '', '== Tabelas (linhas exportadas) ==']
const dados = {}
for (const t of TABELAS) {
  const linhas = await lerTudo(t)
  dados[t] = linhas
  await writeFile(join(pastaApi, `${t}.json`), JSON.stringify(linhas, null, 2))
  await writeFile(join(pastaApi, `${t}.csv`), paraCsv(linhas))
  manifesto.push(`${t}: ${linhas.length}`)
  console.log(`${t}: ${linhas.length} linhas`)
}

// Sessão sem acesso devolve 0 linhas SEM erro (RLS). Sem alunos, algo está errado.
if (dados.alunos.length === 0) {
  console.error('A tabela alunos veio vazia: sessão sem acesso? Backup considerado inválido.')
  process.exit(1)
}

// ── Fotos ──
const noBucket = await listarBucket()
let baixadas = 0
const jpegInvalidos = []
for (const caminho of noBucket) {
  const { data, error } = await sb.storage.from(BUCKET).download(caminho)
  if (error) throw new Error(`download ${caminho}: ${error.message}`)
  const buf = Buffer.from(await data.arrayBuffer())
  if (buf.length === 0 || buf[0] !== 0xff || buf[1] !== 0xd8) jpegInvalidos.push(caminho)
  const alvo = join(pastaFotos, ...caminho.split('/'))
  await mkdir(join(alvo, '..'), { recursive: true })
  await writeFile(alvo, buf)
  baixadas++
}

const esperadas = new Set(dados.aulas.map((a) => a.foto_path).filter(Boolean))
const presentes = new Set(noBucket)
const semArquivo = [...esperadas].filter((p) => !presentes.has(p))
const orfas = noBucket.filter((p) => !esperadas.has(p))

manifesto.push('', '== Fotos ==',
  `objetos no bucket: ${noBucket.length}`,
  `baixados: ${baixadas}`,
  `aulas com foto_path: ${esperadas.size}`,
  `foto_path SEM arquivo no bucket (perda): ${semArquivo.length}`, ...semArquivo.map((p) => `  - ${p}`),
  `arquivo SEM linha em aulas (órfão): ${orfas.length}`, ...orfas.map((p) => `  - ${p}`),
  `arquivos que não parecem JPEG: ${jpegInvalidos.length}`, ...jpegInvalidos.map((p) => `  - ${p}`),
  `marcadores de pasta vazios ignorados (${MARCADOR_PASTA}): ${marcadoresIgnorados.length}`,
  ...marcadoresIgnorados.map((p) => `  - ${p}`))

// ── Hashes de tudo que está na pasta de backup (inclui o dump.sql, se já existir) ──
manifesto.push('', '== SHA-256 / bytes ==')
const manifestoPath = join(destino, 'MANIFESTO.txt')
for (const arq of (await todosArquivos(destino)).sort()) {
  if (arq === manifestoPath) continue
  manifesto.push(`${await sha256(arq)}  ${(await stat(arq)).size}  ${relative(destino, arq).split(sep).join('/')}`)
}

await writeFile(manifestoPath, manifesto.join('\n') + '\n')
console.log(`\nFotos: ${baixadas} baixadas, ${semArquivo.length} sem arquivo, ${orfas.length} órfãs, ${jpegInvalidos.length} não-JPEG.`)
console.log(`Manifesto: ${manifestoPath}`)
await sb.auth.signOut()
