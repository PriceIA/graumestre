# G3 — Fundação visual: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a pele do app pelos tokens do `DESIGN.md` (kimono branco e preto), com a navegação nova, sem mudar nenhuma função.

**Architecture:** Os tokens vivem como custom properties no `app/globals.css`, nos dois temas. O objeto `theme` do `AppShell` (e as cópias no `LoginGate` e no `BannerInstalar`) passa a devolver `var(--token)` a partir de um único módulo, `lib/cores.ts`, então os ~260 usos de `t.xxx` mudam de cor sem reescrita. O Tailwind aponta para as mesmas variáveis. A navegação é um componente novo que troca de layout só por CSS em 960 px.

**Tech Stack:** Next.js 14 (App Router), Tailwind 3, `next/font/google`, Node `node:test` para o verificador de cor. Sem dependência nova.

**Spec:** `ROADMAP.md` (G3 e regra 10), `DESIGN.md` (tokens e regras), `docs/direcoes/gm-kimono.html` (referência visual), `docs/superpowers/plans/2026-10-22-g3-mapa-do-vermelho.md` (papel de cada vermelho, **aprovado pelo Pedro antes da Task 3**).

## Global Constraints

- **Nenhuma função muda** (ROADMAP, regra 8). Não trazer código de telas do FOJJ.
- Branch `desenvolvimento`; um commit por task, com `git push` e `git log origin/desenvolvimento..desenvolvimento` vazio.
- Sem migration. Sem tocar em `lib/*` de regra (`regras-ibjjf`, `ritmo-graus`, `alertas-graduacao`, `afastamento`, `carregar-dados`).
- `AppShell.tsx` continua em **inline styles**, sem `className` do Tailwind. Os tokens entram como `var(--…)` por `lib/cores.ts`.
- Nenhum valor de cor escrito à mão fora dos tokens, exceto as cores de faixa (IBJJF), que levam a marca `cor-ok`.
- Tema: atributo `data-tema="claro"|"escuro"` em `<html>`, chave `gm-tema` no `localStorage`, igual ao protótipo. Sem escolha salva, segue o celular.
- Fontes: Archivo (`--ui`) e Big Shoulders Stencil Display (`--display`) por `next/font`; `font-display: swap`.
- Raio de 2 px; alvo de toque ≥ 44 px; foco de 3 px; `prefers-reduced-motion` respeitado.
- Nenhuma tela é dada como pronta sem teste em **390 px e 1280 px, nos dois temas**.
- `npx tsc --noEmit` limpo antes de cada commit; `npm run checar-cores` limpo a partir da Task 3.
- Teste que mexe em dados: nome começa com `ZZ-TESTE-G3`; no fim, contagens conferidas e o teste apagado de verdade (ver Task 5).
- Manifest do PWA fica escuro (`#131312`): a abertura em vídeo é escura até a G12.

## Review Focus

1. **Tema salvo inválido ou `localStorage` bloqueado** (aba privada): cai no tema do celular, sem erro no console, sem tela quebrada. → Task 1, teste do script de tema.
2. **Aluno sem foto, ou com `foto_url` quebrada**: a inicial aparece legível nos dois temas. → Task 3, verificação visual.
3. **Barra de abas cobrindo conteúdo:** o último card da lista, o botão flutuante "+" e o banner de instalar ficam acima da barra, inclusive com a área segura do iPhone. → Task 4.
4. **Caixa de erro e selo de alerta no tema claro:** texto legível (AA). → Task 3, verificação de contraste por cálculo.
5. **Largura de 959 px e de 960 px:** a troca entre barra de baixo e menu lateral acontece uma vez, sem aparecer as duas. → Task 4.
6. **Modais (folhas que sobem de baixo) em tela larga:** não esticam até a borda do monitor. → Task 4.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `app/globals.css` (modificar) | Tokens dos dois temas, trama, foco, classes da navegação |
| `tailwind.config.js` (modificar) | Cores do Tailwind apontando para as variáveis; remove `bg/surface/accent` antigos |
| `app/layout.tsx` (modificar) | Fontes novas, script de tema antes de pintar, `themeColor` dos dois temas |
| `lib/tema.ts` (novo) | Lógica de tema: ler, aplicar, guardar |
| `lib/cores.ts` (novo) | Objeto `theme` com `var(--…)`: única fonte para `AppShell`, `LoginGate`, `BannerInstalar` |
| `scripts/checar-cores.mjs` (novo) | Reprova cor escrita à mão |
| `scripts/checar-cores.test.mjs` (novo) | Testes do verificador (`node --test`) |
| `components/Navegacao.tsx` (novo) | Barra de abas (celular) e menu lateral (computador) |
| `components/AppShell.tsx`, `LoginGate.tsx`, `BannerInstalar.tsx`, `DashboardProfessor.tsx`, `ui/*` (modificar) | Trocam cor, fonte e raio; `AppShell` ganha a navegação |
| `public/manifest.json` (modificar) | Cores do PWA |

