# PLANO-ATUAL.md — Lote de atualizações (agosto/2026)

Plano vivo deste lote de trabalho. **O `CLAUDE.md` diz como o projeto é; este
arquivo diz o que está sendo feito agora e onde paramos.** Quando o lote
fechar, o que virou verdade permanente migra para o `CLAUDE.md` e este arquivo
recomeça vazio — ele não é histórico, o `CHANGELOG.md` é.

---

## Como o Claude Code usa este arquivo

Em **toda** sessão deste lote, nesta ordem:

1. **Ler `CLAUDE.md` inteiro antes de tocar em qualquer coisa.** Ele tem as
   armadilhas que já morderam este projeto (whitelist de colunas, `select a.*`
   da view, inline styles no `AppShell`). Nenhuma delas é teórica.
2. **Ler este arquivo e achar a primeira etapa com status `PENDENTE`.** Só ela.
   Etapa seguinte não começa antes de a anterior estar `CONCLUÍDA` e commitada
   — regra do usuário, sem exceção.
3. **Ler o código real da etapa** antes de propor qualquer coisa. Não planejar
   de memória, nem deste arquivo: ele descreve intenção, o código é o fato.
4. **Apresentar um plano curto e esperar o "ok"** antes de escrever a primeira
   linha. Se aparecer uma decisão que é do usuário (navegação, modelagem de
   dado, texto que ele vai ler no tatame), **perguntar em vez de supor**.
5. **Implementar.** Se a etapa tem migration, o SQL fica pronto num arquivo
   numerado em `supabase/migrations/` e **o usuário roda à mão** no SQL Editor
   do Supabase — o Claude Code não tem DDL. Avisar claramente que a etapa está
   parada esperando isso, e não seguir para os testes antes da confirmação.
6. **Verificar:** `npx tsc --noEmit` limpo, `npm run dev` subindo, e **teste
   manual no `localhost`, relatado teste por teste**. Conferir no banco, não só
   na tela. Teste que falha = parar e reportar, nunca commitar por cima.
7. **Limpar o dado de teste** criado durante a verificação.
8. **Atualizar `CLAUDE.md`, `CHANGELOG.md` e este arquivo** (status da etapa +
   o que mudou de fato) — antes do commit, faz parte de "pronto".
9. **Commit.** Uma etapa, um commit.

### Reportando progresso

O usuário acompanha de fora. A cada passo, dizer **em uma linha** o que está
fazendo e o que vem depois — "li o AppShell, achei o ponto X, vou propor o
plano", "migration escrita, parado esperando você rodar no Supabase", "teste 3
de 5 passou". Silêncio longo no meio de uma etapa é o que faz o usuário perder
a linha do que está acontecendo.

---

## Decisões já tomadas neste lote — não reabrir

Estas foram discutidas e fechadas. Reabrir custa uma sessão inteira.

### 1. O card "Prontos para graduar" estava errado por um motivo diferente do que parecia

A suspeita inicial era "o app conta 6 meses e não devia". **Não é isso.**
Conferido no PDF do Sistema Geral de Graduação da IBJJF que está no projeto:

- **Art. 3.1.3 I: "Faixa Branca: Não há tempo mínimo."** Zero. Por isso
  `tempoMinimoAnos()` devolve `0` no `default` do switch, e
  `prontoParaProximaFaixa()` devolve `true` para **todo branca adulto desde o
  dia da matrícula**. O card não estava contando errado — ele nunca exigiu
  tempo nenhum. Era ruído por construção.
- **Os "6 meses" não são exigência da IBJJF.** O único "6 meses" do documento é
  a *sugestão* de 1 grau por mês nas faixas Branca e Cinza-e-Branca para
  crianças de 4 a 15 anos (Anexo I, item 1.4). Não vale para adulto e não é
  obrigação.
- **Os "5 meses" são do próprio professor**: é o `meses_entre_graus` (default
  5) da migration 013, que ele mesmo configurou.
- **Art. 3.2.2: "O período para um atleta se graduar da Faixa Branca à Faixa
  Preta fica a critério de cada Professor."** É esta brecha — e não uma regra
  da federação — que autoriza o critério de presença adotado abaixo.

