// Única fonte do objeto de tema dos componentes com inline style (AppShell,
// LoginGate, BannerInstalar). Cada chave devolve `var(--token)`: quem decide a
// cor real é o CSS (app/globals.css), nos dois temas. Não escreva valor de cor
// aqui — o verificador scripts/checar-cores.mjs existe para barrar isso.
//
// Chaves de "papel" (DESIGN.md): ativo = ação e seleção neutras; alerta =
// o professor precisa olhar; erro = falhou ou impede.

const bg = (token: string) => `color-mix(in srgb, var(${token}) 10%, transparent)`

export const theme = {
  bg: 'var(--fundo)',
  surface: 'var(--papel)',
  surface2: 'var(--fundo)',
  border: 'var(--linha)',
  border2: 'var(--controle)',
  text: 'var(--tinta)',
  textSub: 'var(--tinta-media)',
  textMute: 'var(--tinta-suave)',
  inputBg: 'var(--papel)',

  ativo: 'var(--ativo)',
  sobreAtivo: 'var(--sobre-ativo)',
  ativoBg: bg('--ativo'),

  alerta: 'var(--alerta)',
  sobreAlerta: 'var(--sobre-alerta)',
  alertaTexto: 'var(--alerta-texto)',
  alertaBg: bg('--alerta'),

  erro: 'var(--erro)',
  sobreErro: 'var(--sobre-erro)',
  erroTexto: 'var(--erro-texto)',
  erroBg: bg('--erro'),

  ui: 'var(--ui)',
  display: 'var(--display)',

  // Provisórios: o vermelho antigo ainda é lido por ~70 pontos. A Task 3 da
  // G3 distribui cada um entre ativo, alerta e erro (docs/superpowers/plans/
  // 2026-10-22-g3-mapa-do-vermelho.md) e apaga estas duas linhas.
  accent: 'var(--ativo)',
  accentBg: bg('--ativo'),
}

export type Theme = typeof theme