---

### Task 1 (G3.1): Fundação — tokens, fontes e tema

**Files:**
- Create: `lib/tema.ts`
- Modify: `app/globals.css`, `app/layout.tsx`, `tailwind.config.js`, `public/manifest.json`

**Interfaces:**
- Produces (`lib/tema.ts`):
  - `type Tema = 'claro' | 'escuro'`
  - `lerTemaSalvo(): Tema | null` (nunca lança; `null` se vazio, inválido ou bloqueado)
  - `temaEfetivo(): Tema` (o do `data-tema` atual, ou o do celular)
  - `definirTema(t: Tema): void` (aplica em `<html>` e guarda em `gm-tema`; não lança se o armazenamento falhar)
  - `SCRIPT_TEMA: string` (código inline que o `layout.tsx` injeta no `<head>`)
- Produces (`globals.css`): todas as custom properties de `DESIGN.md` (nomes sem o prefixo `escuro-` no escuro: `--fundo`, `--papel`, `--tinta`, `--tinta-media`, `--tinta-suave`, `--linha`, `--controle`, `--etiqueta`, `--etiqueta-borda`, `--sobre-etiqueta`, `--costura-etiqueta`, `--costura-pagina`, `--ativo`, `--sobre-ativo`, `--ativo-hover`, `--alerta`, `--sobre-alerta`, `--alerta-texto`, `--erro`, `--sobre-erro`, `--erro-texto`, `--sucesso`, `--sobre-sucesso`, `--sucesso-texto`, `--ponteira-faixa`, `--friso`, `--destaque`, `--sobre-destaque`, `--sombra-menu`, `--trama`, `--r`, `--barra: 64px`, `--barra-aba: 60px`, `--ease`), mais `--display` e `--ui` apontando para as fontes do `next/font`.

