// Sem import de propósito (como lib/datas.ts): scripts/comparar.test.mjs carrega
// este arquivo direto no Node.

// Compara dois payloads de formulário. Texto vazio e null valem o mesmo — quem
// digita e apaga não alterou nada. Já 0 e false são valores de verdade: null x
// false em `afastado_manual` é "automático" x "ativo por decisão do professor".
const normaliza = (_chave: string, v: unknown) => (v === '' || v === undefined ? null : v)

export function valoresDiferentes(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return JSON.stringify(a, normaliza) !== JSON.stringify(b, normaliza)
}
