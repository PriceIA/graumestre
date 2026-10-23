---
name: GrauMestre
description: Etiqueta tecida de kimono sobre trama de algodão, em dois temas (kimono branco e kimono preto), para um professor de jiu-jítsu no tatame.
colors:
  # ── Kimono branco (claro). Nomes = custom properties do protótipo (docs/direcoes/gm-kimono.html).
  fundo: "#F4F4F1"
  papel: "#FFFFFF"
  tinta: "#141414"
  tinta-media: "#4B4B47"
  tinta-suave: "#6B6B66"
  linha: "#D9D9D4"
  controle: "#141414"
  etiqueta: "#141414"
  sobre-etiqueta: "#FFFFFF"
  costura-etiqueta: "rgba(255,255,255,.55)"
  costura-pagina: "rgba(20,20,20,.85)"
  ativo: "#141414"
  sobre-ativo: "#FFFFFF"
  # Alerta: ÂMBAR (decisão 1, opção A). Antes era #BE1622, o mesmo vermelho da ponteira.
  alerta: "#B45309"
  sobre-alerta: "#FFFFFF"
  alerta-texto: "#92400E"
  # Erro e sucesso: NOVOS (o protótipo e o FOJJ não tinham). (proposta)
  erro: "#B42318"
  sobre-erro: "#FFFFFF"
  erro-texto: "#912018"
  sucesso: "#067647"
  sobre-sucesso: "#FFFFFF"
  sucesso-texto: "#05603A"
  ponteira-faixa: "#BE1622"
  friso: "#F3F1EC"
  # ── Kimono preto (escuro)
  escuro-fundo: "#131312"
  escuro-papel: "#1D1D1B"
  escuro-tinta: "#F2F1EC"
  escuro-tinta-media: "#C4C3BC"
  escuro-tinta-suave: "#9C9B94"
  escuro-linha: "#2F2F2C"
  escuro-controle: "#B9B8B1"
  escuro-etiqueta: "#262624"
  escuro-etiqueta-borda: "#3A3A37"
  escuro-sobre-etiqueta: "#F7F6F1"
  escuro-costura-etiqueta: "rgba(255,255,255,.62)"
  escuro-costura-pagina: "rgba(255,255,255,.80)"
  escuro-ativo: "#F2F1EC"
  escuro-sobre-ativo: "#131312"
  escuro-alerta: "#F59E0B"
  escuro-sobre-alerta: "#131312"
  escuro-alerta-texto: "#FBBF24"
  escuro-erro: "#D92D20"
  escuro-sobre-erro: "#FFFFFF"
  escuro-erro-texto: "#FDA29B"
  escuro-sucesso: "#12B76A"
  escuro-sobre-sucesso: "#131312"
  escuro-sucesso-texto: "#6CE9A6"
  escuro-ponteira-faixa: "#C41A25"
typography:
  display:
    fontFamily: "'Big Shoulders Stencil Display', 'Archivo', sans-serif"
    fontSize: "36px"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "0.01em"
  display-desktop:
    fontFamily: "'Big Shoulders Stencil Display', 'Archivo', sans-serif"
    fontSize: "60px"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "0.01em"
  placar-numero:
    fontFamily: "'Big Shoulders Stencil Display', 'Archivo', sans-serif"
    fontSize: "34px"
    fontWeight: 900
    lineHeight: 0.95
  title:
    fontFamily: "'Archivo', system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.05
    fontVariation: "'wdth' 75"
  body:
    fontFamily: "'Archivo', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
    fontVariation: "'wdth' 92"
  label:
    fontFamily: "'Archivo', system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 80"
rounded:
  r: "2px"
spacing:
  gutter: "16px"
  barra: "64px"
  toque-minimo: "44px"
  controle: "48px"
