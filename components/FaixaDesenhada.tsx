'use client'

// ============================================================
// GrauMestre — Faixa de jiu-jítsu desenhada (Etapa 4, lote de agosto/2026)
//
// Substitui os losangos (`Diamonds`) por um desenho de verdade: corpo com
// gradiente + trama de tecido + costura, ponteira e esparadrapos por grau.
//
// Arquivo separado do AppShell.tsx de propósito, mesmo padrão do
// BannerInstalar.tsx: inline styles, paleta própria, importado — o AppShell
// já está grande e esta etapa sozinha adiciona bastante SVG.
//
// As 17 construções (5 sólidas + 12 infantis de duas cores) vêm do art.
// 1.3.1: cor do grupo, com ou sem uma listra branca/preta ao centro em todo
// o comprimento — NÃO são duas metades lado a lado (proposta anterior,
// corrigida em rodada de revisão). Ver `construcaoFaixa()`.
//
// O 7º/8º/9º da preta é estilização ASSUMIDA, não reprodução do art.
// 1.3.4/1.3.5 (ver `VariantePretaAlta`) — registrar isso no CLAUDE.md
// quando a etapa fechar, para a próxima sessão não tentar "corrigir" achando
// que é bug.
//
// O modo de exibição de grau é sempre "preenchido": `max` espaços (o teto
// da faixa, `grausMaximos()`), os conquistados acesos. Não existe mais um
// modo "exato" — foi removido depois do Felipe decidir pelo preenchido.
//
// PERFORMANCE: nada de `filter`/`feTurbulence` por instância. Gradientes e
// pattern de trama são declarados UMA VEZ em `<FaixaDefs/>` (montada uma
// única vez no AppShell) e referenciados por `url(#id)` — é o que mantém
// 33 faixas no grid baratas de desenhar e rolar no celular.
// ============================================================

import type { Faixa } from '@/lib/types'

export interface TomFaixa {
  id: string
  base: string
  realce: string
  sombra: string
}

// Paleta "de carne" — base/realce/sombra por tom, não mais {bg,text} de
// etiqueta. `BELT_COLORS` (AppShell.tsx) continua existindo para a etiqueta
// de texto do BeltBadge; esta paleta é só da faixa desenhada.
const TONS = {
  branco:   { id: 'branco',   base: '#F3F1EC', realce: '#FFFFFF', sombra: '#D9D4C7' },
  cinza:    { id: 'cinza',    base: '#9AA0A6', realce: '#C3C7CB', sombra: '#6C7075' },
  amarelo:  { id: 'amarelo',  base: '#F2C317', realce: '#FCDD57', sombra: '#B4900E' },
  laranja:  { id: 'laranja',  base: '#EF7B1A', realce: '#FFA34E', sombra: '#B3560D' },
  verde:    { id: 'verde',    base: '#2E7D32', realce: '#4E9A52', sombra: '#1B4E1E' },
  azul:     { id: 'azul',     base: '#1565C0', realce: '#3F8DE0', sombra: '#0C3E76' },
  roxo:     { id: 'roxo',     base: '#6A1B9A', realce: '#8F41C0', sombra: '#3E0F5C' },
  marrom:   { id: 'marrom',   base: '#4E342E', realce: '#6E4A42', sombra: '#2C1C18' },
  preto:    { id: 'preto',    base: '#161616', realce: '#2E2E2E', sombra: '#000000' },
  vermelho: { id: 'vermelho', base: '#B71C1C', realce: '#E53935', sombra: '#7A1010' },
  prata:    { id: 'prata',    base: '#C9CDD1', realce: '#EDEFF1', sombra: '#8A8E92' },
  dourado:  { id: 'dourado',  base: '#C9A84C', realce: '#E6C876', sombra: '#8F7530' },
} as const satisfies Record<string, TomFaixa>