**Consequência de arquitetura:** o critério de presença é preferência do
professor, então mora em `lib/ritmo-graus.ts` (+ `professor_perfil`), **nunca**
em `lib/regras-ibjjf.ts`. A separação dos dois arquivos existe exatamente para
isso — ver a seção "Graus" do `CLAUDE.md`.

### 2. O alerta passa a ser sobre GRAU, não sobre FAIXA

O card dizia "pronto para próxima faixa". O que o professor faz toda semana é
**dar grau**. Faixa é evento raro e ele decide sozinho; grau é rotina e é onde
o app ajuda.

O aviso de faixa não some — ele passa a aparecer só quando é verdade de
verdade: aluno **no teto de graus da faixa** (4º) **e** com o tempo mínimo da
IBJJF cumprido **e** com idade mínima válida.

### 3. O critério de presença: 48 presenças desde o último grau

Definido pelo professor: ~2 aulas por semana durante 6 meses ≈ **48 presenças**.
Contadas **desde a última graduação registrada** (ou desde a matrícula, quando
não há nenhuma), não desde a matrícula sempre.

- **É contagem absoluta, não porcentagem.** Foi a escolha do professor.
- **É editável** no Perfil do Professor (`professor_perfil.presencas_por_grau`,
  default 48) — ele já avisou que pode querer mudar.
- **Não há trava de tempo junto.** Um aluno que treina 4x por semana chega às
  48 presenças em ~3 meses e aparece como pronto. Isso é coerente com o
  critério escolhido — o que importa é o tatame, não o calendário — e o art.
  4.1.3 permite. **Se o professor quiser um piso de meses também, é uma linha a
  mais e uma decisão dele, não do código.**
- **Faixa preta é exceção e continua na IBJJF.** Lá os intervalos entre graus
  são 3/5/7/10 anos (art. 4.1.5) e nenhum critério de presença os substitui.

**Propriedade que cai de graça:** como cada grau custa 48 presenças, chegar ao
4º grau já exige ~192 presenças. Então o aviso de *faixa* — que só dispara no
teto de graus — fica protegido pela mesma barreira, mesmo onde a IBJJF não
exige tempo nenhum. É por isso que não é preciso inventar regra de tempo para a
branca.

### 4. Notificações vão para o sininho, não para uma aba nova

O `<Bell>` e o `<Menu>` do header do `DashboardProfessor` são ícones **sem
`onClick` nenhum** hoje — decoração. O sininho é o lugar natural do alerta, e
usá-lo evita a 4ª aba (as instruções do projeto pedem para não crescer a
navegação sem ganho claro).

### 5. Vídeo da aula: "não listado", nunca "privado"

Vídeo marcado como **Privado** no YouTube não tem miniatura nem player para
mais ninguém — nem para o aluno logado. Só **Não listado** funciona. E o
YouTube só entrega miniaturas fixas (`hqdefault`, `mqdefault`, `0..3`): não dá
para escolher "um trecho qualquer do vídeo" sem a API oficial. O card usa a
capa oficial do vídeo, e o campo do link avisa a diferença.

---

## Etapas

Ordem é dependência, não preferência. A 1 muda **o que** a 2 mostra; a 2 e a 3
mexem no mesmo header.

---

### ETAPA 1 — Prontidão por GRAU e por presença · `CONCLUÍDA` (2026-08-30)

**O problema:** todo branca adulto aparece em "Prontos para graduar" desde o
primeiro dia, o que transforma o card no ruído que ele deveria eliminar.

**Escopo**

`supabase/migrations/014_prontidao_por_presenca.sql`:

- `professor_perfil.presencas_por_grau int not null default 48`, com `check
  between 1 and 500` e `comment on column` explicando que é critério do
  professor (art. 4.1.3), não da federação.
- **`drop view` + `create view` de `alunos_frequencia`**, acrescentando duas
  colunas derivadas por aluno, com a data-base
  `coalesce((select max(g.data) from graduacoes g where g.aluno_id = a.id and
  g.deleted_at is null), a.inicio)`:
  - `presencas_desde_graduacao` — `presencas.presente = true`, em aula com
    `deleted_at is null` e `data >= data-base`;
  - `aulas_desde_graduacao` — aulas ativas com `data >= data-base`, para a tela
    poder mostrar "31 de 48".
