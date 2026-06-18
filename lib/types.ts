export type Faixa = 'branca' | 'cinza' | 'azul' | 'roxa' | 'marrom' | 'preta'

export interface Aluno {
  id: string
  nome: string
  faixa: Faixa
  graus: number           // 0–4
  inicio: string          // ISO date
  foto_url: string | null
  instagram: string | null
  notas: string | null
  created_at: string
}

export interface Aula {
  id: string
  data: string            // ISO date
  tecnica: string | null
  posicao: string | null
  notas: string | null
  created_at: string
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
}
