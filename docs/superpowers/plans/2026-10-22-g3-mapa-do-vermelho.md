# G3 — Mapa do vermelho: o papel de cada ponto

> **Status: aplicado** (Tasks 2 e 3 da G3, aprovado pelo Pedro em 2026-10-22,
> A7 = alerta; N3, N4 e N5 como propostos). Ver os `Ruling:` do ledger da G3
> para os desvios (hero do Início como etiqueta escura; `--scrim` virou token).

Hoje o `accent` (`#df2531`) faz quatro trabalhos no mesmo vermelho. No
`DESIGN.md` cada trabalho tem um token. **Nenhuma cor é trocada antes de o
Pedro aprovar esta lista** (pedido dele, 2026-10-22).

Linhas são do `components/AppShell.tsx` em 2026-10-22, salvo indicação.

**Papéis** (todos em `DESIGN.md`):

| Papel | Token | Para quê |
|---|---|---|
| **ativo** | `ativo` / `sobre-ativo` | Ação principal, seleção, presença marcada. Preenchimento neutro: preto no kimono branco, branco no kimono preto |
| **alerta** | `alerta` / `alerta-texto` | Coisa que o professor precisa olhar. Âmbar |
| **erro** | `erro` / `erro-texto` | Falha, impedimento, ação destrutiva. Vermelho de erro, sempre com ⚠ e texto |
| **neutro** | `tinta`, `tinta-media`, `tinta-suave` | Era vermelho só por enfeite; não carrega estado nenhum |

Os pontos marcados **❓** são os que eu classifiquei com dúvida. Quero a sua
palavra neles.

---

## ERRO (11 pontos)

Todos são a mesma caixa: fundo `accentBg`, borda e texto `accent`, começando
por "⚠". Viram `erro`: fundo `erro` a 10%, borda `erro`, texto `erro-texto`.

| # | Onde | Linha |
|---|---|---|
| E1 | Falha ao carregar os dados (`erroCarga`) | 2728–2732 |
| E2 | Botão "Tentar de novo" dentro dela | 2742–2743 |
| E3 | Perfil do professor não carregou (`erroPerfil`) | 2754–2755 |
| E4 | Erro ao apagar aula (`erroAula`) | 2821–2822 |
| E5 | Erro ao salvar o aluno (`ModalAluno`) | 1596–1597 |
| E6 | Erro da foto da aula (`erroFoto`) | 2087–2088 |
| E7 | Erro ao salvar a aula (`ModalAula`) | 2113–2114 |
| E8 | Erro na chamada (`Chamada`) | 2328–2329 |
| E9 | Erro na lixeira (`Lixeira`) | 2489–2490 |
| E10 | Erro de login (`LoginGate`) | `LoginGate.tsx` 128–129 |
| E11 | Botão "Remover foto" (borda e texto) | 2063–2064 |

E11 é destrutivo, não é falha. Continua `erro` porque é a única ação do app
que apaga um arquivo.

## ALERTA (7 pontos)

| # | Onde | Linha |
|---|---|---|
| A1 | Selo "PRONTO" no canto do card do aluno | 259 |
| A2 | Motivo do alerta no painel de prontos (`alerta.msg`) | 1084 |
| A3 | Frequência baixa: anel e barra (`freqColor`, abaixo de 50%) | 41 |
| A4 | Ritmo vencido: "Já passou N dia(s) do seu ritmo" | 1493 |
| A5 | "N dias restantes" da faixa provisória | 1566–1567 |
| A6 | Motivo do afastamento no card "Precisa atenção" | `DashboardProfessor.tsx` 158 |
| A7 ❓ | "⚠ motivo" quando a promoção de faixa é barrada pela regra (`aprovacao.motivo`) | 1584 |

**A7:** é um impedimento que desabilita o "Salvar". Poderia ser `erro`. Pus
`alerta` porque não é falha do app: é uma regra da IBJJF avisando. Se você
quiser que o que bloqueia seja sempre `erro`, é só dizer.

## ATIVO (a maior parte)

### Botões de ação principal (preenchimento + texto `sobre-ativo`)

| # | Onde | Linha |
|---|---|---|
| T1 | "Salvar alterações" do perfil do professor | 827 |
| T2 | "Salvar" do aluno | 1615 |
| T3 | "Salvar" da aula | 2128 |
| T4 | "Ver N alunos" do painel de filtros | 606 |
| T5 | "Entrar" | `LoginGate.tsx` 138 |
| T6 | "Instalar" | `BannerInstalar.tsx` 94 |
| T7 | Botão flutuante "+" (e a sombra vermelha dele, que sai) | 3066, 3069; `ui/button.tsx` 12, 19 |
| T8 | `ui/button` variante `default` e `outline` | `ui/button.tsx` 12–13 |