- **`grant select on alunos_frequencia to authenticated`** de novo — o grant cai
  junto com a view dropada. É a armadilha da 005/008/010; ver `CLAUDE.md`.

> **Por que isto tem que ser SQL e não pode ser calculado no client:**
> `lib/carregar-dados.ts` busca aulas com `.limit(50)`. Contar 48 presenças
> exige olhar pelo menos 48 aulas — o limite quebraria a conta exatamente no
> ponto onde ela importa. A view não tem limite.

`lib/ritmo-graus.ts` (e **não** `regras-ibjjf.ts` — ver Decisão 1):

- `PRESENCAS_POR_GRAU_PADRAO = 48`.
- `prontoParaProximoGrau(aluno, presencasPorGrau)` → `{ pronto, presencas,
  necessarias, faltam }`. Devolve `pronto: false` para faixa preta (lá manda a
  IBJJF) e para quem já está no teto de graus da faixa.

`lib/alertas-graduacao.ts` — `alertaGraduacao()` reescrito. Passa a devolver um
objeto discriminado em vez de `string | null`, porque o painel da Etapa 2 vai
precisar saber se o alerta é de grau ou de faixa para agrupar:

```ts
type Alerta =
  | { tipo: 'grau';  msg: string; proximoGrau: number }
  | { tipo: 'faixa'; msg: string; faixaAlvo: Faixa }
  | null
```

Regras, nesta ordem:

1. **Faixa preta** → lógica atual, intocada (`podeProximoGrauPreta`).
2. **Abaixo do teto de graus** → alerta de `grau` **só** quando
   `prontoParaProximoGrau()` passar.
3. **No teto de graus (4º)** → alerta de `faixa`, e só se
   `prontoParaProximaFaixa()` **e** `idadeMinimaValida(aluno, proximaFaixa)`
   passarem. *(A checagem de idade não existe hoje — é correção junto.)*
4. **Infantil**: o critério de presença vale igual (o professor decide os graus
   das crianças também). Deixa de ser `null` automático. **Conferir no teste se
   o resultado agrada — se encher a lista de criança, é uma linha para voltar
   atrás.**

Três call sites a atualizar para o novo retorno: `AlunoCard` (selo do card),
`DashboardProfessor` (lista de prontos), e `aplicarFiltros` (chip "Prontos").

`ModalProfessor` ganha o campo de `presencas_por_grau` — **whitelist explícita
no update**, ao lado de `graus` e `meses_entre_graus`.

**Não entra nesta etapa:** mexer no layout da home, no sininho, no hambúrguer.
A lista de prontos continua onde está; ela só encolhe. Quem move é a Etapa 2.

**Critério de aceite**

- [x] `Felipe Polenta` **sai** da lista de prontos. Confirmado: 0 presenças
      desde a última graduação.
- [ ] Um aluno com ≥48 presenças desde o último grau **continua** aparecendo.
      **Não testável ainda** — ver linha de base abaixo. Fica pendente de
      verificação orgânica conforme a chamada real acumula.
- [x] O selo do card, a lista da home e o chip "Prontos" mostram exatamente o
      mesmo conjunto — é a mesma função, com o mesmo `presencasPorGrau`
      thread-ado nos três call sites.
- [x] Aluno faixa preta não teve o comportamento alterado em nada.
- [x] Editar aluno continua salvando. `presencas_desde_graduacao` e
      `aulas_desde_graduacao` **não** entraram em `COLUNAS_ALUNO` — confirmado
      no código antes do commit, são colunas só da view.
- [x] `select` de conferência no banco batendo com o que a tela mostra.

**Linha de base em 2026-08-30, no momento em que a migration foi rodada:** 3
aulas lançadas no banco, presença máxima de 1 em toda a turma,
`presencas_desde_graduacao` de todo mundo abaixo de `presencas_por_grau`
(48) — zero alunos prontos, nenhuma criança incluída. **Isto é o estado
esperado, não um alerta quebrado.** A lista de "Prontos para graduar" vai
ficar vazia por meses, até a chamada acumular histórico de verdade; o
professor promove na mão nesse meio tempo — decisão aceita, não um bug a
corrigir. Quem ler isto daqui a alguns meses e achar a lista sempre vazia
estranha: compare `presencas_por_grau` do professor contra
`presencas_desde_graduacao` de um aluno específico antes de suspeitar de bug
no código.