- [ ] **Step 1: Tokens** em `app/globals.css`: bloco `:root` (claro), `:root[data-tema="escuro"]` e `@media (prefers-color-scheme: dark) { :root:not([data-tema="claro"]) { … } }`. Valores copiados do `DESIGN.md` (frontmatter), incluindo `--trama` do protótipo e `color-scheme`. `--ativo-hover`, `--destaque`, `--sobre-destaque` copiados de `gm-kimono.html`. Corpo: `background: var(--trama), var(--fundo); background-attachment: fixed`, `color: var(--tinta)`, `::selection`, `:focus-visible` com anel duplo, `@media (prefers-reduced-motion: reduce)` zerando transição e animação. Remover o `font-family` e o `filter` do `calendar-picker-indicator` antigos (o filtro é para fundo escuro; no claro vira `filter: none`, no escuro `invert(0.6)`).
- [ ] **Step 2: Tailwind.** Em `tailwind.config.js`: `darkMode` deixa de ser `['class']` e passa a `['selector', ':root[data-tema="escuro"]']` se algum `dark:` sobrar, senão remover. Cores `fundo, papel, tinta, 'tinta-media', 'tinta-suave', linha, controle, ativo, 'sobre-ativo', alerta, 'sobre-alerta', 'alerta-texto', erro, 'sobre-erro', 'erro-texto', sucesso` como `'var(--nome)'`; `borderRadius.DEFAULT: 'var(--r)'`; `fontFamily.display: ['var(--display)']`, `body: ['var(--ui)']`. **Manter** `bg`, `surface`, `surface-hover` e `accent` apontando para os novos tokens até a Task 3 (`bg→fundo`, `surface→papel`, `accent→ativo`), para o app não quebrar entre commits; saem na Task 3.
- [ ] **Step 3: Fontes** em `app/layout.tsx`: `Archivo({ subsets:['latin'], variable:'--font-ui', axes:['wdth'], display:'swap' })` e `Big_Shoulders_Stencil_Display({ subsets:['latin'], weight:['700','800','900'], variable:'--font-display', display:'swap' })`; `globals.css` define `--ui: var(--font-ui), system-ui, sans-serif` e `--display: var(--font-display), 'Archivo', sans-serif`. Se o `next/font` recusar o eixo `wdth`, usar Archivo de peso variável sem `axes` e aceitar a largura normal (anotar no CHANGELOG). Remover `Anton` e `Open_Sans`.
- [ ] **Step 4: `lib/tema.ts`** com as assinaturas acima. `SCRIPT_TEMA` aplica `?tema=claro|escuro` > `gm-tema` > nada, dentro de `try/catch`, como no protótipo. Em `layout.tsx`: `<html lang="pt-BR" suppressHydrationWarning>` e `<script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />` no início do `<head>`.
- [ ] **Step 5: `viewport.themeColor`** vira array: `[{ media: '(prefers-color-scheme: light)', color: '#F4F4F1' }, { media: '(prefers-color-scheme: dark)', color: '#131312' }]`. `manifest.json`: `background_color` e `theme_color` = `#131312`.
- [ ] **Step 6: Verificar.** `npx tsc --noEmit` limpo; `npm run dev` sobe; com o DevTools: sem escolha salva o `<html>` não tem `data-tema` e o tema segue o celular emulado (claro e escuro); `localStorage.setItem('gm-tema','escuro')` + reload abre escuro **sem piscar o claro** (gravar um screencast curto ou olhar o primeiro frame); `localStorage.setItem('gm-tema','lixo')` + reload abre no tema do celular, console limpo; bloquear o armazenamento (`Object.defineProperty(window,'localStorage',{get(){throw 0}})` antes de carregar não é possível; abrir em aba anônima com cookies bloqueados) não quebra. Fontes: `getComputedStyle(h1).fontFamily` mostra Big Shoulders / Archivo carregadas (`document.fonts`).
- [ ] **Step 7: Commit** `feat: G3.1 - tokens dos dois temas, fontes e troca de tema` (arquivos acima) e push.

**Resultado visível:** só as fontes mudam (e o fundo ganha trama onde o app ainda não pinta por cima). O app continua escuro e igual.

---

### Task 2 (G3.2a): `lib/cores.ts` e o fim das três cópias do tema

**Files:**
- Create: `lib/cores.ts`
- Modify: `components/AppShell.tsx:25-35` (e todo `t.accent`, `t.accentBg`, `'#fff'`), `components/LoginGate.tsx:17-22`, `components/BannerInstalar.tsx:20-28`

**Interfaces:**
- Produces:
  ```ts
  export const theme: {
    bg: string; surface: string; surface2: string; border: string; border2: string
    text: string; textSub: string; textMute: string; inputBg: string
    ativo: string; sobreAtivo: string; ativoBg: string
    alerta: string; alertaTexto: string; alertaBg: string; sobreAlerta: string
    erro: string; erroTexto: string; erroBg: string; sobreErro: string
    ui: string; display: string
  }
  export type Theme = typeof theme
  ```
  Valores: `bg→var(--fundo)`, `surface→var(--papel)`, `surface2→var(--fundo)`, `border→var(--linha)`, `border2→var(--controle)`, `text→var(--tinta)`, `textSub→var(--tinta-media)`, `textMute→var(--tinta-suave)`, `inputBg→var(--papel)`, `ativo/sobreAtivo→var(--ativo)/var(--sobre-ativo)`, `*Bg→color-mix(in srgb, var(--x) 10%, transparent)`, `ui→var(--ui)`, `display→var(--display)`.
