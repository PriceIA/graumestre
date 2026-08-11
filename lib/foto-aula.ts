import { supabase } from '@/lib/supabase'
import { comprimirImagem } from '@/lib/comprimir-imagem'

// Foto da aula: upload, troca, remoção e leitura.
//
// O bucket é PRIVADO (migration 012), e isso decide o desenho inteiro deste
// arquivo. O banco guarda só o CAMINHO do objeto; a URL é assinada na hora da
// leitura e vence. Por isso não existe "url da foto" em lugar nenhum do estado
// persistido — existe `foto_path` no banco e `foto_url` derivada, montada no
// carregamento junto com os outros campos derivados.

export const BUCKET = 'aulas-fotos'

/**
 * Validade da URL assinada. Uma hora cobre com folga uma sessão de tatame; a
 * imagem já baixada continua na tela mesmo depois de vencer, porque o que
 * expira é o direito de baixar de novo, não o que já está renderizado.
 */
export const VALIDADE_URL_SEGUNDOS = 3600

/** `<aula_id>/<uuid>.jpg` — a pasta por aula deixa óbvio de quem é cada arquivo. */
function novoCaminho(aulaId: string): string {
  return `${aulaId}/${crypto.randomUUID()}.jpg`
}

export type ResultadoUpload = {
  foto_path: string
  foto_url: string
  bytesOriginais: number
  bytesFinais: number
}

/**
 * Comprime, envia e passa a foto a valer para a aula — inclusive gravando o
 * caminho no banco. Devolve já a URL assinada, para a tela mostrar sem esperar
 * uma recarga.
 *
 * Grava na hora, sem depender do "Salvar alterações" do modal, pelo mesmo
 * motivo da chamada rápida: o professor sai da tela no meio, e o que ele já
 * fez tem que estar no banco. Trocar uma foto e fechar no ✕ não desfaz a
 * troca.
 *
 * `pathAnterior` é apagado só DEPOIS de o banco já apontar para o novo
 * arquivo. Na ordem inversa, uma falha no meio deixaria a linha apontando para
 * um objeto que não existe mais — e aí a foto some da tela sem ninguém ter
 * pedido. Falhar em apagar o antigo custa um arquivo órfão, que é o lado
 * barato do erro.
 */
export async function subirFotoAula(
  aulaId: string,
  arquivo: File,
  pathAnterior: string | null
): Promise<ResultadoUpload> {
  const comprimida = await comprimirImagem(arquivo)
  const caminho = novoCaminho(aulaId)

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, comprimida.blob, { contentType: 'image/jpeg' })
  if (erroUpload) throw new Error(`Não foi possível enviar a foto: ${erroUpload.message}`)

  // Whitelist explícita, como todo insert/update do projeto: só a coluna que
  // esta operação tem o direito de mexer. O objeto da aula carrega `presencas`
  // do join da listagem, que não é coluna e derrubaria a request (PGRST204).
  const { error: erroBanco } = await supabase
    .from('aulas')
    .update({ foto_path: caminho })
    .eq('id', aulaId)
  if (erroBanco) {
    // O banco não sabe do arquivo que acabou de subir: apaga para não deixar
    // lixo que ninguém mais consegue alcançar.
    await supabase.storage.from(BUCKET).remove([caminho])
    throw new Error(`A foto subiu, mas não foi possível associá-la à aula: ${erroBanco.message}`)
  }

  if (pathAnterior) await supabase.storage.from(BUCKET).remove([pathAnterior])

  const foto_url = await assinarUrl(caminho)
  if (!foto_url) throw new Error('A foto foi salva, mas não foi possível exibi-la agora. Recarregue a tela.')

  return {
    foto_path: caminho,
    foto_url,
    bytesOriginais: comprimida.bytesOriginais,
    bytesFinais: comprimida.bytesFinais,
  }
}

/**
 * Tira a foto da aula. Zera a coluna primeiro: se o remove do Storage falhar,
 * o pior caso é um arquivo órfão, e não uma aula apontando para um objeto que
 * o professor mandou apagar.
 */
export async function removerFotoAula(aulaId: string, path: string): Promise<void> {
  const { error } = await supabase.from('aulas').update({ foto_path: null }).eq('id', aulaId)
  if (error) throw new Error(`Não foi possível remover a foto: ${error.message}`)
  await supabase.storage.from(BUCKET).remove([path])
}

/** URL assinada para um caminho. `null` quando o objeto sumiu do bucket. */
export async function assinarUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, VALIDADE_URL_SEGUNDOS)
  return error ? null : data?.signedUrl ?? null
}

/**
 * Assina vários caminhos numa chamada só — a listagem traz até 50 aulas, e
 * assinar uma a uma seriam 50 requests em série no carregamento.
 *
 * Devolve um mapa caminho -> URL. Caminho que falhou simplesmente não entra:
 * quem chama trata ausência como "sem foto", que é o que o professor vê. Um
 * arquivo apagado do bucket por fora não pode derrubar a carga da tela
 * inteira.
 */
export async function assinarUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {}

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, VALIDADE_URL_SEGUNDOS)
  if (error || !data) return {}

  const mapa: Record<string, string> = {}
  for (const item of data) {
    if (item.error || !item.signedUrl || !item.path) continue
    mapa[item.path] = item.signedUrl
  }
  return mapa
}