components:
  etiqueta:
    backgroundColor: "{colors.etiqueta}"
    textColor: "{colors.sobre-etiqueta}"
    rounded: "{rounded.r}"
    padding: "10px 10px 10px 14px"
  etiqueta-alerta:
    backgroundColor: "{colors.alerta}"
    textColor: "{colors.sobre-alerta}"
    typography: "{typography.label}"
    rounded: "{rounded.r}"
    padding: "6px 8px"
  button:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r}"
    height: "48px"
    padding: "0 18px"
  button-cheio:
    backgroundColor: "{colors.ativo}"
    textColor: "{colors.sobre-ativo}"
    rounded: "{rounded.r}"
    height: "48px"
    padding: "0 18px"
  filtro:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r}"
    height: "44px"
    padding: "0 14px"
  filtro-ativo:
    backgroundColor: "{colors.ativo}"
    textColor: "{colors.sobre-ativo}"
  caixa-presenca:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta-media}"
    typography: "{typography.label}"
    rounded: "{rounded.r}"
    height: "44px"
  caixa-presenca-marcada:
    backgroundColor: "{colors.ativo}"
    textColor: "{colors.sobre-ativo}"
  campo:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.r}"
    height: "48px"
    padding: "0 14px"
---

# Design System: GrauMestre

> **Status:** gerado a partir do protótipo `docs/direcoes/gm-kimono.html`, não
> do app (o app ainda não usa estes tokens; isso é a G3). Tudo marcado
> **(proposta)** é decisão do Claude esperando aprovação do Pedro. O que não
> está marcado vem do protótipo ou de decisão já tomada no ROADMAP. Quando o
> código existir, rodar `/impeccable document` de novo para extrair os tokens
> reais e o sidecar `.impeccable/design.json`.

## Overview

**Creative North Star: "A Etiqueta Costurada" (proposta)**

A interface é feita do que um kimono é feito: algodão trançado ao fundo,
etiquetas pretas tecidas e costura tracejada marcando as bordas. Nada de
vidro, brilho, gradiente ou sombra decorativa. O celular é a ferramenta de um
professor no tatame, com pressa e com uma mão: a aparência existe para
dizer "isto é seu, está seguro, um toque resolve", não para impressionar.

Há dois temas de verdade, não um tema e sua inversão. **Kimono branco** (claro,
costura preta) e **kimono preto** (escuro, costura branca). O app abre seguindo
o tema do celular. No kimono preto a costura continua branca de propósito: é o
que mostra que é tecido.

O acabamento de faixa preta (a ponteira vermelha com friso branco) é a única
assinatura ornamental. Aparece raramente e nunca carrega significado de estado.

**Key Characteristics:**
- Plano: profundidade por trama, borda de 1.5px e etiqueta cheia, nunca por sombra.
- Raio de 2px em tudo. Cantos quase retos, como etiqueta cortada.
- Preto e branco de tinta com um único tom de alerta; cor é exceção e sempre vem com texto.
- Estêncil em título e número grande, Archivo estreita em todo o resto.
- Alvo de toque mínimo de 44px; botões e campos de 48px.
- Duas versões de verdade: celular (até 959px) e computador (960px ou mais), trocadas só por CSS.

## Colors

Neutros quentes de papel e tinta, uma etiqueta quase preta, e um tom por
significado (alerta, erro, sucesso). Os nomes dos tokens são os mesmos do
protótipo e do futuro `globals.css`.

