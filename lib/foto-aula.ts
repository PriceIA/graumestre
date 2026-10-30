import { supabase } from '@/lib/supabase'
import { comprimirImagem, type ImagemComprimida } from '@/lib/comprimir-imagem'
import { enviarComOrdemSegura } from '@/lib/envio-foto'

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
  // null: a foto foi gravada, mas a URL não pôde ser assinada agora
  foto_url: string | null
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
  return enviarFotoComprimida(aulaId, await comprimirImagem(arquivo), pathAnterior)
}

/**
 * A segunda metade de `subirFotoAula`: envia uma imagem JÁ comprimida. Existe
 * separada para a confirmação da foto (botão Foto da etiqueta) mostrar ao
 * professor exatamente o blob que vai subir, e subir esse mesmo blob em vez de
 * comprimir de novo. A ordem segura vale para os dois caminhos porque o código
 * é um só.
 */
export async function enviarFotoComprimida(
  aulaId: string,
  comprimida: ImagemComprimida,
  pathAnterior: string | null
): Promise<ResultadoUpload> {
  // A ordem (sobe → grava → apaga a anterior → assina) mora em
  // lib/envio-foto.ts, testada no Node; aqui só as operações reais.
  const r = await enviarComOrdemSegura({
    subir: async caminho => {
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, comprimida.blob, { contentType: 'image/jpeg' })
      return error ? error.message : null
    },
    // Whitelist explícita, como todo insert/update do projeto: só a coluna que
    // esta operação tem o direito de mexer. O objeto da aula carrega `presencas`
    // do join da listagem, que não é coluna e derrubaria a request (PGRST204).
    gravarCaminho: async caminho => {
      const { error } = await supabase.from('aulas').update({ foto_path: caminho }).eq('id', aulaId)
      return error ? error.message : null
    },
    remover: async caminho => { await supabase.storage.from(BUCKET).remove([caminho]) },
    assinar: assinarUrl,
  }, novoCaminho(aulaId), pathAnterior)

  return {
    ...r,
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
