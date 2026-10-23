# G5 — Tela de Alunos: design

Escrito em 2026-10-23, a partir do `/impeccable shape tela de alunos` e das
decisões do Pedro na mesma data. Prints do mockup (dados fictícios) em
`docs/superpowers/specs/2026-10-23-g5-alunos/`. O mockup simplifica a faixa
desenhada; no app ela continua sendo a `FaixaDesenhada.tsx`.

## 1. Para que serve e para quem

O professor, no tatame e com pressa, abre Alunos para achar um aluno, ver em
que pé ele está (faixa, graus, frequência, se está pronto ou afastado) e mexer
no cadastro dele. No escritório, no computador, ele faz o mesmo com a turma
inteira à vista e o aluno aberto ao lado. Modo **Operate**: escaneabilidade e
menos toques valem mais que expressão; a marca aparece no acabamento
(etiqueta, costura, estêncil, ponteira).

## 2. Objetivo, não-objetivos e anti-objetivos

**Objetivo:** tirar a tela de Alunos do `AppShell.tsx`, dar a ela a pele do
`DESIGN.md` em duas versões de verdade (celular e computador) e fechar quatro
pendências adiadas.

**Não-objetivos:** Aulas, Chamada, Início, Graduar, Mais, Lixeira e Perfil do
Professor só mudam no que for estritamente necessário (o zoom e o tamanho dos
campos, abaixo). Elas ganham layout na G6–G8.

**Anti-objetivos (se acontecer, a G5 falhou mesmo "funcionando"):**
- qualquer coisa das telas de Alunos ou Aulas do FOJJ (horário de turma,
  "30 dias", resumo com botões Graduar/Editar/Histórico);
- uma função de Alunos que existia e sumiu, ou que passou a fazer outra coisa
  sem o Pedro pedir;
- uma segunda conta para "pronto", "afastado" ou frequência: tudo continua
  vindo de `alertaGraduacao()`, `estaAfastado()` e da view;
- um campo derivado entrando no `update` (PGRST204): o payload continua sendo
  `payloadAluno()` com `COLUNAS_ALUNO`.

## 3. Decisões do Pedro (2026-10-23)

1. **Celular: lista agrupada por faixa**, no lugar dos crachás. Linha: foto
   pequena (40 px) ou inicial, nome, "Azul, 2 graus · 18 de 25 aulas", selo,
   e a faixa desenhada `sm` (lisa) à direita.