// Tons claros precisam de trama ESCURA e borda ESCURA para não sumir no
// fundo preto do app (é a mesma razão do `border: 1px solid #ccc` que o
// BeltBadge já usa na etiqueta da faixa branca). `cinza` entra aqui também:
// é claro o bastante para precisar do mesmo contraste, principalmente
// quando carrega uma listra branca por cima (cinza_branca).
const TONS_CLAROS = new Set<string>([TONS.branco.id, TONS.cinza.id, TONS.amarelo.id, TONS.prata.id, TONS.dourado.id])

function ehClaro(tom: TomFaixa) {
  return TONS_CLAROS.has(tom.id)
}

/** Borda + trama certas para o tom, calculadas uma vez e aplicadas ao corpo
 * e, separadamente, à listra — cada região tem sua própria claridade. */
function acabamento(tom: TomFaixa) {
  const claro = ehClaro(tom)
  return {
    corBorda: claro ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.16)',
    trama: claro ? 'url(#faixa-trama-escura)' : 'url(#faixa-trama-clara)',
  }
}

export interface ConstrucaoFaixa {
  corpo: TomFaixa
  /** `null` = "apenas a cor do grupo" (art. 1.3.1, opção A) */
  listra: TomFaixa | null
}

/**
 * Construção de cada faixa, art. 1.3.1: "As faixas devem ter apenas a cor
 * do grupo (A) ou com uma listra branca (B) ou preta (C) ao centro em todo
 * o seu comprimento." Não são duas metades — é uma cor de corpo com uma
 * listra longitudinal fina ao centro. O sufixo `_branca`/`_preta` do enum
 * É a cor da listra, o que também explica a ordem de `FAIXAS_INFANTIS`:
 * X-e-Branca → X → X-e-Preta.
 *
 * `preta` é caso à parte: 7º/8º/9º não são preta com mais marcas — são
 * construções diferentes (art. 1.3.4/1.3.5), tratadas à parte em
 * `FaixaDesenhada` (segmentos alternados), não uma listra.
 */
function construcaoFaixa(faixa: Faixa): ConstrucaoFaixa {
  switch (faixa) {
    // Adultas + preta — sólidas, sem listra.
    case 'branca': return { corpo: TONS.branco, listra: null }
    case 'azul':   return { corpo: TONS.azul,   listra: null }
    case 'roxa':   return { corpo: TONS.roxo,   listra: null }
    case 'marrom': return { corpo: TONS.marrom, listra: null }
    case 'preta':  return { corpo: TONS.preto,  listra: null }

    // Infantis (Anexo I / art. 1.3.1).
    case 'cinza_branca':   return { corpo: TONS.cinza,   listra: TONS.branco }
    case 'cinza':          return { corpo: TONS.cinza,   listra: null }
    case 'cinza_preta':    return { corpo: TONS.cinza,   listra: TONS.preto }
    case 'amarela_branca': return { corpo: TONS.amarelo, listra: TONS.branco }
    case 'amarela':        return { corpo: TONS.amarelo, listra: null }
    case 'amarela_preta':  return { corpo: TONS.amarelo, listra: TONS.preto }
    case 'laranja_branca': return { corpo: TONS.laranja, listra: TONS.branco }
    case 'laranja':        return { corpo: TONS.laranja, listra: null }
    case 'laranja_preta':  return { corpo: TONS.laranja, listra: TONS.preto }
    case 'verde_branca':   return { corpo: TONS.verde,   listra: TONS.branco }
    case 'verde':          return { corpo: TONS.verde,   listra: null }
    case 'verde_preta':    return { corpo: TONS.verde,   listra: TONS.preto }
  }
}