- Consumes: os tokens da Task 1.

Esta task **só reapoia as chaves antigas**: `accent` e `accentBg` ainda existem (apontam para `ativo` e `ativoBg`), para o app compilar e abrir. A divisão em ativo/alerta/erro é a Task 3.

- [ ] **Step 1:** criar `lib/cores.ts` com o objeto acima **mais** `accent: 'var(--ativo)'` e `accentBg` (provisórios, removidos na Task 3).
- [ ] **Step 2:** `AppShell.tsx`, `LoginGate.tsx` e `BannerInstalar.tsx` passam a `import { theme, type Theme } from '@/lib/cores'`; apagar as três definições locais. `freqColor` continua igual (a divisão do vermelho dele é A3).
- [ ] **Step 3:** substituir `fontFamily: 'monospace'` por `t.ui` (ou `theme.ui` fora de componente com `t`); `fontFamily: 'var(--font-body), system-ui…'` do root do `AppShell` por `t.ui`; `borderRadius` de 4–14 px por `var(--r)` nos cards, botões, campos e chips (círculos e pílulas `999`/`50%` ficam, **exceto** pílulas de chip, que viram `var(--r)`). Isso é só visual e passa pelo `tsc`.
- [ ] **Step 4: Verificar.** `tsc` limpo; `npm run dev`; abrir nos dois temas e ver que **toda a casca já responde ao tema** (fundo, cards, texto). Vermelho ainda aparece, mas como cinza/preto do `ativo`: é esperado até a Task 3. Capturar 390 px e 1280 px, claro e escuro, de: login, lista de alunos, modal do aluno, aba Aulas, chamada. Anotar no commit o que ainda parece fora do protótipo.
- [ ] **Step 5: Commit** `refactor: G3.2a - theme em lib/cores.ts, tokens nos 3 componentes` e push.

---

### Task 3 (G3.2b): Dividir o vermelho e o verificador de cor

**Pré-requisito:** o Pedro aprovou `2026-10-22-g3-mapa-do-vermelho.md` (inclusive os pontos ❓). **Sem isso, não começar.** Se o Pedro mudou algum papel, o mapa é atualizado primeiro.

**Files:**
- Modify: `components/AppShell.tsx`, `LoginGate.tsx`, `BannerInstalar.tsx`, `DashboardProfessor.tsx`, `components/ui/{button,badge,card,avatar}.tsx`, `lib/cores.ts` (remove `accent`/`accentBg`), `tailwind.config.js` (remove `bg/surface/surface-hover/accent`), `app/globals.css` (classe `.trama-hero` se o hero precisar), `package.json` (script)
- Create: `scripts/checar-cores.mjs`, `scripts/checar-cores.test.mjs`

**Interfaces:**
- Produces (`scripts/checar-cores.mjs`): `export function acharCoresSoltas(texto: string, caminho: string): { linha: number; cor: string }[]` e, quando executado, varre `app/**`, `components/**`, `lib/**`, imprime `arquivo:linha cor` e sai com código 1 se achar. Regras: casa `#hex` (3 a 8 dígitos), `rgb(`, `rgba(`, `hsl(`, `hsla(`; **ignora** `app/globals.css` (onde os tokens nascem), `components/FaixaDesenhada.tsx`, e qualquer linha que contenha `cor-ok` (ou cuja linha de cima contenha `cor-ok`).
- `package.json`: `"checar-cores": "node scripts/checar-cores.mjs"`.

