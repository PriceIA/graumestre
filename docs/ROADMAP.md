# GrauMestre v2 — Roadmap completo

Atualização completa do GrauMestre (`A:\Graumestre\graumestre`, repo
`PriceIA/graumestre`), **sem perder os dados dos alunos**. Escrito em
2026-10-19, revisto no mesmo dia com as correções do Pedro.

**O foco é sempre a função com os alunos.** O visual serve a isso.

**O que vem do FOJJ: só o VISUAL** (o protótipo `gm-kimono.html` e a casca
de navegação). **As funções são as do GrauMestre:** alunos, aulas, chamada e
graduação continuam como são hoje, só reorganizadas e com a pele nova. Nada
das telas de Alunos e Aulas do FOJJ entra aqui.

**A grande novidade do GrauMestre:** **cada aluno cria o próprio cadastro
por um link e confirma a própria presença**. O professor confia no aluno e
dá o ok depois.

---

## 1. Regras de ouro (valem em todas as fases)

1. **Os dados dos alunos são intocáveis.** Backup antes de qualquer
   migration. Migration só **acrescenta** (nunca apaga nem renomeia coluna).
2. **Trabalho no branch `desenvolvimento`.** A `main` é o site no ar e só
   recebe merge quando o Pedro disser. *(Exceção: a G1, o ping, vai direto
   para a `main`, porque o banco está dormindo agora.)*
3. **O banco é o mesmo do site no ar.** Migration é avisada no plano, antes,
   e aplicada **pelo Pedro** no SQL Editor.
4. **O login do professor continua `apelido@graumestre.app`** até a Parte 2.
   Se mudar sem plano, ninguém entra.
5. **O cadastro público do Supabase fica SEMPRE desligado.** Conta de aluno
   só nasce por um convite válido, criado por uma função do servidor (ver
   G10). E nenhum convite funciona antes de a RLS por papel estar pronta e
   testada (G9). Hoje qualquer conta logada lê e edita tudo: uma conta de
   aluno criada antes disso veria a turma inteira.
6. Uma fase só começa com a anterior testada no `localhost` pelo Pedro,
   commitada e com push.
7. Antes de todo commit: `npx tsc --noEmit` limpo, `CLAUDE.md`,
   `CHANGELOG.md` e `docs/PLANO-ATUAL.md` atualizados.
8. **Comportamento só muda com o Pedro pedindo.** Reorganizar código e
   trocar visual não podem mudar o que o app faz.
9. O Claude Code diz qual skill está usando e termina toda resposta com
   **"Próximo passo — o que digitar"**.
10. **Duas versões de verdade, celular e computador** *(pedido do Pedro,
    2026-10-21)*. Hoje o GrauMestre no computador abre a versão de celular
    esticada. Na v2, **toda tela** tem as duas versões, como o FOJJ:
    - **celular (até 959 px), o tatame:** uma coluna, barra de navegação
      embaixo, uma mão, um toque;
    - **computador (960 px ou mais), o escritório:** menu lateral, a tela
      larga usada de verdade (listas em colunas, tabela com painel ao lado,
      mais informação de uma vez);
    - a troca é feita **só por CSS** (no `globals.css`), sem detectar o
      aparelho por código;
    - **nenhuma tela é dada como pronta sem ser testada em 390 px e em
      1280 px, nos dois temas.**
