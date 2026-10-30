import { supabase } from '@/lib/supabase'

// ─── Soft delete / lixeira ───────────────────────────────────────────────────
// Nada aqui apaga linha do banco: "apagar" só carimba deleted_at, e restaurar
// zera de volta. Os payloads são literais explícitos — nunca espalhe o objeto
// de estado num update, foi exatamente assim que a edição de aluno quebrou
// (campo derivado vazando no payload → PGRST204).
//
// ⚠ Este 7 existe DUAS VEZES: aqui, decidindo o que o professor vê na aba
// Lixeira, e como `interval '7 days'` na função purgar_lixeira() da migration
// 011, decidindo o que o banco apaga de verdade na madrugada. Mexeu num, mexa no
// outro — senão o item some da tela dias antes (ou depois) de ser apagado.
export const DIAS_LIXEIRA = 7

export type TabelaComLixeira = 'alunos' | 'aulas' | 'graduacoes'

export function mandarParaLixeira(tabela: TabelaComLixeira, id: string) {
  return supabase.from(tabela).update({ deleted_at: new Date().toISOString() }).eq('id', id)
}

export function restaurarDaLixeira(tabela: TabelaComLixeira, id: string) {
  return supabase.from(tabela).update({ deleted_at: null }).eq('id', id)
}

// Instante a partir do qual um item ainda é recuperável.
export function limiteLixeira(): string {
  return new Date(Date.now() - DIAS_LIXEIRA * 86400000).toISOString()
}

export function diasNaLixeira(deletedAt: string): number {
  return Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000)
}

export function textoPrazo(deletedAt: string): string {
  const dias = diasNaLixeira(deletedAt)
  const restantes = Math.max(0, DIAS_LIXEIRA - dias)
  const apagado = dias === 0 ? 'hoje' : dias === 1 ? 'há 1 dia' : `há ${dias} dias`
  const some = restantes === 0 ? 'some hoje' : restantes === 1 ? 'some em 1 dia' : `some em ${restantes} dias`
  return `Apagado ${apagado} · ${some}`
}
