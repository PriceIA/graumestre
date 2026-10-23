export type Tema = 'claro' | 'escuro'

const CHAVE = 'gm-tema'

function ehTema(v: unknown): v is Tema {
  return v === 'claro' || v === 'escuro'
}

// O acesso ao armazenamento pode lançar (aba privada, dados de site
// bloqueados), então toda leitura e escrita passa por try/catch e a falha vira
// "sem escolha": o app segue o tema do celular.
export function lerTemaSalvo(): Tema | null {
  try {
    const v = localStorage.getItem(CHAVE)
    return ehTema(v) ? v : null
  } catch {
    return null
  }
}

// O tema que está valendo agora: o do <html> (escolhido pelo script de
// abertura ou por definirTema), senão o do celular.
export function temaEfetivo(): Tema {
  const doHtml = document.documentElement.dataset.tema
  if (ehTema(doHtml)) return doHtml
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

export function definirTema(tema: Tema): void {
  document.documentElement.dataset.tema = tema
  try {
    localStorage.setItem(CHAVE, tema)
  } catch {
    // sem armazenamento a escolha vale só até recarregar
  }
}

// Roda no <head>, antes da primeira pintura, para a página não abrir no tema
// errado e piscar. Ordem: ?tema=claro|escuro > escolha salva > nada (o CSS
// segue o celular por prefers-color-scheme). Fica em string porque precisa ser
// inline: um módulo carregaria depois do primeiro frame.
export const SCRIPT_TEMA = `(function(){try{var t=new URLSearchParams(location.search).get('tema');if(!t){try{t=localStorage.getItem('${CHAVE}')}catch(e){}}if(t==='claro'||t==='escuro')document.documentElement.dataset.tema=t}catch(e){}})()`