11. **Modelo certo em cada fase** *(pedido do Pedro, 2026-10-21)*. Cada fase
    abaixo começa com uma linha **🔁 Modelo**. O Claude Code avisa o Pedro
    **no começo de cada fase e na hora de trocar** (por exemplo: "plano
    aprovado, agora troque para o Sonnet 5.5 com `/model`"). Critério: se um
    erro mexe nos dados dos alunos ou na segurança, Opus; se é rotina ou
    fácil de desfazer, Sonnet.

---

## 2. O projeto em duas partes (duas publicações)

- **Parte 1 — O app novo do professor (G0 a G8).** Visual novo, os dois
  temas, código reorganizado, ping. Mesmas funções de hoje. **Publica no
  fim**: o professor já usa o app novo, sem risco para os dados.
- **Parte 2 — O aluno entra (G9 a G14).** Contas e papéis, cadastro pelo
  link, portal do aluno e presença confirmada pelo próprio aluno.
  **Publica no fim.**

O motivo de dividir: a Parte 2 mexe em login e segurança (RLS). Separada, o
professor não fica semanas esperando o visual novo, e um problema no login
do aluno não segura o resto.

---

## 3. Decisões já tomadas

- Visual: protótipo `docs/direcoes/gm-kimono.html`.
  - **Trama de kimono** no fundo.
  - **Kimono branco** (claro, costura preta) e **kimono preto** (escuro,
    costura branca). Abre seguindo o tema do celular.
  - **Acabamento de faixa preta:** ponteira vermelha com friso branco na ponta
    das etiquetas principais, no fim da costura do título e no pé do menu.
  - Etiqueta preta com costura, números grandes em estêncil no placar.
- **Funções:** as do GrauMestre. Do FOJJ, só o visual.
- Ferramenta de **um professor**, com **login próprio para cada aluno**.
- **Versão de celular e versão de computador de verdade** (regra 10). O
  portal do aluno (Parte 2) é pensado primeiro para o celular, mas também
  funciona no computador.
- **O aluno se cadastra sozinho** e **confirma a própria presença**. O
  professor confia e revisa depois. Decidido pelo Pedro em 2026-10-19:
  - **Login do aluno: apelido + senha**, de graça, sem e-mail. É o mesmo
    esquema do professor (`apelido@graumestre.app`, domínio só de
    identificador).
  - **O professor confirma o aluno novo** antes de ele usar o app.
  - **Alunos que já existem:** a conta nova se liga ao cadastro antigo
    (histórico, graduações, presenças). Preferência: **um link para cada
    um**, com o qual o aluno cria o próprio login sobre o cadastro que já
    existe. Alternativa: o professor cria as contas de todos.
  - **Presença conta na hora** e **avisa o professor**. Ele vê a lista de
    quem confirmou sozinho e vai conferindo até dar o ok.
  - **Crianças:** mesmo fluxo dos adultos. A turma é privada, e o app não é
    vendido.
- **Logo:** o Pedro desenha. Até lá, "GM" provisório.
- Skills: Superpowers, Impeccable, UI UX Pro Max, Taste, Vercel
  (`react-best-practices` + `web-design-guidelines`) e Chrome DevTools MCP
  (que também faz a comparação com o protótipo; o Playwright não é usado).
  Fora: marketing, 21st.dev Magic, AI design skills.

---

## 4. Decisões que ainda faltam (cada uma na fase indicada)

**Parte 1**
1. **Vermelho de alerta × vermelho da ponteira** *(G2)*. Hoje é o mesmo
   vermelho. Ou o alerta ganha outra cor, ou fica o mesmo vermelho sempre com
   texto e ícone.
2. **Onde fica o botão de tema** *(G3)*: no cabeçalho de toda tela (como no
   protótipo) ou só no menu.
3. **Correção de datas** *(G4)*: o FOJJ achou um defeito que também existe no
   GrauMestre (depois das 21h o app acha que já é amanhã; quem nasceu em 1º
   de janeiro ganha 1 ano). Corrigir no GrauMestre, escrito sobre o código do
   próprio GrauMestre?
4. **Placar da Chamada sem horários** *(G7)*. Recomendado: números do dia
   (presentes hoje / turma, prontos, afastados).

**Parte 2 (o grosso já está decidido; falta o detalhe, no brainstorm da G9)**
5. **Esqueci a senha:** sem e-mail não há recuperação automática.
   Sugestão: botão "Nova senha provisória" no cadastro do aluno, do lado do
   professor. O aluno troca a senha no primeiro acesso.
6. **Alunos que já existem:**
   - (a) **link pessoal para cada um** *(preferência do Pedro)*;
   - (b) o professor cria todas as contas com senha provisória.
   - Os dois podem conviver: (a) como padrão, (b) para quem não abrir o link.
7. ✅ **Prazo para o aluno confirmar a presença** *(decidido 2026-10-19)*:
   **24 horas depois que o professor lança a aula.**
   - Cuidado com aula lançada com antecedência: se o professor lança a aula
     de sexta já na segunda, as 24 h venceriam antes do treino.
   - ✅ **Decidido:** as 24 h contam a partir do **mais tarde entre** o
     lançamento e o começo do dia da aula. Aula lançada na segunda para a
     sexta só começa a contar na sexta.
   - Precisa da hora do lançamento: conferir se `aulas` tem `created_at`.
8. ⏳ **O que o aluno pode editar no próprio cadastro:** o Pedro vai abrir
   todos os campos do cadastro e decidir campo a campo, no começo da G9.
   Faixa, graus e graduações nunca (são do professor).
9. ✅ **Regras do apelido** *(decidido 2026-10-19)*:
   - **só letras**: sem número, símbolo nem espaço;
   - **até 32 caracteres**;
   - maiúscula e minúscula valem igual ("Joao" = "joao");
   - único na turma.

   - **acento pode** (o aluno digita "João");
   - **o apelido é só para entrar.** O nome que aparece no app continua o
     do cadastro ("João Silva"). Ter 10 Joãos na turma não confunde nada na
     tela.

   **Como fica na prática (G10):**
   - **Apelido sugerido pronto.** No convite pessoal, o app já preenche um
     apelido a partir do nome do cadastro: primeiro nome + sobrenome
     ("joaosilva"). Se já existir, tenta outras combinações ("joaopedro",
     "joaosilvaferreira"). O aluno aceita com um toque ou troca pelo apelido
     do tatame.
   - **Conferido enquanto digita:** "✓ disponível" ou "já existe, que tal:
     joaosilva, joaopedro?".
   - **Acento e maiúscula não contam para repetir:** "João" e "joao" são o
     mesmo apelido. Assim ninguém cria um "Joao" quando já existe "João".
     Por trás, a conta é gravada sem acento (`joao@graumestre.app`).
   - **O professor vê o apelido** no cadastro do aluno (nunca a senha), para
     lembrar quem esquecer.

### Sugestões para o login "inteligente" (para o brainstorm da G9)

1. **Convite em vez de cadastro aberto.** O cadastro público do Supabase
   continua desligado. Quem cria a conta é uma **função no servidor**
   (Supabase Edge Function, grátis), que só aceita um convite válido.
   - Mesmo que alguém descubra o endereço do app, não consegue criar conta.
   - A chave secreta fica só no servidor, nunca no celular.
2. **Dois tipos de convite:**
   - **Pessoal** (aluno que já existe): o professor toca em "Convidar" no
     cadastro do aluno e manda pelo WhatsApp. O link já sabe quem é o aluno:
     ele só escolhe apelido e senha e entra **já ligado ao histórico dele,
     sem precisar de aprovação** (foi o professor quem mandou). Uso único;
     expira em 7 dias; o professor pode gerar outro.
   - **Da turma** (aluno novo): um link ou QR fixo, para pôr no grupo ou na
     parede da academia. O aluno preenche nome, nascimento, apelido e senha,
     e fica **"aguardando o professor"** até o ok. O professor pode trocar ou
     desligar esse link quando quiser.
3. **Aprovar é um toque:** na tela "Pedidos", o professor vê nome e idade e
   escolhe:
   - "Aprovar como aluno novo";
   - "É o fulano" (liga ao cadastro que já existe, se o aluno novo na verdade
     já treinava);
   - "Recusar".
4. **Proteção barata:** limite de tentativas de login e de cadastro, e senha
   com mínimo de 6 caracteres.
5. **A presença conferida:** a presença do aluno grava na hora
   (`confirmado_por = 'aluno'`) e ganha uma marca "conferida pelo professor"
   (coluna nova, migration que só acrescenta). Enquanto não for conferida,
   ela aparece numa lista "Para conferir" com um contador no Início e na
   Chamada. O professor confere todas com um toque, ou tira a que estiver
   errada.

**Depois do lançamento**
11. Fila: foto do aluno por upload, chamada offline, PDF (escopo nunca
    registrado).

---

## 5. As ferramentas: o que cada uma faz aqui

- **Superpowers** — o processo de cada fase: brainstorm → plano escrito em
  `docs/superpowers/` → execução em tarefas → revisão.
- **Impeccable** (`/impeccable ...`):
  - `init` gera o `PRODUCT.md`;
  - `document` gera o `DESIGN.md`;
  - `shape` planeja uma tela antes de codar;
  - `critique` e `audit` revisam;
  - `polish`, `harden` e `onboard` fazem o acabamento (`onboard` é o primeiro
    acesso do aluno).
- **UI UX Pro Max** — cor do alerta, contraste do tema escuro e checklist de
  UX. Não cria paleta nova: o protótipo manda.
- **Taste** — só nas telas de impacto: **cadastro do aluno, portal do aluno,
  login**, splash e Início. Não em listas, tabelas e chamada.
- **Vercel `react-best-practices`** — revisa a quebra do `AppShell.tsx`
  (147 KB hoje), para não ficar lento no celular.
- **Vercel `web-design-guidelines`** — auditoria de acessibilidade e UX no
  fim de cada tela e na revisão final.
- **Chrome DevTools MCP**:
  - vê o console e as chamadas ao Supabase (pega `PGRST204` na hora);
  - mede velocidade no celular simulado e testa o tema escuro;
  - **na Parte 2, confere que um aluno logado não consegue ler dado de
    outro**;
  - **compara o `localhost` com o `gm-kimono.html`** em 390 px e 1280 px, nos
    dois temas, antes de chamar o Pedro. É o papel que o Playwright tinha no
    FOJJ: no GrauMestre ele não está instalado e não faz falta.
- **Vercel MCP** (opcional) — ver deploys e o cron do ping (G1) sem abrir o
  site da Vercel. Precisa fazer login uma vez em `/mcp`.

---

# PARTE 1 — O app novo do professor

### G0 — Preparar o terreno *(nada visível muda)*

> 🔁 **Modelo:** **Sonnet 5.5**, effort Medium. *(trocar com `/model`)*

1. Conferir as skills instaladas (`/plugin` e `/mcp`).
2. **Backup completo:**
   - banco: `pg_dump` (o Claude Code ajuda a instalar) **e** CSV de cada
     tabela pelo painel, como segunda cópia;
   - fotos do bucket `aulas-fotos`;
   - tudo guardado fora do repositório (nunca no git).
3. Conferir no banco de produção que as migrations `001`–`014` estão
   aplicadas (só leitura).
4. Criar o branch `desenvolvimento` e fazer push.
5. Documentos de trabalho:
   - `docs/PLANO-ATUAL.md` apontando para a G1;
   - `docs/COMO-USAR-SKILLS.md`;
   - seção "Branches e site no ar" no `CLAUDE.md`.
6. Liberar a leitura das skills: `/permissions` → `Read(~/.claude/skills/**)`.

**Skills:** Superpowers. **Migration:** não.
**Teste:** o app atual igual no `localhost`; o backup abre.

**O que digitar:**
```
Leia o CLAUDE.md e o docs/ROADMAP.md inteiros. Vamos fazer a fase G0. Use o Superpowers e me mostre o plano antes de executar. Comece pelo backup do banco e das fotos.
```

### G1 — Ping do Supabase *(vai direto para a `main`)*

> 🔁 **Modelo:** **Sonnet 5.5**, effort Medium. *(trocar com `/model`)*

- `app/api/ping/route.ts`: rota mínima com uma leitura leve no banco usando a
  chave pública (**nunca** a `service_role`).
- Protegida por `CRON_SECRET`: recusa qualquer pedido sem o segredo.
- `vercel.json` com cron `0 9 */5 * *` (a cada 5 dias, 06:00 de Brasília).
- Única exceção à regra "sem `app/api`": documentar no `CLAUDE.md`.
- O Pedro cria `CRON_SECRET` na Vercel (o Claude Code explica onde).

**Skills:** Superpowers. **Migration:** não.
**Teste:**
- rota sem segredo recusa, com segredo responde ok;
- depois do deploy, cron listado na Vercel.

**O que digitar:**
```
Vamos fazer a fase G1 do docs/ROADMAP.md: o ping do Supabase com Vercel Cron. Me mostre o plano e me diga exatamente o que eu preciso configurar na Vercel antes de codar.
```

### G2 — PRODUCT.md e DESIGN.md *(só documento)*

> 🔁 **Modelo:** **Sonnet 5.5**, effort Medium. *(trocar com `/model`)*

1. `/impeccable init` → `PRODUCT.md`:
   - um professor;
   - **alunos com login próprio, que confirmam a própria presença**;
   - uso no tatame, crianças na turma;
   - o que nunca pode se perder.
2. UI UX Pro Max:
   - cor do alerta (decisão 1);
   - cores de **erro** e **sucesso** (o FOJJ não tem);
   - contraste AA dos dois temas.
3. `/impeccable document` → `DESIGN.md` com os tokens e as regras do
   protótipo: trama, costura (preta no branco, branca no preto), ponteira de
   faixa preta, estêncil só em título e placar, 44 px, estado sempre escrito.

**Skills:** Impeccable, UI UX Pro Max. **Migration:** não. **Código:** não.
**Teste:** o Pedro lê e aprova.

**O que digitar:**
```
Vamos fazer a fase G2 do docs/ROADMAP.md. Comece com /impeccable init para o PRODUCT.md do GrauMestre. O protótipo docs/direcoes/gm-kimono.html é a referência visual. Nenhum código muda nesta fase.
```

### G3 — Fundação visual *(tokens, temas e casca)*

> 🔁 **Modelo:** **Opus 5.5** para o plano; depois **troque para Sonnet 5.5** na execução. *(trocar com `/model`)*

1. Tokens do `DESIGN.md` no `app/globals.css` (claro e escuro), espelhados
   no Tailwind.
2. Fontes Archivo e Big Shoulders Stencil pelo `next/font`.
3. Troca de tema:
   - segue o celular por padrão;
   - botão guarda a escolha;
   - sem piscar o tema errado ao abrir.
4. Trama de kimono no fundo.
5. Navegação nova, desenhada a partir do protótipo:
   - **barra de abas embaixo no celular, como Instagram e WhatsApp**
     (pedido do Pedro): Chamada, Alunos, Aulas, Graduar e Mais, cada uma com
     ícone e nome. Fica ao alcance do polegar, com uma mão só. A aba ativa
     vira etiqueta; Graduar mostra o número de prontos. **Substitui** as abas
     de texto no topo (ALUNOS / AULAS) e o menu ☰ de hoje;
   - menu lateral com costura e ponteira no computador.

   O componente de navegação do FOJJ serve **só de referência de visual**.
6. Script que reprova cor escrita à mão fora dos tokens.
7. `manifest.json` e `themeColor` para os dois temas.

**Skills:** Superpowers, Chrome DevTools (comparar com o protótipo). `react-best-practices` no fim.
**Migration:** não.
**Teste:** todas as telas de hoje funcionando igual, com a pele nova, nos dois
temas, em 390 px e 1280 px.

**O que digitar:**
```
Vamos fazer a fase G3 do docs/ROADMAP.md. Use o Superpowers. O visual vem do docs/direcoes/gm-kimono.html. Nenhuma função muda. Não traga código de telas do FOJJ.
```

### G4 — Correção de datas *(só se o Pedro aprovar a decisão 3)*

> 🔁 **Modelo:** **Opus 5.5** do começo ao fim (mexe na conta de frequência). *(trocar com `/model`)*

- Corrigir no código do GrauMestre:
  - "hoje" no dia do Brasil, não no de Londres;
  - idade de quem nasceu em 1º de janeiro;
  - aula lançada para o futuro não conta como dada.
- O FOJJ serve **só como lista do defeito**. O código é escrito sobre o
  GrauMestre.
- Teste que falha antes da correção e passa depois.
- Provável migration na view `alunos_frequencia` (mesmas colunas, compatível
  com o site no ar).

**Skills:** Superpowers. **Migration: provável** (avisar antes).
**Teste:** testes automáticos passando; frequência e afastados iguais na
tela, exceto o que a correção muda de propósito.

**O que digitar:**
```
Vamos fazer a fase G4 do docs/ROADMAP.md. Me mostre no código do GrauMestre onde estão os defeitos de data antes de corrigir. Se precisar de migration, me avise antes.
```

### G5 — Tela de Alunos *(a do GrauMestre, reorganizada)*

> 🔁 **Modelo:** **Opus 5.5** para o plano; depois **troque para Sonnet 5.5** na execução. *(trocar com `/model`)*

- Tirar do `AppShell.tsx` tudo da tela de Alunos e separar em componentes
  próprios do GrauMestre (`components/alunos/`).
- **Mantém tudo o que o GrauMestre tem hoje:**
  - lista, cards, busca;
  - painel de filtros (Faixa / Situação / Categoria) com chips removíveis;
  - modal do aluno com as abas;
  - faixa desenhada, histórico, lixeira.
- Ganha a pele nova: etiqueta, trama, temas.
- **Duas versões:**
  - **celular:** lista agrupada por faixa; o aluno abre numa folha que sobe
    e cobre a tela;
  - **computador:** tabela (nome, faixa, 30 dias, situação) com o painel do
    aluno **fixo ao lado**, sem abrir janela por cima.
- Melhoria de função só se o Pedro pedir na hora (`/impeccable shape`
  sugere, o Pedro decide).

**Skills:**
1. `/impeccable shape`;
2. Superpowers;
3. Chrome DevTools (comparar com o protótipo);
4. `react-best-practices` (a quebra do AppShell);
5. `web-design-guidelines` no fim.

**Migration:** não.
**Teste:**
- celular (390 px) e computador (1280 px), nos dois temas;
- cadastrar, editar, graduar e apagar um aluno de teste, conferindo no banco;
- cada função de antes funcionando igual;
- limpar o teste no fim.

**O que digitar:**
```
Vamos fazer a fase G5 do docs/ROADMAP.md, tela de Alunos. Use só o código do GrauMestre: tire a tela do AppShell, mantenha todas as funções e aplique o visual do gm-kimono.html. Comece com /impeccable shape tela de alunos.
```

### G6 — Tela de Aulas *(a do GrauMestre, reorganizada)*

> 🔁 **Modelo:** **Opus 5.5** para o plano; depois **troque para Sonnet 5.5** na execução. *(trocar com `/model`)*

- Tirar do `AppShell.tsx` a aba de Aulas para `components/aulas/`.
- **Mantém o que o GrauMestre tem:**
  - lançar aula;
  - foto da aula (bucket privado, compressão, HEIC);
  - miniatura do YouTube com o ▶;
  - aviso de vídeo "Não listado".
- Ganha a pele nova; a "Aula do dia" vira etiqueta com a ponteira.
- **Duas versões:**
  - **celular:** uma coluna;
  - **computador:** a aula do dia em destaque e a lista de aulas larga, com
    foto e vídeo à vista.

**Skills:** as mesmas da G5. **Migration:** não.
**Teste:**
- celular (390 px) e computador (1280 px), nos dois temas;
- lançar uma aula de teste com foto e vídeo, conferir a foto no bucket;
- apagar no fim.

**O que digitar:**
```
Vamos fazer a fase G6 do docs/ROADMAP.md, tela de Aulas. Só código do GrauMestre, mesmas funções, visual do gm-kimono.html. Comece com /impeccable shape tela de aulas.
```

### G7 — Chamada *(a do GrauMestre, com o visual novo)*

> 🔁 **Modelo:** **Opus 5.5** para o plano; depois **troque para Sonnet 5.5** na execução. *(trocar com `/model`)*

- A chamada rápida do GrauMestre, tirada do AppShell e com a pele nova.
- O que já faz continua igual: um toque, grava na hora, sem Salvar.
- Do protótipo, entram:
  - placar (decisão 4);
  - lista A–Z com índice;
  - caixa MARCAR / PRESENTE de 44 px;
  - "Desfazer".
- **Duas versões (como no protótipo):**
  - **celular:** placar em cima, busca presa ao rolar, lista com o índice
    A–Z na lateral, 6 alunos inteiros por tela;
  - **computador:** placar na largura toda, lista em **2 colunas**, a aula do
    dia numa coluna fixa à direita, letras A–Z numa barra acima da lista.
- **Já preparar a tela para a Parte 2:** cada presença mostra quem confirmou
  (professor ou aluno). O campo `presencas.confirmado_por` já existe desde a
  migration 006.

**Skills:**
1. `/impeccable shape`;
2. Superpowers;
3. Chrome DevTools (comparar com o protótipo nos dois temas e conferir cada
   gravação no Supabase);
4. `web-design-guidelines`.

**Migration:** não.
**Teste:**
- celular (390 px) e computador (1280 px), nos dois temas;
- marcar e desmarcar 3 alunos e conferir no banco;
- "Desfazer";
- sair da tela no meio e voltar.

**O que digitar:**
```
Vamos fazer a fase G7 do docs/ROADMAP.md, a Chamada. Primeiro me pergunte a decisão do placar. Mesmas funções da chamada do GrauMestre, visual do gm-kimono.html.
```

### G8 — Graduar, Início, menu "Mais" e publicar a Parte 1

> 🔁 **Modelo:** **Opus 5.5** para o plano e a revisão final; **Sonnet 5.5** para executar cada tela. *(trocar com `/model`)*

1. **Graduar:** painel de prontos (`alertaGraduacao()`, sempre a mesma
   função), graduação e histórico.
2. **Início** (`DashboardProfessor`): com números de placar.
3. **Mais:** Perfil do Professor, Lixeira, Instalar no celular, Tema e Sair.
   No computador, esses itens ficam no menu lateral.
   - Graduar e Início também com as duas versões: no computador, a lista de
     prontos com o aluno aberto ao lado.
4. O `AppShell.tsx` vira só a casca.
5. Login do professor no visual novo (**ainda apelido e senha**).
6. Revisão:
   - `web-design-guidelines`;
   - `/impeccable audit` e `polish`;
   - Chrome DevTools (Lighthouse ≥ 90 no celular);
   - revisão por agente de fora.
7. **Publicar a Parte 1:** merge na `main`. Conferir com os dados reais que a
   quantidade de alunos, a frequência e o histórico estão iguais a antes.

**Skills:** `/impeccable shape`, Superpowers, Taste (Início e login), todas
as de revisão.
**Migration:** não.

**O que digitar:**
```
Vamos fazer a fase G8 do docs/ROADMAP.md: Graduar, Início e menu Mais. Uma tela por vez, com /impeccable shape antes de cada uma.
```

---

# PARTE 2 — O aluno entra

### G9 — Contas e papéis *(o alicerce de segurança)*

> 🔁 **Modelo:** **Opus 5.5**, effort **High**, do começo ao fim (segurança e migration). *(trocar com `/model`)*

**Começa por um brainstorm curto** das decisões 5 a 9 da seção 4 e das
"Sugestões para o login" (convite, aprovação, presença conferida). O grosso
já está decidido.

Depois:
1. Tabela `perfis`: usuário → papel (`professor` | `aluno`), qual cadastro de
   aluno é dele e situação (`aguardando` | `ativo`).
2. **RLS por papel em todas as tabelas, na view e no bucket.**
   **Achado da G0 (2026-10-21, conferido em produção):** `alunos`, `aulas`,
   `graduacoes` e `presencas` estão com a **RLS DESLIGADA** (só
   `professor_perfil` está ligada). As policies da 009 existem, mas inertes;
   hoje só o `GRANT` (anon revogado) protege. A G9 tem que **ligar a RLS** nas
   quatro, com as policies por papel já certas no mesmo passo, e **testar com
   conta de aluno** que o banco recusa (um `enable` sozinho com as policies
   `using (true)` de hoje não protegeria nada de aluno). Descobrir primeiro
   *por que* está desligada (002 a ligava): se foi manual, a migration precisa
   ser idempotente.
   - **professor:** tudo, como hoje;
   - **aluno ativo:** lê **só os próprios dados** (cadastro, faixa,
     graduações, presenças) e as aulas (técnica e vídeo);
   - **aluno grava só a própria presença**, só até 24 h depois do lançamento
     da aula (decisão 7). **Quem confere o prazo é o banco**, não só a tela;
   - **aluno aguardando:** não lê nada da turma;
   - **foto da aula:** decidir se o aluno vê.
3. Coluna "conferida pelo professor" em `presencas` (para a lista "Para
   conferir").
4. Teste de segurança obrigatório: logado como aluno de teste, tentar ler
   outro aluno, editar, graduar, apagar, marcar presença de outro. **Tudo
   recusado pelo banco**, não só escondido na tela.
5. Supabase → Advisors → Security sem erros.

**Skills:** Superpowers (brainstorm), Chrome DevTools (teste de segurança).
**Migration: SIM**, a maior do projeto. Só acrescenta tabela, coluna e
regras. Backup antes; aplicada pelo Pedro.

**O que digitar:**
```
Vamos fazer a fase G9 do docs/ROADMAP.md. Comece pelo brainstorm do que falta na seção 4 (decisões 5, 6 e 8), com o Superpowers. Uma pergunta por vez, com a sua recomendação. Nenhum código antes de eu decidir.
```

### G10 — Convites e cadastro do aluno

> 🔁 **Modelo:** **Opus 5.5**, effort **High**, do começo ao fim (contas e convites). *(trocar com `/model`)*

1. **Função de servidor** (Supabase Edge Function) que cria a conta do aluno
   (`apelido@graumestre.app` + senha) **só com convite válido**. O cadastro
   público do Supabase continua desligado.
2. **Convite pessoal** (aluno que já existe):
   - botão "Convidar" no cadastro do aluno, que gera o link e abre o
     WhatsApp;
   - o aluno escolhe apelido e senha e já entra ligado ao histórico dele;
   - uso único, expira em 7 dias, dá para gerar outro.
3. **Convite da turma** (aluno novo):
   - link e QR fixos no menu "Mais", que o professor pode trocar ou desligar;
   - o aluno preenche nome, nascimento, apelido e senha;
   - fica "aguardando o professor".
4. **Tela "Pedidos"** para o professor, com "Aprovar como novo", "É o fulano"
   (liga a um cadastro existente) e "Recusar".
5. **"Nova senha provisória"** no cadastro do aluno, para quando ele esquecer.
   Ele troca no primeiro acesso.
6. Crianças: mesmo fluxo.
7. Limite de tentativas de cadastro e de login; senha com mínimo de 6
   caracteres.
8. Opcional (decisão 6b): o professor cria as contas de quem não abriu o
   convite, com senha provisória.

**Skills:**
1. `/impeccable shape` (fluxo de convite e cadastro);
2. **Taste** (a primeira tela que o aluno vê);
3. `/impeccable onboard`;
4. Superpowers.

**Migration:** sim (tabela de convites). **Edge Function:** sim.
**Teste:**
- convite pessoal: o aluno de teste entra já com o histórico;
- convite da turma: fica aguardando, o professor aprova;
- link expirado ou usado é recusado;
- tentar criar conta sem convite é recusado;
- apagar as contas de teste no fim.

**O que digitar:**
```
Vamos fazer a fase G10 do docs/ROADMAP.md: convites e cadastro do aluno. A RLS da G9 tem que estar aplicada e testada antes. Comece com /impeccable shape fluxo de convite e cadastro do aluno.
```

### G11 — Portal do aluno e presença confirmada pelo aluno

> 🔁 **Modelo:** **Opus 5.5** para o plano; depois **troque para Sonnet 5.5** na execução. *(trocar com `/model`)*

1. Portal (celular primeiro):
   - minha faixa desenhada e graus;
   - minha frequência;
   - meu histórico de graduação;
   - aulas com técnica e vídeo.
2. **Botão "Estou na aula de hoje":** um toque, grava na hora
   (`confirmado_por = 'aluno'`), com "Desfazer". Conta para a frequência na
   hora.
3. Lado do professor:
   - contador **"Para conferir: N"** no Início e na Chamada;
   - na Chamada, a presença do aluno aparece como "confirmou sozinho";
   - **"Conferir todas"** com um toque, ou tirar a que estiver errada;
   - conferida, sai da lista.
4. Faixa, graus e frequência do aluno vêm das mesmas funções do professor
   (nunca uma conta à parte).

**Skills:** `/impeccable shape`, Taste (portal), Superpowers,
`web-design-guidelines`.
**Migration:** não (a coluna nasceu na G9).
**Teste:**
- aluno de teste confirma; o professor vê no contador e confere;
- tirar uma presença errada; o aluno vê a mudança;
- aluno tenta confirmar depois das 24 h: recusado pelo banco.

**O que digitar:**
```
Vamos fazer a fase G11 do docs/ROADMAP.md: portal do aluno e presença confirmada pelo aluno. Comece com /impeccable shape portal do aluno.
```

### G12 — Login, abertura, ícones e logo

> 🔁 **Modelo:** **Sonnet 5.5**, effort Medium. *(trocar com `/model`)*

- **Uma tela de login só:** apelido + senha para professor e aluno; cada um
  cai na sua parte do app. O professor **continua com a conta dele, sem
  migrar nada** (o esquema é o mesmo).
- Aluno "aguardando" que entra vê só a tela "Seu cadastro está com o
  professor".
- Troca de senha no primeiro acesso (senha provisória) e no menu.
- Splash e vídeo de abertura: decidir se ficam.
- Logo do Pedro → `scripts/gerar-icones.mjs` → ícones do PWA. **Substituir**
  os de hoje, que vêm do logo do Flávio.

**Skills:** Taste, `/impeccable critique`. **Migration:** não.
**Teste:** professor, aluno ativo e aluno aguardando entram e saem;
instalar no celular e ver o ícone novo.

**O que digitar:**
```
Vamos fazer a fase G12 do docs/ROADMAP.md: login, abertura e ícones. O logo novo está em public/images/ (vou te dizer o nome do arquivo).
```

### G13 — Revisão final da Parte 2

> 🔁 **Modelo:** **Opus 5.5**, effort **High** (revisão de segurança). *(trocar com `/model`)*

1. **Segurança primeiro:**
   - auditoria de RLS tabela por tabela, com conta de aluno de teste;
   - Advisors do Supabase;
   - cabeçalhos de segurança no `next.config.js`;
   - nada de `service_role` no front.
2. `web-design-guidelines`, `/impeccable audit`, `harden` e `polish`.
3. Chrome DevTools: velocidade, console limpo, nenhuma chamada repetida.
4. Contraste AA e 44 px nos dois temas.
5. **Revisão por agente de fora.**
6. **Antes de abrir para a turma:** apagar todas as contas e dados de teste.

**O que digitar:**
```
Vamos fazer a fase G13 do docs/ROADMAP.md, revisão final. Comece pela auditoria de segurança da RLS com uma conta de aluno de teste.
```

### G14 — Publicar a Parte 2 e chamar a turma

> 🔁 **Modelo:** **Sonnet 5.5**, effort Medium. *(trocar com `/model`)*

1. O Pedro digita a frase de merge (abaixo).
2. Conferir o deploy e os dados reais.
3. Mandar os convites pessoais para quem já é aluno e pôr o link e o QR da turma no grupo.
4. Acompanhar os primeiros pedidos de cadastro e as primeiras presenças.
5. `docs/PLANO-ATUAL.md` volta a ficar vazio; registrar a fila futura.

**O que digitar:**
```
A versão está completa. Faça o merge do desenvolvimento na main, o push e confira o deploy na Vercel.
```

---

## 6. Amanhã, na ordem

1. Abrir o Claude Code na pasta `A:\Graumestre\graumestre`.
2. Instalar as skills que faltarem (comandos na conversa de 2026-10-19).
3. Colar o "O que digitar" da **G0**.
4. Depois, a **G1** (ping): é curta e resolve o banco dormindo.
5. Então a **G2**: só ler e aprovar documento.

---

## 7. Achados que embasam o plano

- O banco do FOJJ (`000_base.sql`) foi conferido igual às 14 migrations do
  GrauMestre.
- O `CLAUDE.md` do GrauMestre já previa o login do aluno para confirmar a
  própria presença: `presencas.confirmado_por` (`'professor' | 'aluno'`)
  existe desde a migration 006, e "a confiança é a conduta do jiu-jítsu: sem
  geolocalização, foto nem dupla confirmação".
- **Risco de segurança de hoje:** a RLS libera tudo para qualquer conta
  logada. Isso só é seguro porque não existe cadastro público. Por isso a G9
  vem antes da G10, e o cadastro público do Supabase nunca é ligado: contas
  de aluno só nascem pela função de convite.
- O e-mail grátis do Supabase quase não envia. Apelido + senha mantém o
  projeto grátis: o domínio `@graumestre.app` é só identificador.
- O GrauMestre não tinha logo próprio (os ícones saem do logo do Flávio).
- `AppShell.tsx` do GrauMestre: 147 KB, a ser quebrado nas G5 a G8.
