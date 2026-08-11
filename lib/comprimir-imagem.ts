// Compressão de imagem no browser, antes do upload.
//
// Não é otimização opcional: uma foto de câmera de celular moderno chega em
// vários MB, e o plano free do Supabase tem 1 GB de storage e 5 GB de egress
// por mês. Subir o arquivo original torraria os dois por nada — a foto é
// vista numa miniatura de card e num modal de 480px de largura.
//
// Canvas nativo em vez de biblioteca: o projeto tem `sharp`, mas ele é
// devDependency e roda no Node (só o scripts/gerar-icones.mjs). Nada em
// dependências faz isso no browser, e o que precisamos aqui — redimensionar e
// reencodar — é exatamente o que o canvas já faz. Uma dependência a mais no
// bundle não se paga.

/** Maior dimensão da imagem final. Cobre a miniatura e o modal com folga. */
export const LARGURA_MAX = 1200

/** Qualidade do JPEG. 0.75 é o joelho da curva: abaixo disso o tatame vira sopa. */
export const QUALIDADE = 0.75

/**
 * Teto do que aceitamos enviar. O bucket recusa acima disso (migration 012),
 * então checar aqui é só para dar mensagem decente em vez de erro do Storage.
 */
export const TAMANHO_MAX_BYTES = 2 * 1024 * 1024

export type ImagemComprimida = {
  blob: Blob
  largura: number
  altura: number
  bytesOriginais: number
  bytesFinais: number
}

/**
 * Redimensiona para caber em LARGURA_MAX (na maior dimensão, preservando
 * proporção) e reencoda como JPEG.
 *
 * Imagem já menor que o limite continua sendo reencodada de propósito: é o
 * reencode que derruba o peso de um JPEG de câmera, não o resize. Uma foto
 * 1000x800 direto do celular ainda vem com vários MB de dados EXIF e
 * qualidade 100.
 */
export async function comprimirImagem(arquivo: File): Promise<ImagemComprimida> {
  // imageOrientation: 'from-image' aplica a orientação EXIF ao rasterizar. Sem
  // isso a foto tirada em pé sobe deitada — o canvas ignora o EXIF, e o
  // reencode joga fora a tag que faria o visualizador corrigir depois.
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  } catch {
    // HEIC do iPhone é o caso real: o Safari normalmente converte para JPEG no
    // próprio input de arquivo, mas quando não converte o decode falha aqui.
    //
    // A mensagem não culpa câmera nem galeria de propósito: não está
    // confirmado que o caminho de escolha muda o resultado, e mandar o
    // professor repetir o que já falhou é pior do que não sugerir nada.
    throw new Error(
      'Não foi possível ler esta imagem (formato não suportado pelo navegador). Tente tirar uma foto nova ou salvar como JPEG.'
    )
  }

  const escala = Math.min(1, LARGURA_MAX / Math.max(bitmap.width, bitmap.height))
  const largura = Math.round(bitmap.width * escala)
  const altura  = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width  = largura
  canvas.height = altura

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Não foi possível processar a imagem neste navegador.')
  }
  ctx.drawImage(bitmap, 0, 0, largura, altura)
  bitmap.close()

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, 'image/jpeg', QUALIDADE)
  )
  if (!blob) throw new Error('Não foi possível comprimir a imagem.')

  if (blob.size > TAMANHO_MAX_BYTES) {
    throw new Error(
      `A imagem ficou com ${(blob.size / 1024 / 1024).toFixed(1)} MB mesmo depois de comprimida, acima do limite de 2 MB.`
    )
  }

  return {
    blob,
    largura,
    altura,
    bytesOriginais: arquivo.size,
    bytesFinais: blob.size,
  }
}