---

### ETAPA 2 — Sininho com painel de notificações · `CONCLUÍDA` (2026-08-30)

Sininho ganha `onClick` e um badge com a contagem de prontos. O toque abre um
painel deslizante (mesmo padrão de modal já usado no app) listando todos, com
foto, nome, faixa e o motivo ("48 de 48 presenças — pronto para o 2º grau").
Tocar num aluno abre o modal dele **já na aba de graduação**, como o card faz
hoje.

A lista sai da home. Se ninguém está pronto, o sininho fica sem badge e o
painel diz isso em uma linha, em vez de sumir — ícone que às vezes não faz nada
volta a parecer decoração.

**Decisão tomada em 2026-08-30, antes de codar a etapa:** o painel é
**binário** (pronto / não pronto), sem barra de progresso — decidido sabendo
que, com a linha de base atual (3 aulas no banco), ele fica vazio por meses.
Mas o **estado vazio tem que ser explícito**, com o motivo em uma linha, algo
como *"nenhum aluno com 48 presenças desde o último grau — contando desde a
primeira aula lançada"*. Painel que abre e não mostra nada, sem dizer por
quê, volta a parecer decoração — exatamente o problema que esta etapa existe
para resolver.

**Aceite (verificado em 2026-08-30, no localhost):**

- [x] Home sem a lista — `ProntosParaGraduar` removido de `DashboardProfessor.tsx`.
- [x] Badge com número certo (bolinha no sininho, só quando `qtdProntos > 0`).
- [x] Painel abre, fecha (✕ e toque fora) e navega — tocar num aluno fecha o
      painel na hora e abre o modal já na aba de graduação, sem empilhar
      overlays (mesmo padrão que `ModalAula` usa ao entregar para `Chamada`).
- [x] Contagem some quando não há ninguém pronto.
- [x] Estado vazio explica o motivo: *"Nenhum aluno com N presenças desde o
      último grau. O app conta a partir das aulas lançadas na chamada."*
      (N = `presencas_por_grau` ao vivo).
- [x] Testado baixando "Presenças por grau" para 1 (badge e painel enchem) e
      voltando para 48 (badge some, estado vazio volta) — inclusive largura
      de celular e fechar tocando fora do painel.

O painel (`PainelProntos`) mora no `AppShell.tsx`, com os outros 4 modais e o
mesmo padrão de bottom sheet (`visible`/`handleClose` com fade de 220ms) — não
um 5º padrão em Tailwind dentro do `DashboardProfessor`. A lista de prontos é
computada uma vez no `AppShell` (mesma `alertaGraduacao()` de sempre); o
`DashboardProfessor` recebe só `qtdProntos` (badge + estatística do hero,
que continuam mostrando o mesmo número de propósito) e `onAbrirProntos`.

Cada item do painel mostra, abaixo do motivo (`alerta.msg`), uma linha de
evidência: para alerta de **grau**, "X de Y presenças desde o último grau"
(via `prontoParaProximoGrau()`); para alerta de **faixa**, "Tempo mínimo da
faixa cumprido" — não é barra de progresso, é a justificativa de quem já
está na lista.

---

### ETAPA 3 — Hambúrguer com menu de verdade · `CONCLUÍDA` (2026-08-30)

`<Menu>` ganhou `onClick` e abre `MenuLateral` — mesmo padrão de modal dos
outros (`AppShell.tsx`, `visible`/`handleClose` com fade de 220ms), mas
entra pela esquerda em vez de subir de baixo. Quatro itens: **Perfil do
Professor**, **Lixeira** (com a contagem de `naLixeira` na própria linha),
**Instalar no celular** (só aparece com um `beforeinstallprompt` capturado —
o componente assina `lib/instalacao.ts` por conta própria, mesmo padrão do
`BannerInstalar`) e **Sair** (rodapé da gaveta, com o apelido da sessão —
`email.split('@')[0]` — em vez do e-mail inteiro).