### Neutral
- **Pérola de Algodão** `fundo` (#F4F4F1 / escuro #131312): fundo da página, sempre sob a trama de kimono.
- **Papel** `papel` (#FFFFFF / escuro #1D1D1B): campos, cartões e painéis que se destacam do fundo.
- **Tinta** `tinta` (#141414 / escuro #F2F1EC): texto principal.
- **Tinta Média** `tinta-media` (#4B4B47 / escuro #C4C3BC): texto de apoio e rótulos.
- **Tinta Suave** `tinta-suave` (#6B6B66 / escuro #9C9B94): metadados e placeholder. É o limite de contraste do sistema (4.86:1 no claro); não escurecer o fundo sob ele nem clarear a cor.
- **Linha** `linha` (#D9D9D4 / escuro #2F2F2C): divisor de lista de 1px. Decorativo, sem exigência de contraste.
- **Controle** `controle` (#141414 / escuro #B9B8B1): borda de campo, botão e barra de navegação. Contraste de componente ≥ 3:1 nos dois temas.

### Etiqueta
- **Etiqueta Tecida** `etiqueta` (#141414 / escuro #262624, com borda escura `#3A3A37`): superfície das etiquetas principais (aula do dia, placar, menu lateral no computador). Texto `sobre-etiqueta` (#FFFFFF / escuro #F7F6F1).
- **Costura** (rgba .55 branco no claro; .62 no escuro; `costura-pagina` preta .85 no claro e branca .80 no escuro): tracejado de 1.5px. Sobre a etiqueta a costura é sempre clara; sobre a página, preta no kimono branco e branca no kimono preto.

### Ação e estado
- **Ativo** `ativo` (#141414 / escuro #F2F1EC, texto `sobre-ativo`): presença marcada, filtro ativo, botão cheio, item de navegação atual. É um preenchimento neutro, não uma cor. **Presença marcada nunca é verde.**
- **Âmbar de Atenção** `alerta` (#B45309, texto sobre ele #FFFFFF / escuro #F59E0B, texto sobre ele #131312): "pronto para graduar", "afastado" e qualquer coisa que o professor precisa olhar. Texto de alerta em linha usa `alerta-texto` (#92400E / escuro #FBBF24). **Resolve a decisão 1 do ROADMAP (opção A):** o vermelho deixa de ser alerta.
- **Erro** `erro` (#B42318 / escuro #D92D20) e `erro-texto` (#912018 / escuro #FDA29B): falha de gravação, validação de campo, confirmação de apagar. **(proposta)**
- **Sucesso** `sucesso` (#067647 / escuro #12B76A) e `sucesso-texto` (#05603A / escuro #6CE9A6): confirmação explícita, como "conferida pelo professor". Não usar para presença. **(proposta)**
- **Ponteira de Faixa Preta** `ponteira-faixa` (#BE1622 / escuro #C41A25) com **Friso** `friso` (#F3F1EC): só decoração. Ver regra abaixo.

### Contraste (conferido por cálculo, WCAG)
Todos os pares de texto abaixo passam AA (4.5:1) nos dois temas: tinta, tinta-média e tinta-suave sobre fundo e papel; textos sobre etiqueta e sobre ativo; os três pares de alerta, erro e sucesso, tanto cheios (texto sobre a cor) quanto em linha (cor de texto sobre fundo e papel). Menores valores: tinta-suave sobre fundo claro (4.86) e `erro` cheio escuro com texto branco (4.83). Componentes de interface (bordas de controle, ícones, borda do alerta) passam 3:1.

Dois pontos de atenção, nenhum bloqueante:
- A borda `etiqueta-borda` do kimono preto sobre o fundo tem 1.63:1. É contorno decorativo de superfície; o limite de uma etiqueta é dado pela costura e pelo preenchimento, não por essa borda. Nenhum controle depende dela.
- A ponteira do kimono preto tem 3.12:1 sobre o fundo. Decoração, sem exigência.

### Named Rules
**A Regra do Vermelho Único.** `ponteira-faixa` é decoração de faixa preta e nunca é estado. O vermelho de **erro** usa `erro`, que é um vermelho diferente, só aparece com ícone e texto, e nunca encosta numa ponteira. Alerta é âmbar, não vermelho.

**A Regra da Cor com Palavra.** Nenhum estado depende só de cor. "Pronto", "afastado", "erro" e "conferida" aparecem escritos, com ícone quando couber. Isto vale para o tatame (sol na tela) e para daltonismo.

**A Regra do Âmbar × Faixa.** O âmbar de alerta não é desenhado como faixa. As faixas laranja e amarela das crianças vivem na faixa desenhada (SVG, `FaixaDesenhada.tsx`), que **não usa estes tokens**: as 17 cores de faixa são do regulamento da IBJJF e ficam fora do tema. O alerta é sempre um chip retangular escrito, nunca uma tira.

**A Regra do Tema.** Nenhum valor de cor escrito à mão fora dos tokens. A G3 inclui um script que reprova isso.

## Typography

**Display Font:** Big Shoulders Stencil Display (fallback Archivo, sans-serif)
**Body Font:** Archivo (fallback system-ui, sans-serif), eixo de largura `wdth` entre 75 e 100

**Character:** estêncil de caixa de equipamento para o que o professor precisa ler de longe (título e número); uma Archivo estreita e firme para ler e tocar de perto. A largura variável deixa caber nome longo de aluno sem encolher a letra.

### Hierarchy
- **Display** (900, 36px celular / 60px computador, line-height .9, tracking .01em, caixa alta): título de tela. Uma por tela.
- **Placar** (900, 34px celular / 52px computador; total 46px / 76px, line-height .95): números do placar. Algarismos tabulares.
- **Title** (800, 24px, line-height 1.05, `wdth` 75): nome da aula do dia, dados do aluno.
- **Body** (400, 16px, line-height 1.45, `wdth` 92): texto corrido. Nome do aluno em lista: 700, 16px. Metadado: 13px.
- **Label** (800, 12px, tracking .06em, caixa alta, `wdth` 80): etiquetas, cabeçalhos de bloco, caixa MARCAR/PRESENTE.

### Named Rules
**A Regra do Estêncil.** Estêncil só em **título de tela, título da aula e número do placar**. Nunca em botão, lista, formulário nem corpo de texto.

**A Regra do 16.** Campo de texto sempre com 16px, para o iOS não dar zoom ao focar.

## Layout

Duas versões de verdade, trocadas só por CSS em `@media (min-width: 960px)`, sem detectar aparelho por código.

**Celular (até 959px), o tatame:** uma coluna de até 640px, com 16px de gutter. Barra de abas fixa embaixo, 5 colunas iguais, 60px de altura mínima (Chamada, Alunos, Aulas, Graduar, Mais). Cabeçalho com título em estêncil e costura dupla embaixo. Busca presa no topo ao rolar (64px). Lista de chamada com índice A–Z de 44px na lateral. Detalhe do aluno abre numa folha que sobe e cobre a tela.

**Computador (960px ou mais), o escritório:** menu lateral de 232px na cor da etiqueta, com costura interna e ponteira no pé. Conteúdo sem largura máxima, 36px de padding. Chamada: placar em largura total, lista em 2 colunas, aula do dia numa coluna fixa de 340px à direita, letras A–Z numa barra acima da lista. Alunos: tabela com o painel do aluno fixo ao lado (340–400px), sem abrir janela por cima. Entre 960 e 1180px a tabela perde colunas e a aula do dia desce para o topo.

Ritmo de espaçamento: 4, 8, 10, 12, 14, 16, 18, 22, 26, 32, 36px (como no protótipo); o gutter de 16px e as linhas de lista de 52–64px são fixos. Nenhuma tela é dada como pronta sem ser testada em 390px e em 1280px, nos dois temas.

### Named Rules
**A Regra dos 44.** Nada que se toca tem menos de 44×44px, e o espaço entre dois alvos não os faz encostar. 48px para botão, campo e botão de tema.

**A Regra dos Seis.** No celular, a lista de chamada mostra pelo menos seis alunos inteiros por tela, sem rolar.

## Elevation & Depth

Plano. A profundidade vem da **trama** (a página é tecido), da **borda de 1.5px** em controles, do **preenchimento cheio** da etiqueta e do `papel` mais claro (ou mais escuro) que o `fundo`. Não há sombra em cartão, botão nem etiqueta.

### Shadow Vocabulary
- **Menu flutuante** (`box-shadow: 0 10px 24px rgba(20,20,20,.14)` no claro; `0 10px 24px rgba(0,0,0,.5)` no escuro): só painéis que flutuam sobre o conteúdo e precisam se separar dele (menu de filtros).
- **Foco** (`outline: 3px solid var(--tinta); outline-offset: 2px; box-shadow: 0 0 0 6px var(--fundo)`): anel duplo para o foco aparecer sobre trama e sobre etiqueta. Sobre etiqueta, o contorno usa `sobre-etiqueta`.

### Trama de kimono
Fundo da página e da busca presa: SVG de 10×7px com elipses sobrepostas (o "grão de arroz" do tecido trançado), `background-attachment: fixed`. No claro é um escurecimento de 5% com brilho branco; no escuro, sombra de 55% e brilho branco de 4–7%. A trama corre no comprimento (eixo X), não em diagonal. A busca presa leva a mesma trama fixa à tela para não "cortar" o tecido.

### Named Rules
**A Regra do Plano.** Superfície em repouso é plana. Sombra só em coisa que flutua; nunca em cartão, botão ou etiqueta.

## Shapes

Raio de **2px** em tudo (`--r`): etiqueta, botão, campo, chip, caixa de presença. Exceção: o logo provisório é um círculo com borda tracejada.

Bordas de controle: 1.5px sólida (`controle`). Divisores de lista: 1px (`linha`). Rascunho ou estado "ainda não" (caixa MARCAR, logo provisório): 1.5px **tracejada**, o que lê como "costura aberta" e se fecha em cheio quando marcado.

**Costura:** tracejado de 1.5px a 5px da borda da etiqueta (`inset: 5px`), parando antes da ponteira. No cabeçalho, costura **dupla** (duas linhas tracejadas a 7px uma da outra), como o reforço de barra do kimono.

**Ponteira de faixa preta:** retângulo de 22px (celular) ou 30px (computador) na ponta direita da etiqueta, com a cor `ponteira-faixa` e dois frisos brancos de 2px (4px da borda de cima e de baixo). A costura termina antes dela.

### Named Rules
**A Regra da Ponteira.** A ponteira aparece só em **três lugares**: na ponta das etiquetas principais, no fim da costura do título e no pé do menu lateral. Nunca em botão, chip, alerta ou lista. Nunca significa estado.

**A Regra da Costura.** Costura preta no kimono branco, branca no kimono preto, e branca sobre qualquer etiqueta. Costura é borda, nunca separador de conteúdo (para isso é a `linha`).

## Components

### Etiqueta tecida
Superfície cheia `etiqueta` com texto `sobre-etiqueta`, costura interna e, nas principais, ponteira. Contém a aula do dia, o placar e o aviso de "Desfazer". Botões dentro dela são vazados: fundo transparente, borda `sobre-etiqueta` a 70%, e o selecionado inverte para `destaque`.

### Placar
Etiqueta com os números em estêncil sobre `sobre-etiqueta`. No celular, quatro colunas; no computador, números maiores e o total à direita separado por costura tracejada. O conteúdo exato do placar da Chamada é a decisão 4 da G7.

### Botões
- **Formato:** raio 2px, 48px de altura, padding 0 18px, borda 1.5px `controle`, peso 750, `wdth` 85.
- **Padrão:** fundo `papel`, texto `tinta`.
- **Cheio:** fundo e borda `ativo`, texto `sobre-ativo`; hover `ativo-hover` (#2B2B2B no claro, #FFFFFF no escuro).
- **Pressionado:** desce 1px. Nada de animação além disso.
- **Dentro da etiqueta:** vazado, ver acima.

### Chips e filtros
44px de altura, borda 1.5px `tinta-suave`, texto 14.5px peso 700. Ativo: preenchimento `ativo`. Chip de alerta (pronto, afastado): borda e texto de `alerta`; ativo, preenchimento `alerta` com `sobre-alerta`. O painel de filtros do computador vira linha fixa; no celular, abre como painel.

### Etiqueta pequena (estado)
Caixa alta, 12px peso 800, tracking .06em, padding 6×8px. Variantes: **alerta** (preenchida), **alerta-contorno** (borda `alerta`, texto `alerta-texto`, fundo `papel`) e **contorno** (borda e texto `tinta-media`). Sempre escrita ("PRONTO", "AFASTADO"), com ícone quando couber.

### Campos
`papel`, borda 1.5px `controle`, raio 2px, 48px de altura, texto de 16px. Foco: contorno de 3px `tinta`. Placeholder em `tinta-suave`. Erro: borda e mensagem em `erro` / `erro-texto`, mensagem escrita abaixo do campo. **(proposta)**

### Linha de aluno (chamada)
Grade `faixa | nome + detalhe | caixa`, 52px de altura mínima, divisor `linha` de 1px. A **caixa MARCAR / PRESENTE** tem 44px de altura: tracejada e vazia ("MARCAR") antes; preenchida `ativo` com ícone ("PRESENTE") depois. Marcar anima a costura se fechando (clip-path, 340ms), sob `prefers-reduced-motion: no-preference`.

### Faixa desenhada
`FaixaDesenhada.tsx` (SVG). **Fora do tema:** as cores de faixa e de graus vêm da IBJJF (`lib/regras-ibjjf.ts`), não de tokens. No kimono preto leva um contorno claro leve (`drop-shadow(0 0 1px rgba(255,255,255,.35))`) para a faixa preta e a marrom não sumirem.

### Navegação
- **Celular:** barra de abas fixa embaixo, fundo `papel`, borda de cima de 1.5px `controle`, ícone acima do nome, 60px de altura. A aba ativa vira etiqueta cheia `ativo`. Graduar mostra o número de prontos.
- **Computador:** coluna lateral de 232px em `etiqueta`, costura interna e ponteira no pé; item ativo em `destaque`.

### Aviso e "Desfazer"
Etiqueta flutuante, 52px de altura. Fica embaixo no celular, canto inferior direito no computador. Botão "Desfazer" de 44px vazado dentro dela.

## Do's and Don'ts

### Do:
- **Do** usar só os tokens deste arquivo; cor nova entra aqui antes de entrar no código.
- **Do** escrever o estado por extenso e acrescentar ícone quando couber (Regra da Cor com Palavra).
- **Do** manter 44×44px em tudo que se toca, 48px em botão e campo.
- **Do** conferir qualquer tela nova em 390px e 1280px, nos dois temas.
- **Do** manter costura preta no kimono branco e branca no kimono preto.
- **Do** respeitar `prefers-reduced-motion`: sem a preferência, movimento curto (150–340ms, `cubic-bezier(.16,1,.3,1)`); com ela, nenhum.
- **Do** usar `erro` e `sucesso` só em momentos de feedback explícito, e `ativo` para presença.

### Don't:
- **Don't** usar o vermelho da ponteira (`ponteira-faixa`) como alerta, erro ou qualquer estado.
- **Don't** pôr ponteira ou friso em botão, chip, alerta ou lista.
- **Don't** usar estêncil em botão, lista, formulário ou texto corrido.
- **Don't** sugerir estado só por cor, nem colorir a presença de verde.
- **Don't** pôr sombra em cartão, botão ou etiqueta em repouso.
- **Don't** girar a trama em diagonal: lê como jeans, não como algodão trançado.
- **Don't** desenhar o alerta como faixa nem usar as cores de faixa da IBJJF como cor de interface.
- **Don't** misturar `className` do Tailwind dentro do `AppShell.tsx`: ele usa inline styles; os tokens entram lá como `var(--...)`.