- [ ] **Step 1: Teste do verificador** (`scripts/checar-cores.test.mjs`, `node:test`): (a) `'color: "#fff"'` → 1 achado com `cor: '#fff'`; (b) `'background: var(--ativo)'` → 0; (c) `'x: "#fff" // cor-ok: faixa'` → 0; (d) cor na linha logo abaixo de `// cor-ok` → 0; (e) `acharCoresSoltas('"#abc"','app/globals.css')` → 0; (f) `rgba(0,0,0,0.5)` → 1.
- [ ] **Step 2:** `node --test scripts/checar-cores.test.mjs` → FALHA (módulo inexistente).
- [ ] **Step 3:** implementar `acharCoresSoltas` e o `main`. `node --test …` → PASSA.
- [ ] **Step 4: Aplicar o mapa.** Para cada ponto do mapa: ERRO → `t.erro`, `t.erroTexto`, `t.erroBg`; ALERTA → `t.alerta`, `t.alertaTexto`, `t.alertaBg`, `t.sobreAlerta`; ATIVO → `t.ativo`, `t.sobreAtivo`, `t.ativoBg`; NEUTRO → `t.text*`. `'#fff'` sobre fundo vermelho → `t.sobreAtivo` ou `t.sobreErro`. O FAB perde `boxShadow` colorido (a "Regra do Plano"). `#ccc` da faixa branca → `t.border`. `BELT_COLORS` e as cores de faixa levam `// cor-ok: cor de faixa (IBJJF)`. `SplashScreen` e `public/*` ficam de fora. Chip com `cores?.bg` mantém a cor da faixa (S6). No `DashboardProfessor` e `ui/*`: `text-white→text-tinta`, `text-white/60→text-tinta-media`, `bg-accent→bg-ativo`, `text-accent→` papel do mapa (`text-alerta-texto`, `text-erro-texto` ou `text-tinta-media`), gradientes avermelhados removidos (N6).
- [ ] **Step 5:** apagar `accent`/`accentBg` de `lib/cores.ts` e as cores antigas do `tailwind.config.js`. `npx tsc --noEmit` deve apontar qualquer uso esquecido.
- [ ] **Step 6:** `package.json` ganha `checar-cores`. `npm run checar-cores` → sai com 0 (nenhum achado). Se achar, corrigir ou justificar com `cor-ok`.
- [ ] **Step 7: Verificar** (390 px e 1280 px, claro e escuro, contra o `gm-kimono.html` lado a lado no DevTools): (a) forçar um erro em cada caixa possível quando dá para forçar (login com senha errada → E10; desconectar a rede e recarregar → E1) e conferir ⚠ + texto legível nos dois temas; (b) selo PRONTO e "Faltou às últimas N aulas" em âmbar nos dois temas; (c) contraste: rodar o cálculo de `docs`/scratch para os pares realmente usados (texto sobre `erroBg`, `alertaBg`) e reportar o menor valor, que tem de ser ≥ 4.5; (d) nenhum vermelho de erro encosta na ponteira (a ponteira só entra na Task 4).
- [ ] **Step 8: Commit** `feat: G3.2b - vermelho dividido em ativo/alerta/erro, verificador de cor` e push.

---

### Task 4 (G3.3): Navegação nova e Início como aba

**Files:**
- Create: `components/Navegacao.tsx`
- Modify: `components/AppShell.tsx` (estado `tab`, remover abas de texto e o `Menu` do cabeçalho, root sem `maxWidth: 480`, FAB e padding), `components/DashboardProfessor.tsx` (remover `Menu` e ajustar cabeçalho), `components/BannerInstalar.tsx` (offset), `app/globals.css` (classes `.app`, `.nav`, `.topo`, `.ponta`, `.conteudo`, `.folha`)

