// Separa as aulas em "do dia" (etiqueta), "próximas" e "dadas". Pura e sem
// import: scripts/aulas-dia.test.mjs carrega este arquivo direto no Node.
//
// Datas 'AAAA-MM-DD' se comparam como texto (regra do CLAUDE.md). Nenhuma aula
// pode sumir: doDia + proximas + dadas é sempre a entrada inteira.

type AulaOrdenavel = { data: string; created_at?: string | null }

// created_at maior = lançada depois; nulo vale como o mais antigo.
const lancadaDepois = (a: AulaOrdenavel, b: AulaOrdenavel) =>
  (a.created_at ?? '').localeCompare(b.created_at ?? '')

export function separarAulas<T extends AulaOrdenavel>(
  aulas: T[], hoje: string,
): { doDia: T | null; proximas: T[]; dadas: T[] } {
  const deHoje = aulas.filter(a => a.data === hoje)
  // A última lançada: maior created_at; empate ou nulo fica com a primeira da entrada.
  const doDia = deHoje.reduce<T | null>(
    (melhor, a) => (melhor === null || lancadaDepois(a, melhor) > 0 ? a : melhor), null)

  const proximas = aulas
    .filter(a => a.data > hoje)
    .sort((a, b) => a.data.localeCompare(b.data) || lancadaDepois(a, b))

  const passadas = aulas
    .filter(a => a.data < hoje)
    .sort((a, b) => b.data.localeCompare(a.data) || lancadaDepois(b, a))
  const outrasDeHoje = deHoje
    .filter(a => a !== doDia)
    .sort((a, b) => lancadaDepois(b, a))

  return { doDia, proximas, dadas: [...outrasDeHoje, ...passadas] }
}
