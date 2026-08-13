export type Faixa =
  | 'branca'
  | 'cinza_branca' | 'cinza' | 'cinza_preta'
  | 'amarela_branca' | 'amarela' | 'amarela_preta'
  | 'laranja_branca' | 'laranja' | 'laranja_preta'
  | 'verde_branca' | 'verde' | 'verde_preta'
  | 'azul' | 'roxa' | 'marrom' | 'preta'
  // Vermelha-Preta / Vermelha-Branca / Vermelha NÃO são faixas — são o
  // 7º/8º/9º-10º grau da faixa preta (art. 4.1.2). O nome de exibição é
  // resolvido em lib/regras-ibjjf.ts a partir de faixa='preta' + graus.

export type FaixaJuvenilAnterior = 'azul_juvenil' | 'roxa_juvenil' | 'laranja' | 'verde'
export type StatusGraduacao = 'regular' | 'provisorio'

export interface Aluno {
  id: string
  nome: string
  faixa: Faixa
  graus: number                     // 0–3 (infantil) · 0–4 (branca–marrom) · 0–9 (preta)
  inicio: string                    // ISO date — matrícula geral
  data_nascimento: string | null    // ISO date — base para categoria etária (art. 2.2.1)
  foto_url: string | null
  instagram: string | null
  notas: string | null

  // Exceções de tempo mínimo (art. 3.1.3)
  campeao_mundial_azul: boolean
  campeao_mundial_roxa: boolean
  campeao_mundial_marrom: boolean
  veio_de_faixa_juvenil: FaixaJuvenilAnterior | null

  // Graduação provisória (art. 7°)
  status_graduacao: StatusGraduacao
  provisorio_desde: string | null

  // Requisitos de diploma de faixa preta (art. 5.1)
  curso_primeiros_socorros: boolean
  curso_regras_data: string | null

  // null = segue o cálculo automático por frequência · true/false = override do professor
  afastado_manual: boolean | null

  created_at: string
  deleted_at: string | null        // null = ativo · preenchido = na lixeira
}

// Abas do modal do aluno. Mora aqui, e não no componente, porque quem ABRE o
// modal (DashboardProfessor) e quem o RENDERIZA (AppShell) precisam do mesmo
// literal — e o AppShell já importa o DashboardProfessor, então o caminho
// inverso fecharia um ciclo de import.
export type TabAluno = 'perfil' | 'frequência' | 'notas' | 'graduação'

export interface ProfessorPerfil {
  id: string
  nome: string
  faixa: 'preta'
  graus: number            // grau do próprio professor — valida quem pode assinar

  // Ritmo de trabalho DESTE professor: meses sugeridos entre um grau e o
  // próximo. Preferência editável, NÃO regra da IBJJF — o art. 4.1.3 deixa o
  // sistema de graus a critério do Professor até a faixa marrom. Não confundir
  // com o tempo mínimo de permanência por faixa (art. 3.1.3), que é exigência
  // da federação e vive em lib/regras-ibjjf.ts. Ver lib/ritmo-graus.ts.
  meses_entre_graus: number

  created_at: string
}

export interface Aula {
  id: string
  data: string            // ISO date
  tecnica: string | null
  posicao: string | null
  notas: string | null
  link_youtube: string | null      // gravação da aula; chega depois do lançamento

  // Caminho no bucket privado `aulas-fotos` (<aula_id>/<uuid>.jpg), NÃO uma
  // URL: a URL é assinada na leitura e vence. Ver lib/foto-aula.ts.
  foto_path: string | null

  created_at: string
  deleted_at: string | null        // null = ativo · preenchido = na lixeira
}

export interface Presenca {
  id: string
  aula_id: string
  aluno_id: string
  presente: boolean
}

export interface Graduacao {
  id: string
  aluno_id: string
  faixa_anterior: Faixa
  faixa_nova: Faixa
  graus_anterior: number
  graus_novo: number
  data: string
  notas: string | null
  deleted_at: string | null        // null = ativo · preenchido = na lixeira
}
