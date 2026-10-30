// Sem import de propósito (como lib/datas.ts): scripts/busca.test.mjs carrega
// este arquivo direto no Node, sem framework nem alias '@/'.

// Tira acento e maiúscula: "JOÃO" e "joao" são o mesmo nome para quem digita
// com pressa no celular.
const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Termo vazio (ou só espaços) casa todo mundo: a busca em branco não filtra.
export function casaBusca(nome: string, termo: string): boolean {
  const t = normalizar(termo).trim()
  return t === '' || normalizar(nome).includes(t)
}

// Agrupa mantendo a ordem de `ordem`; grupo sem item some. Chave fora da
// `ordem` não pode sumir com o aluno (faixa nova, dado estranho): vai para o
// fim, em grupo próprio. A ordem dentro de cada grupo é a de entrada.
export function agruparNaOrdem<T>(
  itens: T[], chave: (x: T) => string, ordem: string[],
): { chave: string; itens: T[] }[] {
  const grupos: Record<string, T[]> = Object.create(null)
  const vistas: string[] = []
  for (const item of itens) {
    const c = chave(item)
    if (!grupos[c]) { grupos[c] = []; vistas.push(c) }
    grupos[c].push(item)
  }
  const conhecidos = ordem.filter(c => grupos[c])
  const fora = vistas.filter(c => ordem.indexOf(c) === -1)
  return conhecidos.concat(fora).map(c => ({ chave: c, itens: grupos[c] }))
}
