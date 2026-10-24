// Funções puras do link do YouTube da aula, sem import: scripts/youtube.test.mjs
// carrega este arquivo direto no Node. Movidas do AppShell sem mudar nada.

// ─── Validação do link da gravação ───────────────────────────────────────────
// Campo opcional: vazio nunca é erro, porque o link só existe depois que o
// professor grava e sobe o vídeo. Preenchido, exige uma URL http(s) de um
// domínio do YouTube — errar o link é pior do que não ter link, já que o card
// passa a exibir um "Assistir aula" que não leva a lugar nenhum.
export const HOSTS_YOUTUBE = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'studio.youtube.com']

export function validarLinkYoutube(valor: string): string | null {
  const limpo = valor.trim()
  if (!limpo) return null

  let url: URL
  try {
    url = new URL(limpo)
  } catch {
    return 'O link precisa ser uma URL completa, começando com https://'
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'O link precisa começar com http:// ou https://'
  }
  if (!HOSTS_YOUTUBE.includes(url.hostname.toLowerCase())) {
    return 'O link precisa ser do YouTube (youtube.com ou youtu.be).'
  }
  return null
}

// Extrai o id do vídeo para montar a miniatura (Etapa 6) — nunca lança.
// `studio.youtube.com` passa em validarLinkYoutube() (está em
// HOSTS_YOUTUBE) mas não tem id extraível no mesmo formato: cai no `return
// null` final, e quem chama trata isso como "sem miniatura, mostra o botão
// de texto", nunca como erro.
export function extrairIdYoutube(link: string): string | null {
  let url: URL
  try {
    url = new URL(link)
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase()
  if (host === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] ?? null
  }
  if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') return url.searchParams.get('v')
    const partes = url.pathname.split('/').filter(Boolean)
    if (partes[0] === 'shorts' || partes[0] === 'embed') return partes[1] ?? null
  }
  return null
}