2. **Busca por nome** na tela de Alunos (função nova). Soma com os filtros (E).
3. **Tabela do computador:** Nome, Faixa (desenhada), Frequência ("18 de 25
   (72%)"), Situação (Pronto, Afastado ou Em dia). Sem "30 dias" nem horário.
4. **AFASTADO em âmbar só no contorno** (`etiqueta pequena alerta-contorno`);
   PRONTO continua âmbar cheio. Os dois sempre escritos.
5. **Ficha do aluno no computador**, fixa ao lado da tabela, com o mesmo
   conteúdo do modal de hoje:
   - (a) trocar de aluno com alteração não salva pergunta "Descartar as
     alterações em {nome}?"; sem alteração, troca direto;
   - (b) aberto pelo Início ou pelo Graduar, o aluno entra como painel pela
     direita por cima da tela atual, sem levar o professor para Alunos;
   - (c) sem aluno escolhido, o painel diz "Toque num aluno para ver a ficha
     dele aqui."
6. **Só a tela de Alunos usa a largura toda** no computador (sem largura
   máxima, 36 px de margem). Início e Aulas ficam nos 720 px até a G6/G8.
7. **Teste do zoom no iPhone pela rede de casa:** `npm run dev -- -H 0.0.0.0`
   e `http://<IP do PC>:3000` no Safari, mesmo Wi-Fi.
8. **Restos da G3:** `touch-action: manipulation` e
   `overscroll-behavior: contain` entram nas folhas de Alunos (ficha e
   filtros); o `theme-color` seguindo o tema escolhido fica para a G12.
9. **O "+" abre o aluno recém-criado** (comportamento novo, pedido pelo
   Pedro). A linha continua nascendo no banco como hoje ("Novo Aluno",
   branca, 0 graus, início hoje); a diferença é que a ficha dele já abre.

## 4. Pendências fechadas na G5

### 4.1 Histórico e selo PRONTO desatualizados (bug)

A gravação está certa; o que fica velho é a lista em memória. Três sintomas,
uma causa ([AppShell.tsx:2955](../../../components/AppShell.tsx)):

- graduação nova não aparece no histórico ao reabrir o aluno;
- graduação apagada no ✕ volta ao reabrir;
- o selo PRONTO continua no aluno recém-graduado (`presencas_desde_graduacao`
  vem da view e não é recalculado).

**Correção:** depois de uma graduação gravada, e depois de uma graduação
apagada, o `AppShell` chama o `recarregar()` que já existe — a lista volta a
vir do banco, que é a fonte única. Nada de remendar a lista na mão. O aluno
aberto passa a ser guardado **por id** (estado `ficha = { id, origem, aba }`), e o objeto é lido da
lista a cada render: a ficha aberta enxerga a recarga, e um aluno apagado
fecha a ficha sozinho.

### 4.2 Rodapé da ficha por cima dos campos (dívida anterior à G3)

Visto no Chrome: o `<fieldset>` com `overflowY: auto` é pintado fora dos
limites e passa por baixo/por cima do rodapé (Cancelar/Salvar). **Reproduzir
no Chrome DevTools antes de corrigir** (systematic-debugging). Correção
esperada: a rolagem passa para uma `<div>` própria; o `<fieldset disabled>`
fica dentro dela, só para desligar a edição (`podeEditar`). Se a reprodução
mostrar outra causa, o plano muda antes do código.

### 4.3 Zoom bloqueado

- Sai o `maximumScale: 1` de `app/layout.tsx` (o professor volta a poder dar
  zoom com dois dedos).
- Efeito colateral conhecido: com o zoom liberado, o iPhone dá zoom sozinho
  ao focar campo com letra menor que 16 px. Por isso **todo campo de texto do
  app passa a 16 px** (Regra do 16, `DESIGN.md`), não só os de Alunos:
  `Field`, notas, "Veio de faixa juvenil", campos do Perfil do Professor,
  campos do modal de aula, busca da Chamada e os dois campos do login.
- **Teste no iPhone do Pedro** (decisão 7): pinça funciona; focar cada campo
  acima não dá zoom sozinho.

### 4.4 Versão de computador

A coluna de 720 px é provisória. A tela de Alunos passa a usar a largura toda
(decisão 6). As outras telas não mudam de largura nesta fase.

## 5. Como a tela fica

### 5.1 Celular (até 959 px) — prints 1 a 4

- **Cabeçalho:** "ALUNOS" em estêncil, "33 alunos" ao lado, costura dupla com
  ponteira (já existe desde a G3).
- **Busca e filtros numa linha:** campo de busca (48 px, 16 px de letra, ícone
  de lupa) e o botão "Filtrar" com o número de filtros ativos. Abaixo, os
  chips removíveis dos filtros ativos (um toque tira). O painel de filtros
  (Faixa / Situação / Categoria) continua igual em função: sem rascunho,
  cada toque vale na hora, fechar nunca desfaz.
- **Lista agrupada por faixa:** um grupo por faixa que tenha aluno, na ordem
  de `ORDEM_FAIXAS` (progressão adulta, depois as infantis). Cabeçalho do
  grupo: etiqueta preta pequena com o nome da faixa e a contagem. Dentro do
  grupo, a ordem da carga (por nome). Linha de 64 px no mínimo, toda tocável.
- **Selos na linha:** PRONTO (âmbar cheio) e/ou AFASTADO (contorno âmbar),
  escritos, com o motivo no `title` como hoje.
- **Vazio:** "Nenhum aluno com "{busca}"." com busca; "Nenhum aluno com esses
  filtros." sem busca.
- **"+" flutuante** no canto, como hoje; cria o aluno e abre a ficha.
- **Ficha do aluno:** folha que sobe e **cobre a tela inteira** (não mais 90%
  com 480 px). No topo: etiqueta de categoria ("Adulto · 31 anos") e o botão
  fechar de 48 px. Nome em estêncil (é o título da tela), selos, a faixa
  desenhada `md` num quadro de papel com "Faixa azul · 2 de 4 graus". As 4
  abas (Perfil, Frequência, Notas, Graduação) viram uma faixa de 44 px; a
  ativa é preenchida (`ativo`). Rodapé fixo com Cancelar e Salvar
  alterações. "Apagar aluno" sai do rodapé e vai para o fim da aba Perfil,
  em `erro-texto` (o rodapé fica com dois botões só e não come a tela).

### 5.2 Computador (960 px ou mais) — prints 5 e 6

- Menu lateral da G3 à esquerda. Conteúdo sem largura máxima.
- **Cabeçalho** com "+ Novo aluno" (botão cheio) à direita; o "+" flutuante
  some no computador.
- **Grade de duas colunas:** à esquerda busca + Filtrar + tabela; à direita a
  ficha, fixa (`position: sticky`), 340–380 px.
- **Tabela:** cabeçalho de colunas (Nome, Faixa, Frequência, Situação) com
  linha de 1,5 px; os mesmos grupos por faixa do celular; linha de 56 px; o
  aluno aberto fica marcado (contorno de 1,5 px). Nome longo corta com "…".
- **Entre 960 e 1180 px** a tabela perde Frequência e Situação (só Nome e
  Faixa); os selos continuam visíveis na ficha.
- **Ficha fixa:** mesmo componente e mesmo conteúdo da folha do celular, sem o
  botão fechar; "Cancelar" volta o painel ao estado vazio. Rodapé fixo
  dentro do painel; o miolo rola.
- **Aberta pelo Início ou Graduar** (decisão 5b): mesmo componente, como
  painel pela direita com fundo escurecido; fechar devolve à tela de onde
  veio.

### 5.3 O que sai da lista (registrado para o Pedro vetar se quiser)

Com o crachá saem da lista o **anel de frequência** (vira o número "18 de 25"
na linha) e o **tempo de treino** ("1A 3M"; a data de início continua na
ficha). Nenhum dado se perde; é só o que deixa de aparecer na lista.

## 6. Funções que continuam iguais (conferir uma por uma no teste)

Cadastrar (agora abrindo a ficha), editar e salvar com `payloadAluno()`,
validação (`validarAluno`), aviso de tempo mínimo da IBJJF e do grau da preta
(`window.confirm`), bloqueio de assinatura (`professorPodeAssinar`), faixa e
graus ajustados juntos (`Math.min(f.graus, grausMaximos(...))`), histórico de
graduação gravado ao mudar faixa ou grau, apagar graduação (lixeira),
afastado manual com "Voltar ao automático", campeão mundial por faixa, faixa
juvenil, graduação provisória com dias restantes, ritmo do professor
("sugestão sua") separado da regra da IBJJF, notas, frequência, apagar aluno
(lixeira, 7 dias), filtros (Faixa/Situação/Categoria, chips removíveis, sem
rascunho), `referrerPolicy="no-referrer"` em toda foto de aluno, abrir na aba
Graduação quando vem do painel de prontos.

## 7. Estrutura do código

- `components/alunos/` (novo):
  - `TelaAlunos.tsx` — cabeçalho, busca, filtros, lista/tabela e a vaga da
    ficha fixa;
  - `ListaAlunos.tsx` — grupos por faixa e `LinhaAluno`;
  - `FiltrosAlunos.tsx` — `BarraFiltros`, `PainelFiltros`, `Chip`,
    `ChipRemovivel`;
  - `FichaAluno.tsx` — o antigo `ModalAluno` (cabeçalho, abas, rodapé);
  - `AbaGraduacao.tsx` — a aba Graduação, a maior, em arquivo próprio.
- `components/comum/Campos.tsx` — `Field` e `Toggle`, usados também pelo
  Perfil do Professor e pela aula.
- `lib/lixeira.ts` — `mandarParaLixeira`, `restaurarDaLixeira`,
  `DIAS_LIXEIRA`, `limiteLixeira`, `diasNaLixeira`, `textoPrazo`.
- `lib/alunos.ts` — `COLUNAS_ALUNO`, `payloadAluno`, `validarAluno`,
  `ehInfantilAluno`, `Filtros`, `FILTROS_VAZIOS`, `temFiltroAtivo`,
  `aplicarFiltros`, `ORDEM_FAIXAS`, `agruparPorFaixa`.
- `lib/busca.ts` — `casaBusca(nome, termo)`, sem import, testável no Node como
  `lib/datas.ts`. Ignora maiúscula e acento ("joao" acha "João"). A busca da
  Chamada **não** muda nesta fase.
- `lib/cores-faixa.ts` — `BELT_COLORS` (bloco `cor-ok` da IBJJF).
- `app/alunos.css` — as classes de Alunos (precisam de media query, como a
  `Navegacao`). Importado no `app/layout.tsx`. Só `var(--token)`; o
  `checar-cores` varre este arquivo.
- `AppShell.tsx` continua dono do estado (`alunos`, `ficha`, `filtros`,
  `busca`, `recarregar`) e das cargas. A Lixeira, as Aulas, a Chamada e os
  outros modais ficam onde estão.

**Regra de estilo dos componentes novos:** classes de `app/alunos.css` para
tudo que é visual e responsivo; inline só para valor que muda em tempo de
execução (cor da faixa vinda da IBJJF, por exemplo). Nada de `className` do
Tailwind.

## 8. Restrições

- Sem migration. Sem mexer em `lib/regras-ibjjf.ts`, `lib/ritmo-graus.ts`,
  `lib/alertas-graduacao.ts`, `lib/afastamento.ts`, `lib/carregar-dados.ts`.
- Troca celular/computador só por CSS em 960 px. Saber "de onde a ficha foi
  aberta" (Alunos ou Início/Graduar) é estado do app, não detecção de
  aparelho.
- Alvo de toque ≥ 44 px, campos de 48 px com 16 px de letra, foco de 3 px,
  `prefers-reduced-motion`.
- `npx tsc --noEmit`, `npm run checar-cores` e `npm run testar` limpos antes de
  cada commit. Branch `desenvolvimento`, commit e push por etapa.
- O banco é o de produção: aluno de teste chama `ZZ-TESTE-G5`, é apagado de vez
  pelo Pedro no fim, e a linha de base (33 alunos, 5 aulas, 59 presenças, 29
  graduações) é conferida.

## 9. Escolhas minhas (o Pedro confere)

- "Apagar aluno" no fim da aba Perfil, em `erro-texto`, fora do rodapé.
- No computador, "+ Novo aluno" no cabeçalho em vez do "+" flutuante.
- No computador, o painel de filtros continua sendo o botão "Filtrar" (não
  uma linha fixa de chips): com até 17 faixas, a linha viraria duas ou três.
- Salvar continua fechando a ficha, como hoje, também no computador (o painel
  volta ao estado vazio).
- Busca que ignora acento.
- Na tabela, aluno sem nenhuma aula lançada mostra "—" na frequência.
- "Alteração não salva" (decisão 5a) = `payloadAluno(form)` diferente de
  `payloadAluno(aluno)`, coluna a coluna. A mesma pergunta vale para trocar de
  aba na navegação com a ficha fixa aberta e alterada (no computador o menu
  lateral fica à vista; no celular a folha cobre a barra).
- Esc fecha a ficha (folha ou painel pela direita) e o painel de filtros,
  passando pela mesma pergunta quando houver alteração.
- A origem da ficha (`'alunos'` ou `'fora'`) é guardada junto com o id; sair
  da tela de Alunos fecha a ficha fixa.
