import type { Faixa } from '@/lib/types'

// cor-ok-inicio: cores de faixa da IBJJF (regulamento), não são cores de tema
export const BELT_COLORS: Record<Faixa, { bg: string; text: string }> = {
  branca: { bg: '#FFFFFF', text: '#0D0D0D' },
  cinza_branca:   { bg: '#BDBDBD', text: '#0D0D0D' },
  cinza:          { bg: '#9E9E9E', text: '#fff' },
  cinza_preta:    { bg: '#757575', text: '#fff' },
  amarela_branca: { bg: '#FFF59D', text: '#0D0D0D' },
  amarela:        { bg: '#FBC02D', text: '#0D0D0D' },
  amarela_preta:  { bg: '#F9A825', text: '#0D0D0D' },
  laranja_branca: { bg: '#FFCC80', text: '#0D0D0D' },
  laranja:        { bg: '#F57C00', text: '#fff' },
  laranja_preta:  { bg: '#E65100', text: '#fff' },
  verde_branca:   { bg: '#A5D6A7', text: '#0D0D0D' },
  verde:          { bg: '#2E7D32', text: '#fff' },
  verde_preta:    { bg: '#1B5E20', text: '#fff' },
  azul:   { bg: '#1565C0', text: '#fff' },
  roxa:   { bg: '#6A1B9A', text: '#fff' },
  marrom: { bg: '#4E342E', text: '#fff' },
  preta:  { bg: '#0D0D0D', text: '#C9A84C' },
}
// cor-ok-fim