**Interfaces:**
- Produces:
  ```ts
  export type Aba = 'inicio' | 'alunos' | 'aulas'
  export default function Navegacao(props: {
    atual: Aba | 'lixeira'
    onIr: (aba: Aba) => void
    onGraduar: () => void       // abre o painel de prontos (setPainelProntos(true))
    onMais: () => void          // abre o MenuLateral existente
    qtdProntos: number          // badge do Graduar
  }): JSX.Element
  ```
  Cinco itens, nesta ordem e com ícone (lucide) + nome: **Início, Alunos, Aulas, Graduar, Mais**. Início/Alunos/Aulas marcam `aria-current="page"`; Graduar e Mais são botões de ação (sem `aria-current`).
- Consumes: `tab` do `AppShell` passa a `'inicio' | 'alunos' | 'aulas' | 'lixeira'`, valor inicial `'inicio'`.
- Em `MenuLateral` (já existe): o item novo **"Tema: claro/escuro"** chama `definirTema(temaEfetivo() === 'escuro' ? 'claro' : 'escuro')`.

- [ ] **Step 1: Estado.** `tab` ganha `'inicio'` (valor inicial). `DashboardProfessor` só renderiza em `tab === 'inicio'`; a lista de Alunos e a de Aulas deixam de ter o dashboard em cima. O item "Lixeira" do menu continua fazendo `setTab('lixeira')`, como já é. Nada em `tab === 'lixeira'` muda.
- [ ] **Step 2: `Navegacao.tsx`** com classes do `globals.css`, sem Tailwind e sem inline. Celular: `<nav>` fixa embaixo, 5 colunas, 60 px, `padding-bottom: env(safe-area-inset-bottom)`, aba ativa em `--ativo`/`--sobre-ativo`, badge do Graduar só com `qtdProntos > 0`. Computador (`@media (min-width: 960px)`): coluna de 232 px em `--etiqueta`, costura interna tracejada, `marca` ("GM" provisório + "GrauMestre" em estêncil), **ponteira de faixa preta no pé** (`.nav::before`, valores do protótipo), item ativo em `--destaque`. O `<main>` ganha `.conteudo` (celular: `max-width: 640px`, padding de 16 px e `96px` embaixo; computador: sem limite, padding 26×36).
- [ ] **Step 3: Cabeçalho de cada aba** (`.topo`): título em estêncil, costura dupla embaixo e **ponteira no fim da costura**, como o protótipo. Os títulos são os nomes das abas (Início, Alunos, Aulas); o do Início mostra "GrauMestre". O `Menu` (☰) do `DashboardProfessor` sai; o sino continua e abre o painel de prontos.
- [ ] **Step 4: Casca.** Root do `AppShell` perde `maxWidth: 480`/`margin: '0 auto'` e ganha `className="app"`; modais `position: fixed` ganham `max-width: 560px` centralizados no computador (classe `.folha`) para não esticar (Review Focus 6). FAB: `bottom` vira `calc(var(--barra-aba) + 16px + env(safe-area-inset-bottom))` no celular; no computador `bottom: 28px; right: 28px`. `BannerInstalar` sobe o mesmo offset. Remover as abas de texto ALUNOS/AULAS e a marcação `contagem` delas (a contagem de alunos passa para o cabeçalho "Alunos · 33").
- [ ] **Step 5: Tema no menu.** Em `MenuLateral`, item "Tema: …" com ícone sol/lua, acima de "Sair". Mostra o tema atual escrito, não só o ícone.
- [ ] **Step 6: Verificar** (390 px, 959 px, 960 px e 1280 px, claro e escuro): (a) em 959 px só a barra de baixo; em 960 px só o menu lateral, nunca os dois; (b) rolar a lista de alunos até o fim: o último card fica acima da barra; (c) o FAB e o banner de instalar não ficam atrás da barra; (d) Início → Alunos → Aulas → Graduar (abre o painel) → Mais (abre o menu) → Lixeira (abre a lixeira com o cabeçalho "‹ Lixeira" e a aba ativa nenhuma); (e) "Tema" alterna e o tema persiste ao recarregar; (f) comparação lado a lado com o `gm-kimono.html`: barra, etiqueta, costura, ponteira; (g) `getComputedStyle` dos itens da barra: altura ≥ 60 px e alvo ≥ 44 px; (h) com a rede emulada em "Offline", a barra continua respondendo.
- [ ] **Step 7: Commit** `feat: G3.3 - barra de abas, menu lateral no computador, Inicio como aba, tema no menu` e push.