**Decisão sobre `tab`:** manteve o tipo `'alunos' | 'aulas' | 'lixeira'` —
não virou estado separado. A barra de abas só deixou de iterar o terceiro
botão (`['alunos', 'aulas']`); o item "Lixeira" do menu faz `setTab('lixeira')`.
Todo o resto do render que já checava `tab === 'lixeira'` (conteúdo da aba,
FAB escondido) continuou correto sem tocar em nada — era exatamente por
reaproveitar essas duas condições que essa opção venceu a de duplicar em
estado novo.

**Achado no meio do teste, corrigido antes de fechar a etapa:** com a
lixeira fora da barra de abas, nenhum botão ficava destacado ao entrar
nela — nada na tela dizia "você está na lixeira" nem como sair. `Lixeira`
ganhou cabeçalho próprio, "‹ Lixeira" tocável, que chama `onVoltar` (→
`setTab('alunos')`); aparece também no estado de carregamento, não só na
lista carregada.

`ProfessorCard` saiu da home e o componente foi removido (sem uso). O bloco
"Sessão" saiu do `ModalProfessor` inteiro — e-mail e botão Sair moraram
juntos, foram embora juntos, para o rodapé do `MenuLateral`.

**Aceite (verificado em 2026-08-30, no localhost):**

- [x] Menu abre e fecha — ✕, toque fora, com a lixeira vazia e cheia.
- [x] Cada item leva ao lugar certo (Perfil, Lixeira, Instalar quando
      disponível, Sair → tela de login).
- [x] Badge de itens na lixeira visível em dois lugares: bolinha no
      hambúrguer e contagem na linha "Lixeira" do menu — os dois lêem
      `naLixeira`.
- [x] Abas caem para duas; FAB continua certo em cada uma e some na lixeira
      (`tab !== 'lixeira'`, sem mudança nessa condição).
- [x] Home mais curta, sem o card do professor.
- [x] "‹ Lixeira" leva de volta a Alunos.
- [x] Rodapé do menu mostra o apelido (não o e-mail inteiro) e Sair funciona.

---

### ETAPA 3B — Uma resposta só para "quem sumiu" · `CONCLUÍDA` (2026-08-30)

Entra **depois da Etapa 3 e antes da Etapa 4**. Decidida em 2026-08-30, olhando
a home rodando com a Etapa 1 no ar.

**O problema, em duas camadas**

*Camada 1 — o app tem duas respostas para a mesma pergunta.* "Quem sumiu?" é
respondido em dois lugares que podem discordar:

- o selo **AFASTADO** usa `estaAfastado()` (`lib/afastamento.ts`): 21 dias sem
  presença, com override manual do professor;
- o card **"Precisa atenção"** (`DashboardProfessor.tsx`) usa outra conta:
  `total_presencas / total_aulas < 0.5`.

Um aluno que treinou seis meses seguidos e sumiu há 25 dias tem 100% de
frequência (fora do "atenção") **e** selo AFASTADO. Outro que vem irregular mas
treinou ontem cai em "atenção" e não tem selo. É a mesma divergência de duas
fontes que a migration 010 foi escrita para matar — ver o cabeçalho dela.

*Camada 2 — afastamento é medido em dias de calendário, não em aulas.* Um aluno
que ficou 21 dias sem vir numa quinzena em que **não houve aula** não faltou a
nada, mas leva o carimbo igual. É por isso que em 2026-08-30, com 3 aulas
lançadas, **todo card da lista tinha o selo AFASTADO**: `ultima_presenca_data`
era nulo para quase todo mundo e `dias === null` cai direto em afastado. Os
alunos estavam treinando; o app é que não sabia.

**Escopo**