// ─── <defs> compartilhado — montar UMA VEZ, no AppShell ─────────────────────
export function FaixaDefs() {
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden focusable="false">
      <defs>
        {Object.values(TONS).map(tom => (
          <linearGradient key={tom.id} id={`faixa-grad-${tom.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tom.realce} />
            <stop offset="45%" stopColor={tom.base} />
            <stop offset="100%" stopColor={tom.sombra} />
          </linearGradient>
        ))}
        {/* Trama corre no COMPRIMENTO da faixa (eixo X do viewBox), de
            propósito — é o ondulado real de um tecido de algodão de faixa de
            jiu-jítsu (ver foto do Felipe). Linhas horizontais, sem
            `patternTransform`: a 35° lê como jeans, não como faixa. Não
            "arrumar" de volta para diagonal numa sessão futura. */}
        {/* Trama sobre tom claro: linhas escuras bem translúcidas. */}
        <pattern id="faixa-trama-escura" width="4" height="3" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="0" stroke="rgba(0,0,0,0.10)" strokeWidth="1" />
        </pattern>
        {/* Trama sobre tom escuro: linhas claras bem translúcidas. */}
        <pattern id="faixa-trama-clara" width="4" height="3" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="4" y2="0" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </pattern>
      </defs>
    </svg>
  )
}

const LARGURA = 220
const ALTURA = 40
const PONTEIRA_LARGURA = 54
/** Graus 1–6 da preta são esparadrapo; 7/8/9 são VariantePretaAlta (ver abaixo). */
const MAX_ESPARADRAPOS_PRETA = 6

export interface FaixaDesenhadaProps {
  faixa: Faixa
  graus: number
  /**
   * Teto de graus da faixa — sempre `grausMaximos(faixa, infantil)`, nunca
   * deduzido aqui dentro: regra de faixa mora em regras-ibjjf.ts, o desenho
   * fica burro de propósito. Decide quantos espaços de esparadrapo existem
   * (o Felipe escolheu "sempre mostrar todos os espaços, com os
   * conquistados acesos" — não existe mais modo "exato").
   *
   * Tolerância a dado ruim: com `graus > max`, desenha `max` espaços e
   * acende `min(graus, max)`.
   */
  max: number
  size?: 'sm' | 'md'
}

export function FaixaDesenhada({ faixa, graus, max, size = 'md' }: FaixaDesenhadaProps) {
  const detalhado = size !== 'sm'
  const construcao = construcaoFaixa(faixa)
  const { corBorda, trama } = acabamento(construcao.corpo)

  // 7º/8º/9º da preta: construções diferentes, não "preta com mais marcas".
  // Estilização assumida (ver cabeçalho) — não é reprodução do art. 1.3.4/1.3.5.
  const variantePreta = faixa === 'preta' && graus >= 7 ? graus : null

  // Esparadrapos de posição — quantidade vem de `max` (o teto de negócio,
  // grausMaximos()), EXCETO na preta: o teto de negócio é 9 (GRAUS_PRETA vai
  // até o honorário), mas só os graus 1–6 são "esparadrapo" — 7/8/9 são a
  // VariantePretaAlta acima, um desenho totalmente diferente, não mais
  // marcas na mesma ponteira. Constante de desenho, não de regra de negócio:
  // por isso mora aqui e não em regras-ibjjf.ts.
  const totalMarcas = faixa === 'preta' ? MAX_ESPARADRAPOS_PRETA : Math.max(1, max)

  // Largura de cada esparadrapo vem SEMPRE de `totalMarcas` — nunca de
  // `graus`. Um esparadrapo por posição, `min(graus, totalMarcas)` acesos.
  const acesas = Math.min(graus, totalMarcas)
  const marcas = Array.from({ length: totalMarcas }, (_, i) => i < acesas)

  const corpoX = 2
  const corpoY = 4
  const corpoW = LARGURA - 4
  const corpoH = ALTURA - 8
  const raio = 4

  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      style={{ width: '100%', height: detalhado ? 'auto' : 20, display: 'block', overflow: 'visible' }}
      role="img"
      aria-label={`Faixa ${faixa}, ${graus}º grau`}
    >
      {/* Sombra achatada por baixo — faixa "pousa" no card, sem filter. */}
      {detalhado && (
        <ellipse cx={LARGURA / 2} cy={ALTURA - 1} rx={LARGURA / 2 - 8} ry={4} fill="rgba(0,0,0,0.35)" />
      )}

      {variantePreta ? (
        <VariantePretaAlta grau={variantePreta} corpoX={corpoX} corpoY={corpoY} corpoW={corpoW} corpoH={corpoH} raio={raio} detalhado={detalhado} />
      ) : (
        <>
          {/* Corpo — cor do grupo, art. 1.3.1. */}
          <rect x={corpoX} y={corpoY} width={corpoW} height={corpoH} rx={raio}
            fill={`url(#faixa-grad-${construcao.corpo.id})`} stroke={corBorda} strokeWidth={1} />

          {/* Trama de tecido — só no tamanho detalhado; a 20px vira sujeira. */}
          {detalhado && (
            <rect x={corpoX} y={corpoY} width={corpoW} height={corpoH} rx={raio} fill={trama} />
          )}

          {/* Listra central longitudinal (art. 1.3.1, opções B/C) — corre todo
              o comprimento, inclusive por baixo da ponteira: é desenhada
              antes dela, que fica opaca por cima perto de uma extremidade. */}
          {construcao.listra && (() => {
            const listraH = corpoH / 3
            const listraY = corpoY + (corpoH - listraH) / 2
            const { trama: tramaListra } = acabamento(construcao.listra)
            // Achado em verde_preta: preto sobre verde soma quase a mesma
            // luminância e a listra sumia. Regra correta, não remendo do
            // verde: **A LISTRA DECIDE O CONTORNO PELA CLARIDADE DELA MESMA,
            // NUNCA PELA DO CORPO.** O contorno "escuro sobre claro"/"claro
            // sobre escuro" de `acabamento()` resolve pro CORPO, que é uma
            // pergunta diferente de "essa listra contrasta com o que está por
            // baixo dela". Vale pra qualquer combinação escura-sobre-escura
            // que apareça depois — não trocar por `acabamento(construcao.corpo)`
            // achando que simplifica.
            const corBordaListra = construcao.listra.id === 'preto'
              ? 'rgba(255,255,255,0.5)'
              : 'rgba(0,0,0,0.35)'
            return (
              <>
                <rect x={corpoX} y={listraY} width={corpoW} height={listraH} rx={listraH / 2}
                  fill={`url(#faixa-grad-${construcao.listra.id})`} stroke={corBordaListra} strokeWidth={1} />
                {detalhado && (
                  <rect x={corpoX} y={listraY} width={corpoW} height={listraH} rx={listraH / 2} fill={tramaListra} />
                )}
              </>
            )
          })()}

          {/* Costura — duas linhas tracejadas correndo o comprimento. */}
          {detalhado && (
            <>
              <line x1={corpoX + 6} y1={ALTURA * 0.32} x2={corpoX + corpoW - 6} y2={ALTURA * 0.32}
                stroke="rgba(0,0,0,0.28)" strokeWidth={1} strokeDasharray="2 3" />
              <line x1={corpoX + 6} y1={ALTURA * 0.68} x2={corpoX + corpoW - 6} y2={ALTURA * 0.68}
                stroke="rgba(0,0,0,0.28)" strokeWidth={1} strokeDasharray="2 3" />
            </>
          )}

          {/* Bisel — 1px claro em cima, 1px escuro embaixo. */}
          <line x1={corpoX} y1={corpoY + 0.5} x2={corpoX + corpoW} y2={corpoY + 0.5} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
          <line x1={corpoX} y1={corpoY + corpoH - 0.5} x2={corpoX + corpoW} y2={corpoY + corpoH - 0.5} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />

          {/* Ponteira — preta nas coloridas, vermelha (com friso branco) na preta. */}
          <rect
            x={corpoX + corpoW - PONTEIRA_LARGURA} y={corpoY} width={PONTEIRA_LARGURA} height={corpoH} rx={raio}
            fill={faixa === 'preta' ? `url(#faixa-grad-${TONS.vermelho.id})` : `url(#faixa-grad-${TONS.preto.id})`}
          />
          {faixa === 'preta' && (
            <>
              <line
                x1={corpoX + corpoW - PONTEIRA_LARGURA} y1={corpoY + 2}
                x2={corpoX + corpoW} y2={corpoY + 2}
                stroke="#F3F1EC" strokeWidth={1.5}
              />
              <line
                x1={corpoX + corpoW - PONTEIRA_LARGURA} y1={corpoY + corpoH - 2}
                x2={corpoX + corpoW} y2={corpoY + corpoH - 2}
                stroke="#F3F1EC" strokeWidth={1.5}
              />
            </>
          )}

          {/* Esparadrapos — um por posição do teto da faixa (`max`), os
              conquistados acesos. Largura fixa a partir de `totalMarcas`
              (== max), nunca de `graus` — é o que evita o esparadrapo
              esticando quando `graus` é baixo. */}
          {marcas.map((preenchido, i) => {
            const espaco = (PONTEIRA_LARGURA - 12) / totalMarcas
            const x = corpoX + corpoW - PONTEIRA_LARGURA + 6 + i * espaco
            return preenchido ? (
              <g key={i}>
                <rect x={x} y={corpoY + 4} width={Math.max(3, espaco - 3)} height={corpoH - 8} rx={1.5} fill="#EDE7D9" />
                <rect x={x + Math.max(3, espaco - 3) - 1.4} y={corpoY + 4} width={1.4} height={corpoH - 8} rx={0.7} fill="rgba(0,0,0,0.22)" />
              </g>
            ) : (
              <rect key={i} x={x} y={corpoY + 4} width={Math.max(3, espaco - 3)} height={corpoH - 8} rx={1.5}
                fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
            )
          })}
        </>
      )}
    </svg>
  )
}

// ─── 7º/8º/9º da faixa preta — construções próprias, estilizadas ───────────
// Não é reprodução do art. 1.3.4 (Vermelha-e-Preta / Vermelha-e-Branca,
// "gomos intercalados de 20cm, barra branca com duas barras prateadas") nem
// do 1.3.5 (Vermelha, "barra branca com barras douradas"). É uma
// distinção visual clara entre as três, assumida como estilização — ver
// aprovação registrada em docs/handoff/ e CLAUDE.md.
function VariantePretaAlta({ grau, corpoX, corpoY, corpoW, corpoH, raio, detalhado }: {
  grau: number; corpoX: number; corpoY: number; corpoW: number; corpoH: number; raio: number; detalhado: boolean
}) {
  const N_GOMOS = 6

  if (grau >= 9) {
    // Vermelha (9º/10º): base branca com barras douradas.
    return (
      <>
        <rect x={corpoX} y={corpoY} width={corpoW} height={corpoH} rx={raio}
          fill={`url(#faixa-grad-${TONS.branco.id})`} stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
        {detalhado && <rect x={corpoX} y={corpoY} width={corpoW} height={corpoH} rx={raio} fill="url(#faixa-trama-escura)" />}
        {[0.28, 0.5, 0.72].map(f => (
          <rect key={f} x={corpoX + 6} y={corpoY + corpoH * f - 2} width={corpoW - 12} height={4} rx={2}
            fill={`url(#faixa-grad-${TONS.dourado.id})`} />
        ))}
      </>
    )
  }

  // 7º (Vermelha-e-Preta) e 8º (Vermelha-e-Branca): gomos alternados.
  const tomAlterno = grau === 7 ? TONS.preto : TONS.branco
  const gomoW = corpoW / N_GOMOS
  return (
    <>
      {Array.from({ length: N_GOMOS }, (_, i) => (
        <rect
          key={i}
          x={corpoX + i * gomoW} y={corpoY} width={gomoW} height={corpoH}
          fill={`url(#faixa-grad-${(i % 2 === 0 ? TONS.vermelho : tomAlterno).id})`}
          stroke="rgba(0,0,0,0.25)" strokeWidth={0.5}
        />
      ))}
      <rect x={corpoX} y={corpoY} width={corpoW} height={corpoH} rx={raio} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
      {/* Barra prateada dupla — friso do 8º grau (art. 1.3.4). */}
      {grau === 8 && (
        <>
          <line x1={corpoX} y1={corpoY + 3} x2={corpoX + corpoW} y2={corpoY + 3} stroke={TONS.prata.realce} strokeWidth={1.2} />
          <line x1={corpoX} y1={corpoY + corpoH - 3} x2={corpoX + corpoW} y2={corpoY + corpoH - 3} stroke={TONS.prata.realce} strokeWidth={1.2} />
        </>
      )}
    </>
  )
}