---

### Task 5: Regressão com dados, revisão e fechamento

**Files:** Modify `CLAUDE.md`, `CHANGELOG.md`, `docs/PLANO-ATUAL.md`, `docs/ROADMAP.md` (marcar decisões 2 e a ✅ da G3 se for o caso), `docs/superpowers/plans/2026-10-22-g3-mapa-do-vermelho.md` (status "aplicado")

- [ ] **Step 1: Linha de base.** Antes de qualquer teste com dados, o Pedro roda no SQL Editor `select (select count(*) from alunos) a, (select count(*) from aulas) b, (select count(*) from presencas) c, (select count(*) from graduacoes) d;` e confirma **33, 5, 59, 29** (contando linhas com `deleted_at`). Se não bater, parar.
- [ ] **Step 2: Regressão no `localhost`, nos dois temas, em 390 px e 1280 px**, com dados de teste todos nomeados `ZZ-TESTE-G3`: (1) cadastrar "ZZ-TESTE-G3 Aluno"; (2) editá-lo (nome, faixa, graus), ver o card e o painel de prontos; (3) graduá-lo e abrir o histórico; (4) lançar a aula "ZZ-TESTE-G3 Aula" com foto e link do YouTube; (5) abrir a chamada e marcar **só** o aluno de teste (nunca um aluno real); desmarcar e marcar de novo; (6) sair da chamada no meio e voltar; (7) apagar a aula, o aluno e a graduação de teste e ver na Lixeira; restaurar um; (8) abrir os Filtros, o painel de prontos e o perfil do professor; (9) sair e entrar de novo. Após cada gravação, **conferir no banco** (consulta do Pedro). Console do DevTools sem erro e sem `PGRST204`.
- [ ] **Step 3: Revisão:** `react-best-practices` e `web-design-guidelines` sobre o diff; `npx tsc --noEmit`; `npm run checar-cores`; `npm run build` (o build de produção tem de passar).
- [ ] **Step 4: Limpeza real.** "Apagar" no app só carimba `deleted_at`, e a purga só roda às 04:00 UTC depois de 7 dias; então o teste **não some sozinho**. Claude entrega ao Pedro o SQL `delete from graduacoes where aluno_id in (select id from alunos where nome like 'ZZ-TESTE-G3%'); delete from aulas where tecnica like 'ZZ-TESTE-G3%'; delete from alunos where nome like 'ZZ-TESTE-G3%';` (presenças saem por cascade) e a foto da aula de teste é removida do bucket `aulas-fotos` pelo painel do Supabase. Depois o Pedro repete a consulta do Step 1 e a resposta tem de voltar a **33, 5, 59, 29**. Se não voltar, parar e reportar; não commitar.
- [ ] **Step 5: Documentação** (parte de "pronto"): `CLAUDE.md` (a seção da Stack sobre o `AppShell` passa a dizer que o tema vem de `lib/cores.ts` em `var(--…)`; seção nova curta "Tema e navegação" com `lib/tema.ts`, o verificador `checar-cores` e a regra `cor-ok`; tabela "Onde as coisas moram" com `lib/cores.ts`, `lib/tema.ts`, `components/Navegacao.tsx`, `scripts/checar-cores.mjs`), `CHANGELOG.md`, `docs/PLANO-ATUAL.md` (G3 concluída), `ROADMAP.md` (decisões 2 e a navegação marcadas ✅).
- [ ] **Step 6: Commit** `docs: fecha a G3` e push; `git log origin/desenvolvimento..desenvolvimento` vazio; conferir o deploy de Preview da Vercel (`success`).
- [ ] **Step 7:** o Pedro testa no `localhost` (regra 6 do ROADMAP) **antes** de a G4 começar.
