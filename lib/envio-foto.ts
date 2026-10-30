// A ordem segura do envio da foto da aula, separada do Supabase para poder ser
// testada no Node (scripts/envio-foto.test.mjs). Sem import de propósito: quem
// chama (lib/foto-aula.ts) entrega as operações reais.
//
// A ordem é o que importa:
// 1. sobe o arquivo novo;
// 2. grava o caminho no banco. Falhou: apaga o recém-subido (o banco não sabe
//    dele, ninguém mais o alcançaria) e lança;
// 3. só então apaga a foto anterior. Na ordem inversa, uma falha no meio
//    deixaria a aula apontando para um objeto que não existe mais. Falhar em
//    apagar a antiga custa um arquivo órfão, que é o lado barato do erro;
// 4. assina a URL nova para a tela mostrar sem recarregar.

export type OperacoesEnvio = {
  /** Sobe o arquivo; devolve a mensagem de erro, ou null se deu certo. */
  subir: (caminho: string) => Promise<string | null>
  /** Grava `foto_path` na aula; devolve a mensagem de erro, ou null. */
  gravarCaminho: (caminho: string) => Promise<string | null>
  remover: (caminho: string) => Promise<void>
  /** URL assinada, ou null quando não foi possível assinar agora. */
  assinar: (caminho: string) => Promise<string | null>
}

export async function enviarComOrdemSegura(
  ops: OperacoesEnvio, caminho: string, pathAnterior: string | null,
): Promise<{ foto_path: string; foto_url: string | null }> {
  const erroUpload = await ops.subir(caminho)
  if (erroUpload) throw new Error(`Não foi possível enviar a foto: ${erroUpload}`)

  const erroBanco = await ops.gravarCaminho(caminho)
  if (erroBanco) {
    await ops.remover(caminho)
    throw new Error(`A foto subiu, mas não foi possível associá-la à aula: ${erroBanco}`)
  }

  if (pathAnterior) await ops.remover(pathAnterior)

  // Assinar falhou: NÃO lança. A foto nova já está gravada e a antiga já foi
  // apagada; lançar fazia a tela oferecer "tentar de novo", e a nova tentativa
  // deixava esta foto órfã no bucket (achado da revisão final da G6). Quem
  // chama recebe o caminho gravado e mostra a caixa "Não foi possível carregar
  // a foto agora" até a próxima carga assinar de novo.
  return { foto_path: caminho, foto_url: await ops.assinar(caminho) }
}