- `lib/afastamento.ts`: a regra automática passa a contar **aulas ativas
  perdidas desde a última presença**, não dias. Com ~2 aulas por semana, 6
  aulas ≈ os 21 dias de hoje, então o comportamento com dado cheio quase não
  muda — o que muda é que **sem aula lançada não existe afastado**, porque
  ninguém perdeu nada.
  - `DIAS_PARA_AFASTADO` vira algo como `AULAS_PARA_AFASTADO`. **Ajuste só num
    lugar**, como hoje.
  - As **duas camadas continuam**: `afastado_manual` true/false ganha do
    cálculo, e voltar para `null` devolve o automático. O professor sabe de
    lesão e viagem, o app não.
  - `motivoAfastamento()` passa a dizer o que virou verdade ("faltou às últimas
    6 aulas"), não "sem presença há N dias".
  - **"Nunca teve presença" deixa de ser afastado automaticamente.** Aluno novo
    numa academia sem chamada lançada não é aluno que sumiu.
- `DashboardProfessor.tsx`: "Precisa atenção" passa a usar `estaAfastado()` — a
  **mesma** função do selo. Uma resposta só.
- A porcentagem **continua existindo onde ela faz sentido**: o anel de
  frequência do card e o donut da home. Ela mede comprometimento, não sumiço.
  Não confundir as duas coisas de novo.

**Onde o dado tem que vir**

`ultima_presenca_data` é derivada em `lib/carregar-dados.ts` a partir das aulas
já carregadas — e essa carga tem `.limit(50)`. Contar **aulas perdidas** exige
saber quantas aulas ativas aconteceram depois da última presença do aluno.
Decidir antes de codar se isso cabe no client com as 50 aulas (provavelmente
sim, já que o limiar é ~6) ou se pede coluna nova na view — **e, se pedir,
lembrar que a view é `select a.*` e precisa de drop + create + grant**, a
armadilha da 005/008/010/014.

**Fora de escopo, de propósito**

O rótulo do card "Perto da faixa" continua mentindo (mostra o aluno com maior
frequência, não quem está perto da faixa). O professor viu e escolheu deixar
para depois.

**Resolvido sem migration.** `ultima_presenca_data` já era derivada em
`lib/carregar-dados.ts` a partir das aulas carregadas (`.limit(50)`); `aulas_perdidas`
entrou no mesmo laço — conta, entre essas mesmas aulas, quantas têm
`data > ultima_presenca_data` (aluno com presença), ou reusa `total_aulas`
da view (aluno sem nenhuma) — que já é "aulas ativas desde a matrícula",
dando 0 para quem entrou numa academia sem chamada lançada. A view
`alunos_frequencia` não foi tocada.

`DIAS_PARA_AFASTADO` (21) virou `AULAS_PARA_AFASTADO = 6`.
`motivoAfastamento()` passou a dizer "Faltou às últimas N aulas" (tinha
presença) ou "Nunca esteve presente (N aulas lançadas)" (nunca teve),
textos escolhidos pelo usuário entre opções propostas. O card "Precisa
atenção" do `PainelProfessor` passou a mostrar esse motivo, não mais
porcentagem — e a virar sobre `estaAfastado()`, a mesma função do selo.

**Critério de aceite (verificado em 2026-08-30, no localhost):**

- [x] Com poucas aulas lançadas, **nenhum** aluno aparece como afastado
      automaticamente — só quem o professor marcou à mão.
- [x] O selo do card e o card "Precisa atenção" listam exatamente o mesmo
      conjunto. São a mesma função.
- [x] O chip "Afastados" do filtro concorda com os dois (já chamava
      `estaAfastado()`, se beneficiou sem precisar de mudança própria).
- [x] Override manual continua ganhando nos dois sentidos, e voltar para
      `null` devolve o automático.
- [x] O anel de frequência e o donut **não** mudaram — `comFrequencia`,
      `freqMedia` e `comPct`/`perto` ("Perto da faixa") ficaram intocados.

---

### ETAPA 4 — Faixa visual com graus no card do aluno · `CONCLUÍDA` (2026-09-01)

Os losangos (`Diamonds`) e o texto-só (`BeltBadge`) viraram o desenho da
faixa de verdade: `components/FaixaDesenhada.tsx` (arquivo novo, SVG inline)
com corpo em gradiente, trama de tecido, costura, ponteira e esparadrapos
por grau. `BeltBadge` passou a ser etiqueta + `<FaixaDesenhada/>`; o grid de
33 cards usa `<FaixaDesenhada size="sm"/>` sozinho. `<FaixaDefs/>` (gradientes
+ patterns) é montada uma única vez no `AppShell`, nunca por instância.

Foi mais rodada de handoff do que o previsto — duas decisões erradas
tomadas no meio do caminho foram corrigidas antes do commit, e ficam
registradas aqui para não voltar:

- **As 13 infantis de duas cores não são duas metades lado a lado** — a
  primeira proposta foi essa e estava errada. O art. 1.3.1 pede cor do grupo
  com uma listra branca ou preta **ao centro, em todo o comprimento**.
  Corrigido antes de desenhar as 13, a partir da citação literal do artigo.
- **A trama inicial rodava 35° e lia como jeans**, não como o algodão
  ondulado de uma faixa de verdade. Corrigida para correr no comprimento
  (sem `patternTransform`), depois de comparação com foto de referência.

Dois achados reais durante a revisão visual das 17, sem estarem no escopo
pedido:

- **`verde_preta`**: a listra preta quase sumia sobre o corpo verde (cores
  de luminância parecida). Corrigido com a regra "a listra decide o
  contorno pela claridade dela mesma, nunca pela do corpo" — documentada em
  CLAUDE.md para não regredir.
- **A preta ia tentar desenhar 9 espaços de esparadrapo** (o teto de
  negócio, até o honorário) onde só cabem 6 (7º–9º já são outro desenho).
  `MAX_ESPARADRAPOS_PRETA = 6` é constante de desenho, não de regra —
  mora em `FaixaDesenhada.tsx`, não em `regras-ibjjf.ts`.

**Decisão de produto tomada no meio da etapa:** grau sempre no modo
"preenchido" (todos os espaços do teto aparecem, os conquistados acesos) —
comparado ao vivo com o modo "só os que existem" numa página de teste
(`/faixas`, descartável, apagada antes do commit) antes do usuário escolher.

`grausMaximos(faixa, infantil)` ganhou o segundo parâmetro nesta etapa
(mesmo motivo de `proximaFaixa()`). O caso do adulto cadastrado em faixa
infantil (`amarela`) foi decidido de propósito: 3, "a faixa manda" — ver
CLAUDE.md.

**Critério de aceite (verificado em 2026-09-01, no app real com os 33
alunos, localhost):**

- [x] As 17 faixas renderizam corretamente (revisão visual em `/faixas`
      antes de integrar, e no app depois).
- [x] 0 até o teto de graus corretos, com o teto certo por faixa/infantil.
- [x] Preta com 7º/8º/9º sem quebrar — construções próprias, distintas
      entre si.
- [x] Legível no celular, nos dois tamanhos (`sm` no grid, `md` no modal).
- [x] Grid de 33 cards rolando liso com `size="sm"` (sem trama/costura).
- [x] Sem erro de console em nenhuma tela testada (grid, modal do aluno,
      painel do sininho).

**Fora de escopo desta etapa, registrado como experimento à parte (ver
"Fila depois deste lote" ou handoff):** textura (trama/costura) no
`AlunoCard` do grid, hoje em `size="sm"` sem elas. Aprovado como está;
pedido do usuário foi só testar, numa página separada, se dá pra melhorar
sem regredir a performance da rolagem.

---

### ETAPA 5 — Filtros agrupados num controle só · `PENDENTE`

Hoje são até 8 chips soltos em duas linhas ocupando a home. Vira **um botão
"Filtrar"** com a contagem de filtros ativos, que abre um painel com os grupos
nomeados: **Faixa**, **Situação** (Prontos / Afastados), **Categoria**
(Infantil / Adulto), mais "Limpar filtros".

Comportamento atual a **preservar**: filtros combinam em AND; só aparecem as
faixas que existem na turma; `setFiltros` continua usando atualização funcional
(dois toques no mesmo frame se anulam sem isso — está comentado no código);
`aplicarFiltros` chama a mesma `alertaGraduacao()` da home.

Quando há filtro ativo, o resumo ("12 de 47 alunos") fica visível **fora** do
painel — senão o professor não sabe que a lista está filtrada.

**Aceite:** todo filtro que funcionava continua funcionando; contador certo;
home visivelmente mais curta.

---

### ETAPA 6 — Card de vídeo da aula com miniatura · `PENDENTE`

O `link_youtube` (migration 007) já existe e vira só um botão "▶ Assistir
aula". Vira um card com a capa do vídeo.

- Extrair o `videoId` das formas que o `validarLinkYoutube()` já aceita:
  `youtube.com/watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, e `&t=`/`?si=` no
  fim. Link válido pelo validador mas sem id extraível **não pode quebrar o
  card** — cai no botão de hoje.
- Miniatura em `https://i.ytimg.com/vi/<id>/hqdefault.jpg`, com
  **`referrerPolicy="no-referrer"`** — mesma razão da foto do aluno: sem isso o
  Google recebe o endereço do app a cada carregamento. Ponto novo que renderiza
  imagem de terceiro nasce com o atributo (ver `CLAUDE.md`).
- `onError` → volta ao botão de texto. É o que acontece com vídeo **privado**,
  removido ou link errado, e o professor precisa ver que algo está errado sem
  ficar com um retângulo quebrado no card.
- O campo do link no `ModalAula` ganha uma linha de ajuda: **"Use 'Não listado'.
  Vídeo 'Privado' não gera miniatura nem abre para o aluno."**
- Miniatura e foto da aula não podem empilhar duas imagens grandes no mesmo
  card — decidir o arranjo antes de codar e mostrar ao usuário.

**Aceite:** link válido mostra capa; toque abre o vídeo em aba nova
(`rel="noopener noreferrer"`, `stopPropagation` — o card em si abre a chamada);
link quebrado cai no botão sem erro visível no console; aula sem link continua
sem ocupar espaço.

---

## Riscos conhecidos deste lote

- **`grausMaximos('branca')` devolve 4 mesmo para criança — achado em
  2026-08-30, resolver na Etapa 4, não antes.** `branca` está em
  `FAIXAS_ADULTAS`, e `grausMaximos()`, diferente de `proximaFaixa()`, nunca
  recebeu o parâmetro `infantil` que resolveria isso — é a mesma armadilha que
  o `CLAUDE.md` já documenta para `proximaFaixa()` (branca está nas duas
  listas). Efeito hoje: uma criança faixa branca precisa de 4 graus (192
  presenças, pelo critério da Etapa 1) antes de qualquer alerta de faixa, em
  vez de 3, e o card já desenha 4 losangos para ela. Fica invisível até a
  Etapa 4 desenhar a faixa com esparadrapos — aí o teto errado vira visual e
  óbvio. Resolver junto com o desenho, não isoladamente antes.
- **`components/AppShell.tsx` tem 2.516 linhas / 120 KB.** Cinco das seis
  etapas mexem nele. Ler o arquivo inteiro a cada sessão é caro e edita-lo é
  mais arriscado a cada mês. **Não é para refatorar durante este lote** — seria
  quebrar a regra de uma coisa por vez, no meio de seis mudanças de
  comportamento. É para decidir depois, de propósito, com o layout novo.
- **Etapa 1 é a única com migration.** Ela trava esperando o usuário rodar o SQL
  à mão. Planejar a sessão contando com essa parada.
- **A view `alunos_frequencia` é dropada e recriada na Etapa 1.** Se qualquer
  coisa depender dela e não for recriada junto, quebra em runtime e não em
  build. Conferir o `grant` depois do `create`.

## Fila depois deste lote

Sem mudança de prioridade: fila offline da chamada · foto do aluno por upload
real (Storage) · ping/keep-alive do Supabase · layout novo (desenho do usuário)
· login de aluno. E o **Passo 6 (PDF)**, parado desde 2026-08-04 sem escopo
registrado em lugar nenhum — quem retomar levanta o escopo com o usuário antes
de planejar.

**Experimento à parte, não é etapa:** trama/costura no `AlunoCard` do grid
(hoje `size="sm"`, sem elas — aprovado e rodando). Pedido do usuário depois
de fechar a Etapa 4: testar numa página descartável (`/faixas-card`), em
branch ou stash, sem tocar no `AlunoCard`/`FaixaDesenhada` já commitados, se
uma trama mais grossa lê melhor no tamanho real do card. Se nada ganhar,
mantém como está.
