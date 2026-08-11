import { supabase } from '@/lib/supabase'
import { assinarUrls } from '@/lib/foto-aula'

// Carrega as listagens ATIVAS — o que está na lixeira (deleted_at preenchido)
// fica de fora de tudo, inclusive das graduações que alimentam
// ultima_graduacao_data e o histórico do aluno.
//
// Vive aqui, e não dentro de app/page.tsx, porque roda nos dois lados: o server
// component usa na carga inicial, e o AppShell usa depois de apagar ou
// restaurar, para as telas refletirem a mudança sem recarregar a página. Se as
// duas versões vivessem separadas elas iam divergir no primeiro filtro novo.

export type CargaDados = {
  alunos: any[]
  aulas: any[]
  /**
   * null quando as três queries passaram. Preenchido = o que está em `alunos` e
   * `aulas` está incompleto, e quem chamou PRECISA decidir o que fazer com o
   * que já tinha na tela.
   *
   * Antes esta função engolia o erro e devolvia listas vazias: sem internet ou
   * com a sessão expirada, o app mostrava "nenhum aluno" — indistinguível de
   * uma exclusão em massa, e no meio do tatame isso é pânico.
   */
  erro: string | null
}

// Mensagem única a partir do que falhou. O nome da listagem entra no texto
// porque "não foi possível carregar" sozinho não diz ao professor se ele está
// vendo a turma completa ou não.
function montarErro(falhas: { rotulo: string; mensagem: string }[]): string | null {
  if (falhas.length === 0) return null

  const listas = falhas.map(f => f.rotulo).join(', ')
  // Todas as falhas costumam ter a mesma causa (rede caiu, token venceu), então
  // um detalhe técnico basta — repetir três vezes a mesma string só empurraria
  // o texto útil para fora da tela.
  return `Não foi possível carregar: ${listas}. Os dados na tela podem estar desatualizados. (${falhas[0].mensagem})`
}

export async function carregarDados(): Promise<CargaDados> {
  try {
    const [rAlunos, rAulas, rGraduacoes] = await Promise.all([
      supabase
        .from('alunos_frequencia')
        .select('*')
        .is('deleted_at', null)
        .order('nome'),
      supabase
        .from('aulas')
        .select('*, presencas(aluno_id, presente)')
        .is('deleted_at', null)
        .order('data', { ascending: false })
        .limit(50),
      supabase
        .from('graduacoes')
        .select('*')
        .is('deleted_at', null)
        .order('data', { ascending: false }),
    ])

    const falhas = [
      { rotulo: 'alunos', erro: rAlunos.error },
      { rotulo: 'aulas', erro: rAulas.error },
      { rotulo: 'graduações', erro: rGraduacoes.error },
    ]
      .filter(f => f.erro !== null)
      .map(f => ({ rotulo: f.rotulo, mensagem: f.erro!.message }))

    const alunos = rAlunos.data
    const aulas = rAulas.data
    const graduacoes = rGraduacoes.data

    // primeira ocorrência por aluno = graduação mais recente, já que veio ordenado desc
    const ultimaGraduacaoPorAluno: Record<string, string> = {}
    const historicoPorAluno: Record<string, any[]> = {}
    for (const g of graduacoes ?? []) {
      if (!ultimaGraduacaoPorAluno[g.aluno_id]) ultimaGraduacaoPorAluno[g.aluno_id] = g.data
      ;(historicoPorAluno[g.aluno_id] ??= []).push(g)
    }

    // Data da última presença por aluno, para o cálculo de afastado
    // (lib/afastamento.ts). Sai das aulas que já vieram acima em vez de uma query
    // nova: elas chegam com presencas(aluno_id, presente) embutido e ordenadas por
    // data desc, então a primeira ocorrência de cada aluno já é a mais recente.
    //
    // Só conta presente = true: linha com presente = false registra que o aluno
    // faltou naquele dia, o oposto do que estamos medindo. O limite de 50 aulas
    // acima não distorce o resultado — quem não aparece em nenhuma das 50 últimas
    // está fora do prazo de qualquer forma.
    //
    // Estas aulas já vêm filtradas por deleted_at is null, e desde a 010 a view
    // alunos_frequencia filtra igual — é o que faz o crachá e o selo AFASTADO
    // contarem a mesma história.
    const ultimaPresencaPorAluno: Record<string, string> = {}
    for (const aula of aulas ?? []) {
      for (const p of (aula as any).presencas ?? []) {
        if (!p.presente) continue
        if (!ultimaPresencaPorAluno[p.aluno_id]) ultimaPresencaPorAluno[p.aluno_id] = (aula as any).data
      }
    }

    const alunosComGraduacao = (alunos ?? []).map(a => ({
      ...a,
      ultima_graduacao_data: ultimaGraduacaoPorAluno[a.id] ?? null,
      historico_graduacoes: historicoPorAluno[a.id] ?? [],
      ultima_presenca_data: ultimaPresencaPorAluno[a.id] ?? null,
    }))

    // foto_url da aula é campo DERIVADO, como ultima_graduacao_data acima: o
    // banco guarda só o caminho no bucket, e a URL assinada vence. Uma chamada
    // em lote para todas as aulas com foto, em vez de uma por aula.
    //
    // ⚠ Derivado significa que ele NÃO pode entrar em payload de update — é
    // exatamente o tipo de campo que já derrubou a edição de aluno com
    // PGRST204. Por isso o ModalAula monta o payload por whitelist.
    const comFoto = (aulas ?? []).filter(a => a.foto_path)
    const urls = await assinarUrls(comFoto.map(a => a.foto_path as string))
    const aulasComFoto = (aulas ?? []).map(a => ({
      ...a,
      foto_url: a.foto_path ? urls[a.foto_path] ?? null : null,
    }))

    return {
      alunos: alunosComGraduacao,
      aulas: aulasComFoto,
      erro: montarErro(falhas),
    }
  } catch (e) {
    // Sem rede, o fetch rejeita antes de virar resposta do PostgREST e nenhuma
    // das checagens acima chega a rodar. Sem este catch o erro subiria como
    // promise rejeitada e a tela ficaria presa em "Carregando…".
    const mensagem = e instanceof Error ? e.message : String(e)
    return {
      alunos: [],
      aulas: [],
      erro: `Sem conexão com o servidor. Os dados na tela podem estar desatualizados. (${mensagem})`,
    }
  }
}