### Selecionado

| # | Onde | Linha |
|---|---|---|
| S1 | Aba ativa (Alunos/Aulas) e sublinhado. **Vira a barra de abas na G3.3** | 2773–2774, 2780 |
| S2 | Aba ativa dentro do modal do aluno | 1287, 1290 |
| S3 | Botão de grau selecionado (perfil e aluno) | 739–740, 1445–1446 |
| S4 | Borda da faixa selecionada | 1435 |
| S5 | Toggle ligado e seu fundo | 641, 647 |
| S6 | Chip de filtro ativo e chip removível. Quando o chip tem a cor da faixa (`cores`), **a cor da faixa continua**. Só o chip sem faixa troca | 387–389, 413–414 |
| S7 | Chip da posição da aula selecionada | 1993–1995 |
| S8 | Borda do card ao passar o mouse | 232 |
| S9 | Badge com a contagem em "Filtrar" | 460 |
| S10 | Badge de contagem do menu | 917 |
| S11 | Badge do sino e do menu na home, e o ponto dos "Prontos" | `DashboardProfessor.tsx` 211, 224, 251 |
| S12 | `ui/badge` `solid` e `outline`, `ui/card` (borda) | `ui/badge.tsx` 60–61; `ui/card.tsx` 9 |

### Presença marcada

| # | Onde | Linha |
|---|---|---|
| P1 | Linha marcada na chamada (fundo e borda) | 2354–2355 |
| P2 | Círculo de presença preenchido | 2378–2379 |
| P3 | Número de presentes ("12 de 33 presentes") | 2299 |
| P4 | Botão "Marcar todos" | 2307 |

Presença marcada **nunca é verde**: usa o preenchimento `ativo`.

### Ação secundária e link

| # | Onde | Linha |
|---|---|---|
| L1 | "Restaurar" na lixeira | 2527 |
| L2 | Botão de abrir vídeo (fallback da miniatura) | 1782–1783 |
| L3 | Link "Voltar ao automático" | 1345 |

## NEUTRO (era vermelho só por enfeite)

| # | Onde | Linha | Vira |
|---|---|---|---|
| N1 | Inicial do nome quando o aluno não tem foto (card, painel, chamada) | 292, 1076, 2367 | `tinta-media` |
| N2 | Texto "+1 grau → …" / "grau completo → promover" no painel Próximo passo | 1459, 1461, 1465 | `tinta` |
| N3 ❓ | Nome da posição da aula ("GUARDA FECHADA") no card da aula | 2879 | `tinta-media` |
| N4 ❓ | Gráficos do Início: donut, barras e anel de progresso | `DashboardProfessor.tsx` 35, 38, 85–86, 104 | `ativo` (barras a 45–65%) |
| N5 ❓ | "N% freq" do card "Perto da faixa" | `DashboardProfessor.tsx` 146 | `tinta-media` |
| N6 | Fundos do Início: gradiente avermelhado do topo e brilho vermelho do hero | `DashboardProfessor.tsx` 197, 237 | `fundo` + trama |
| N7 | Avatar sem foto (`ui/avatar`) | `ui/avatar.tsx` 39 | `linha` + `tinta` |

**❓ N3 e N5:** não carregam estado, só estavam em vermelho. Pus neutro porque
colorir sem significado vai contra a "Regra da Cor com Palavra". Se você quiser
algum deles com cor, diga qual.

**❓ N4:** o donut e as barras não dizem "bom" nem "ruim", só "quanto".
Preenchimento neutro (`ativo`) é o mais honesto. O ponto delicado é o donut de
frequência: se ele ficar neutro, a leitura "frequência baixa = atenção" deixa
de estar no gráfico (continua no A3, nos cards).

---

## Fora do mapa (não trocam de papel)

- **Cores de faixa** (`BELT_COLORS`, `FaixaDesenhada.tsx`): são da IBJJF, não do
  tema. Ficam como estão, marcadas como exceção no verificador de cor.
- **`#ccc` em volta da faixa branca** (linhas 169 e 313): é o contorno da faixa
  branca sobre fundo claro. Vira `linha`, porque a faixa branca precisa de
  contorno nos dois temas.
- **`SplashScreen`** (`#0a0a0a`): a abertura em vídeo é escura até a G12.
  Exceção marcada.
- **`#fff` sobre fundo vermelho** em 22 lugares: não é um ponto à parte. Vira
  `sobre-ativo` ou `sobre-erro` junto com o fundo de cada botão ou badge.

Total: 11 erro, 7 alerta, 27 ativo, 7 neutro = 52 pontos (cada linha da
tabela é um ponto; um ponto pode ter várias linhas de código).
