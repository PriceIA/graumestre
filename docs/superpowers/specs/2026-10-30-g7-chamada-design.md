# G7 — Chamada: design

**Data:** 2026-10-30 · **Fase:** G7 do `docs/ROADMAP.md` · **Branch:** `desenvolvimento`
**Migration:** nenhuma. **Banco:** só leitura e as mesmas gravações de hoje em `presencas`.
**Esboço aprovado:** `.superpowers/brainstorm/749-1793373709/content/chamada-v2.html` (celular versão A; computador como na v1). Referência visual: `docs/direcoes/gm-kimono.html`.

Nas listas abaixo, **(Pedro)** marca uma decisão do Pedro tomada na conversa de 2026-10-30, e **(decisão do Claude)** marca uma decisão do Claude que o Pedro pode mudar. O que não tem marca vem do `CLAUDE.md`, do `ROADMAP.md`, do `DESIGN.md` ou do código atual.

---

## 1. Intenção

A chamada é a tela-modelo do app: o professor no tatame, celular na mão, com pressa. Cada toque marca ou desmarca e grava na hora, sem botão "Salvar". A G7 tira a `Chamada` de dentro do `AppShell.tsx` e dá a ela a pele do kimono. **As funções de hoje continuam as mesmas.** Entram quatro coisas novas: o placar, o "Desfazer", a abertura da ficha do aluno e o espaço preparado para a Parte 2 (quem confirmou a presença).

Para que serve o placar, nas palavras do Pedro: *"Quero ver primeiro quantos já chegaram para começar a aula, e saber quantos prontos estão na aula para eu lembrar de graduar."* O "voltaram" existe para *"ver quem voltou para dar boas-vindas."*

## 2. Metas, não-metas e anti-metas

**Metas**
- Mesmo comportamento de gravação de hoje: upsert por `(aula_id, aluno_id)`, otimista, revertido se o banco recusar, desmarcar grava `presente = false` (nunca apaga linha), payload por whitelist (`payloadPresenca`).
- O placar (§4), o "Desfazer" (§7), a ficha aberta pela linha (§8) e o selo de quem confirmou, reservado (§9).
- Duas versões, trocadas só por CSS em 960 px: celular (§10) e computador (§11). Dois temas.

**Não-metas (ficam para depois)**
- Fila offline (pendência 4 do `CLAUDE.md`). Um toque sem rede continua dando erro na tela, como hoje.
- O "aguarda revisão" de verdade, com a conferência do professor: é da G9, com migration, backup e aprovação do Pedro **(Pedro)**.
- Horários de turma, "de outro horário" e "presentes por horário" do protótipo: o GrauMestre não tem horário.
- Editar a aula, trocar a foto ou lançar aula de dentro da chamada.

**Anti-metas (seria falha mesmo funcionando)**
- Qualquer toque que pareça gravado e não esteja no banco.
- Uma segunda conta de "pronto" ou de "afastado" que discorde de `alertaGraduacao()` ou de `estaAfastado()` (Princípio 3 do `PRODUCT.md`).
- Nome de aluno ou faixa cortados no celular **(Pedro, ao ver o esboço v1)**.
- Um toque que abre a ficha quando o professor queria marcar, ou o contrário.
- "Marcar todos" marcando a turma inteira quando o professor acha que é só o filtro.

## 3. Onde a chamada mora

- **Em tela cheia, por cima de tudo, sem a barra de abas,** como hoje **(Pedro)**: assim o professor não sai da chamada sem querer. Abre pelos mesmos caminhos de hoje: tocar na etiqueta "Aula do dia" ou num card de aula (`TelaAulas`, `EtiquetaAulaDoDia`), e ao criar uma aula (`ModalAula` → `onCriada`).
- **O ✕ volta para Aulas** **(Pedro)**. Hoje a chamada só abre a partir de Aulas, então isso é fechar a camada. Se no futuro ela abrir de outra tela, o ✕ continua levando para Aulas. Ao fechar, chama `recarregar()` como hoje, para o card mostrar o novo total.
- O estado continua no `AppShell` (`chamadaAula`). O componente sai do `AppShell.tsx` para `components/chamada/`, com as classes em `app/chamada.css` (prefixo `ch-`), no mesmo padrão de Alunos e Aulas, porque precisa de media query. Só `var(--token)` e nada de cor escrita à mão (`npm run checar-cores`).
- Ganha `touch-action: manipulation` e `overscroll-behavior: contain` (pendência G3 nº 2 no `PLANO-ATUAL.md`), além de `role="dialog"`, `aria-modal`, foco levado para dentro ao abrir e Esc fechando, o mesmo que o ✕ faz **(decisão do Claude)**.

## 4. O placar

Uma etiqueta tecida com ponteira (DESIGN.md, "Placar"), com três números:

| Número | O que conta | Toque |
|---|---|---|
| **N / M PRESENTES** (o maior) | N = alunos com presença marcada nesta aula; M = alunos ativos da turma (a mesma lista que a chamada mostra, igual a hoje) | nenhum |
| **PRONTOS** | dos **presentes**, quantos `alertaGraduacao(aluno, aluno.ultima_graduacao_data, presencasPorGrau) !== null` (grau ou faixa) **(Pedro)** | filtra |
| **VOLTARAM** | dos **presentes**, quantos estavam **afastados antes desta aula** (§5) **(Pedro)** | filtra |

- O total de afastados da turma inteira **não** aparece no placar **(Pedro)**.
- **PRONTOS e VOLTARAM são botões** (`aria-pressed`). Um toque liga o filtro, e um segundo toque volta à lista inteira. **Os filtros são exclusivos:** ligar um desliga o outro **(Pedro)**. O filtro ligado aparece invertido dentro da etiqueta (fundo `destaque`).
- **O número conta só os presentes, mas o filtro mostra todos** **(Pedro, 2026-10-30, resposta à pergunta do revisor)**:
  - Filtro PRONTOS: todos os alunos com `alertaGraduacao()` não nulo, marcados ou não.
  - Filtro VOLTARAM: todos os que estavam afastados antes desta aula (§5), marcados ou não. Os não marcados aparecem com o selo AFASTADO, e os marcados com VOLTOU.
  - Assim dá para marcar dali, e o "Marcar os N da lista" (§7) tem sentido.
- **O filtro diz quantos estão marcados, no formato "marcados de total"** **(Pedro, na aprovação do spec)**: uma linha acima da lista, com o texto **"2 de 5 prontos"**. No filtro VOLTARAM, o mesmo formato: "1 de 3 afastados" **(decisão do Claude, por simetria)**. Logo depois, a dica "toque de novo para ver todos" **(decisão do Claude)**. Com total 0: "Nenhum aluno pronto para graduar" ou "Nenhum aluno estava afastado antes desta aula" **(decisão do Claude)**.
- Os números do placar sempre contam a aula inteira, sem levar em conta busca ou filtro **(decisão do Claude)**.
- **PRONTOS conta o que o app sabia ao abrir a chamada** **(Pedro aceitou)**. `presencas_desde_graduacao` vem da view e só muda no `recarregar()`. Se a presença de hoje é a que completa o critério, o aluno só aparece como pronto na próxima abertura. **Não** criar uma segunda conta local de pronto. Numa chamada antiga reaberta, PRONTOS diz quem está pronto **hoje** entre os presentes daquela aula, e isso é aceito **(decisão do Claude)**.
- Números em estêncil, com algarismos tabulares (DESIGN.md, "Placar").

## 5. "Afastado antes desta aula" — a mesma regra, outro corte

**O problema:** `aulas_perdidas` é calculado em `lib/carregar-dados.ts` a partir da **última presença**. Depois de marcar um aluno sumido e fechar a chamada, o `recarregar()` muda a última presença para hoje, e o aluno deixa de ser afastado. Reabrindo a chamada, o "voltaram" daria 0, justo quando o professor foi dar as boas-vindas.

**A regra** **(Pedro concordou)**: VOLTOU = o aluno estava afastado considerando só as aulas **anteriores** a esta. É a mesma regra de hoje: `AULAS_PARA_AFASTADO = 6` aulas perdidas seguidas, `afastado_manual` true ou false sempre vence o cálculo, e a função é a mesma `estaAfastado()`. Só o corte muda: "até a véspera desta aula" em vez de "até agora".

**Como (decisão do Claude):**
- Extrair o cálculo de aulas perdidas para uma função pura (sem import, testada em `scripts/*.test.mjs`), por exemplo `aulasPerdidasAte(alunoId, inicio, aulasDadas, corte)`. Ela conta as aulas ativas com data `< corte`, depois da última presença do aluno antes do corte. Se o aluno não tem presença antes do corte, conta as aulas com data `>= inicio` e `< corte`.
- **`lib/carregar-dados.ts` passa a usar a mesma função** para o `aulas_perdidas` de sempre, para existir **um código só**. Invariante testado: com o corte "depois de hoje", ela devolve o mesmo resultado de hoje. Para o aluno sem nenhuma presença, hoje se usa `total_aulas` da view. A carga só traz as 50 aulas mais recentes, então as duas contas só divergem acima de 50 aulas, quando o limiar de 6 já foi passado de qualquer jeito, e `estaAfastado()` dá o mesmo resultado. O construtor escolhe entre manter o `total_aulas` como reserva para esse caso ou aceitar a diferença, desde que `estaAfastado()` não mude para nenhum aluno com os dados reais (conferir antes e depois).
- Na chamada: `afastadoAntes = estaAfastado({ afastado_manual, aulas_perdidas: aulasPerdidasAte(..., aula.data) })`. Ela usa as `aulas` do `AppShell`, que já trazem `presencas(aluno_id, presente)`, filtradas por `data <= hoje` (só aulas dadas, como na 016).
- **Marcação manual:** o aluno com `afastado_manual = true` que vem à aula aparece como VOLTOU e entra no VOLTARAM **em toda chamada**, enquanto a marcação existir, até o professor desligá-la na ficha **(Pedro)**. Sem aviso nem sugestão de desligar.
- **Aula no mesmo dia:** outra aula com a mesma data **não** entra no corte (`< aula.data`) **(decisão do Claude)**. É o caso raro de duas aulas num dia, e o efeito é no máximo um "voltou" a mais ou a menos.
- **Aula futura** (lançada com antecedência): o corte é a data dela e entram só aulas já dadas. Funciona igual.

## 6. A linha do aluno e os selos

**Celular, versão A do esboço v2 (Pedro):**

```
[ ficha 44 ] 10px [ Nome inteiro, quebra em até 2 linhas              ] [ MARCAR 92 ]
                  [ ▬faixa  Azul, 2 graus  PRONTO                      ]
```

- **Botão da ficha** (44×44 px, borda cheia de 1,5 px `controle`, fundo `papel`, com a foto, ou a inicial, e um cantinho ↗) **(Pedro: opção 1, com contorno ou ícone que o faça parecer botão)**. Abre a ficha (§7). **Os dois alvos não podem encostar**: no mínimo 8 px entre o botão da ficha e o botão da linha **(Pedro)**. A foto mantém `referrerPolicy="no-referrer"`, e uma URL quebrada cai na inicial. `aria-label="Abrir ficha de {nome}"`.
- **O resto da linha é um botão só** (nome, detalhe e caixa) e marca ou desmarca com um toque, como hoje. `aria-pressed`.
- **O nome nunca é cortado.** Quebra em até duas linhas, e um nome que ainda não couber quebra onde precisar **(Pedro)**.
- **Segunda linha:** faixa desenhada pequena (`FaixaDesenhada size="sm"`, ~40 px), depois "Azul, 2 graus", depois o selo. A linha quebra em vez de cortar **(Pedro: "a faixa na segunda linha resolve o corte")**.
- **Caixa MARCAR / PRESENTE** com 44 px de altura e ~92 px de largura: tracejada com "MARCAR" antes, preenchida em `ativo` com ✓ e "PRESENTE" depois. Presença nunca é verde. A animação da costura se fechando (340 ms) só roda com `prefers-reduced-motion: no-preference`.
- **No celular não há índice A–Z** **(Pedro)**. A busca presa no alto resolve numa turma de 33.

**Selos** (12 px, caixa alta, sempre escritos):

| Selo | Quando | Estilo |
|---|---|---|
| **PRONTO** | `alertaGraduacao()` não nulo. Aparece em presente e em ausente **(decisão do Claude)** | âmbar cheio (`alerta` / `sobre-alerta`) |
| **AFASTADO** | estava afastado antes desta aula **e ainda não foi marcado** **(decisão do Claude)** | só contorno âmbar (`alerta`, texto `alerta-texto`, fundo `papel`), igual à lista de Alunos |
| **VOLTOU** | estava afastado antes desta aula **e está marcado** **(Pedro)** | contorno neutro (`tinta`), porque é boas-vindas e não alerta **(decisão do Claude, aprovada no esboço)** |

Ao marcar, o AFASTADO vira VOLTOU na hora. Desmarcar faz o caminho de volta.

**Ordem da lista:** alfabética pelo nome, sem diferença de acento e maiúscula (`lib/busca.ts`), agrupada por letra com o cabeçalho de letra do protótipo **(decisão do Claude, já era "lista A–Z" no ROADMAP)**.

## 7. "Marcar todos" e o "Desfazer"

**Marcar todos** (continua como hoje **(Pedro)**): marca os ainda não marcados da **lista visível**.
- Sem busca e sem filtro, o texto é "Marcar todos".
- Com busca ou com filtro, o texto diz quantos vai marcar: **"Marcar os N da lista"** **(Pedro; a busca conta como filtro também)**. N = quantos da lista visível **ainda não** estão marcados **(decisão do Claude)**. Com N = 1, o texto vira "Marcar 1 da lista". Com N = 0, o botão fica desligado **(decisão do Claude)**.
- Com o filtro PRONTOS ou VOLTARAM ligado, N conta os não marcados daquele filtro (§4). Busca e filtro juntos: a lista visível é a interseção, e N conta os não marcados dela **(decisão do Claude)**.

**Desfazer** **(Pedro)**:
- Depois de cada ação que grava, aparece uma etiqueta embaixo (no celular, de ponta a ponta; no computador, no canto inferior direito) com o texto e o botão "Desfazer" de 44 px, por **6 segundos**. Exemplos de texto: "André: presença gravada", "André: presença removida", "12 marcados". Texto anunciado por `aria-live="polite"`.
- **Desfaz a última ação inteira.** Toque num aluno: volta só ele. "Marcar todos": volta **só os alunos que ele marcou**, cada um para o valor que tinha antes (quem já estava presente continua presente).
- O aluno que não tinha registro nesta aula volta como `presente = false`, uma linha nova. É o que desmarcar já faz hoje: o app nunca apaga linha de presença **(decisão do Claude)**.
- **Só a última ação** pode ser desfeita. Uma ação nova substitui a anterior **(decisão do Claude)**.
- O desfazer é uma gravação como as outras: otimista, com o mesmo upsert, revertida e com erro na tela se o banco recusar. Se a ação original falhou, não aparece "Desfazer", só o erro.
- Ao fechar a chamada, o "Desfazer" pendente some **(decisão do Claude)**.
- **A lista tem folga embaixo** (~76 px, a altura da etiqueta mais a margem), para a etiqueta nunca cobrir a última linha **(Pedro, ao ver o esboço v1)**.

## 8. A ficha do aluno a partir da chamada

- O botão da ficha abre a `FichaAluno` de sempre, com `origem: 'fora'` e aba `perfil`, pelo `abrirAluno()` do `AppShell`. No celular ela cobre a tela; no computador é o painel de 440 px pela direita.
- **A ficha abre por cima da chamada**, que continua montada por baixo. Hoje a chamada usa `zIndex: 120` e a ficha usa `z-index: 100`: a ficha aberta a partir da chamada precisa ficar acima. Ao fechar a ficha, o professor volta à chamada **do jeito que estava**, com as presenças, o filtro, a busca, a posição da lista e o Desfazer pendente **(Pedro)**.
- Salvar na ficha só junta o aluno salvo na lista (`setAlunos` + `router.refresh()`); graduar ou apagar graduação chama `recarregar()` (`onGraduacaoMudou`). Nos dois casos a chamada recebe os `alunos` (e, no segundo, as `aulas`) novos sem perder o estado dela. **Consequência aceita:** graduar a partir da chamada roda `recarregar()`, a view já conta as presenças marcadas nesta aula, e o PRONTOS pode mudar com a chamada aberta. É a exceção à regra do §4, e está certa: o número vem da mesma fonte de sempre **(decisão do Claude)**.
- **Esc:** a `FichaAluno` escuta Esc no `document`. Com a ficha aberta por cima, o Esc fecha só a ficha, nunca a chamada junto (o construtor resolve como). O mapa de presenças desta aula é dela, carregado do banco ao abrir. As regras de descarte (`confirmarDescarte()`) valem como em toda abertura de ficha.

## 9. Preparado para a Parte 2: quem confirmou

- A chamada passa a ler `presencas.confirmado_por` junto com `presente`. A coluna existe desde a migration 006. **Nenhuma migration.**
- **Hoje não aparece nada além de PRESENTE** **(Pedro)**: todas as presenças são do professor, e um selo em cada linha só poluiria a tela.
- A linha tem um lugar reservado para um selo que **acende quando `confirmado_por === 'aluno'`**, com o texto provisório "AGUARDA REVISÃO", em contorno neutro **(decisão do Claude)**. Hoje esse caso nunca acontece, então a G7 testa o selo só com dado simulado, sem gravar `'aluno'` no banco.
- Quando o professor marca, o upsert continua gravando `confirmado_por: 'professor'` (`CONFIRMADO_POR_PROFESSOR`), sem mudança.

## 10. Celular (até 959 px)

De cima para baixo, numa coluna de até 640 px com 16 px de gutter:
1. Cabeçalho: "CHAMADA" em estêncil, com a costura dupla e a ponteira do protótipo; embaixo, a data curta e a técnica (`dataCurta()`, por exemplo "sex, 30 out · Toreando da De La Riva"); ✕ de 48 px à direita.
2. Placar (§4).
3. Botão "Marcar todos" / "Marcar os N da lista".
4. Erro, quando houver (texto em `erro-texto`, sempre escrito, como hoje).
5. Busca **presa no alto ao rolar** (64 px, campo de 16 px, com a trama atrás).
6. Lista (§6), com folga embaixo (§7).

A Regra dos Seis do DESIGN.md (seis alunos inteiros por tela) vale **depois de rolar**, com o placar fora da tela e a busca presa. Linhas com nome em duas linhas são mais altas: conferir em 390 × 844 com os nomes reais. Se não couberem seis, reportar com print, sem forçar ajuste **(decisão do Claude)**.

## 11. Computador (960 px ou mais)

Como no esboço v1, aprovado **(Pedro: "No computador está bom")**:
- Placar na largura toda, com números maiores (52 e 76 px).
- Abaixo dele, duas áreas: a **lista** à esquerda e a **aula do dia** numa coluna fixa de 340 px à direita (`sticky`).
- Acima da lista: "Marcar todos" e a busca na mesma linha, e as **letras A–Z numa barra**. Só aparecem as letras que existem, e um toque rola até elas.
- Lista em **2 colunas**, sem separar uma letra do seu grupo.
- **Aula do dia**: etiqueta com a posição, a técnica em estêncil e a observação, mais a foto (`FotoAula`) e a miniatura do vídeo (`MiniaturaYoutube`) quando existirem, como na `ImagensAula` da G6. Só para ver, sem botão de editar **(decisão do Claude, não-meta do §2)**.
- Entre 960 e ~1180 px (DESIGN.md, Layout), a aula do dia desce para cima da lista, em largura total.

## 12. O que já existe e tem que ser preservado

- `payloadPresenca`, `gravarPresencas` (upsert `onConflict: 'aula_id,aluno_id'`), `CONFIRMADO_POR_PROFESSOR`, o estado inicial vindo do banco (nunca da memória), o otimista com reversão, o "Carregando…" e os erros com o nome do aluno. Isso sai do `AppShell.tsx` sem mudar de comportamento.
- `recarregar()` ao fechar.
- Busca por nome sem acento (`lib/busca.ts`), igual à da tela de Alunos. Hoje a chamada usa `toLowerCase().includes`, e passa a ignorar acento **(decisão do Claude)**.
- Campo de busca com 16 px (Regra do 16).

## 13. O que fica para o construtor

- Nomes de arquivo e de componente dentro de `components/chamada/` e de `lib/`. O cálculo puro (filtros do placar, contagens, texto do botão, planejamento do Desfazer, `aulasPerdidasAte`) fica em arquivos sem import, testados em `scripts/*.test.mjs`, no padrão de `lib/aulas-dia.ts`.
- O ícone exato do botão da ficha, desde que pareça botão.
- O tamanho exato da folga e das quebras, conferidos no navegador.

## 14. Teste (do ROADMAP, mais o que esta conversa acrescentou)

No `localhost`, celular de 390 px e computador de 1280 px, nos dois temas, **conferindo cada gravação no Supabase por `select`**:
**Regra dos testes de gravação** **(Pedro, 2026-10-30)**: **nenhum aluno real, em nenhum teste.** O site está no ar e o banco é o mesmo, então o teste no banco real só acontece **quando o professor não estiver usando o app**. Quem decide a hora é o Pedro.

- **No banco real, só três alunos:** o "Novo Aluno" (o 34º, de 2026-10-23) e dois alunos de teste que o Pedro cria pelo "+", **ZZ-TESTE-G7 B** e **ZZ-TESTE-G7 C**. Eles são marcados numa aula de teste, **ZZ-TESTE-G7**.
- **Data da aula ZZ-TESTE-G7 (decisão do Claude):** amanhã ou depois, ou seja, uma aula **futura**. Desde a 016, aula futura não conta em `total_aulas`, `aulas_perdidas` nem nos números da home. Assim, enquanto a aula existir, a frequência dos alunos reais não muda. Com data de hoje ou do passado, todos os 34 ganhariam uma aula perdida até a aula ir para a lixeira.
- **Na tela, no banco real:** marcar, desmarcar, Desfazer de um toque, e "Marcar todos" com a busca reduzida, seguido de Desfazer. A busca "ZZ-TESTE" pega só B e C. O "Novo Aluno" é marcado e desmarcado sozinho, porque nenhuma busca junta os três **(decisão do Claude)**. Roteiro do "Marcar todos": marcar B com um toque; buscar "ZZ-TESTE"; o botão diz "Marcar 1 da lista"; tocar, e C fica marcado; Desfazer, e C volta a "não presente" enquanto **B continua presente**. Cada passo é conferido por `select` em `presencas`.
- **Pronto e a regra do afastado: com dado simulado.** São testes automáticos das funções puras, com 6 aulas perdidas, a marcação manual, a aula no mesmo dia e a aula futura. Na tela, um aluno fictício é injetado só no navegador (por exemplo, a resposta de `alunos_frequencia` alterada pelo Chrome DevTools), e nada é gravado: nesse estado não se toca em MARCAR.
- **Afastado e voltou, no banco real, só com o "Novo Aluno"** **(Pedro, na aprovação do spec)**:
  - antes, anotar o `afastado_manual` dele por `select`;
  - ligar "afastado" à mão na ficha dele;
  - na chamada ZZ-TESTE-G7, conferir que ele aparece com AFASTADO, que vira VOLTOU ao marcar, e que o VOLTARAM sobe para 1. Conferir também o filtro VOLTARAM ("0 de 1 afastados" e depois "1 de 1");
  - no fim, voltar o `afastado_manual` ao valor anotado, conferido por `select`.
  - Se o valor anotado for `null` (automático), a ficha volta a `null` pelo link "voltar ao automático" que já existe (`FichaAluno`, `set('afastado_manual', null)`). Como reserva, o plano deixa pronto um `update` por id para o Pedro.
  - Nenhum aluno real é tocado.
- **Limpeza:** no fim, o Pedro manda B, C e a aula ZZ-TESTE-G7 para a Lixeira. As presenças da aula, inclusive a do "Novo Aluno", só somem com a purga, no cascade da aula. O `PLANO-ATUAL.md` registra:
  - a contagem de antes do teste, tirada por `select` na hora;
  - a contagem esperada **depois da purga** (7 dias depois do envio para a lixeira): os mesmos números de antes, sem nenhuma `ZZ-TESTE-G7`.
  - A purga das `ZZ-TESTE-G6` (por volta de 07/11) também entra nessa conta, se cair no meio.

1. Marcar e desmarcar os três alunos de teste, conferindo `presente` e `confirmado_por` no banco.
2. Desfazer um toque; "Marcar todos" e depois Desfazer, conferindo que quem já estava presente continua presente.
3. Ligar e desligar PRONTOS e VOLTARAM, conferindo que são exclusivos, o "X de Y" e o texto do botão com filtro e com busca. O VOLTARAM no banco real usa o "Novo Aluno" marcado como afastado à mão. O PRONTOS só com dado simulado, porque com 5 aulas ninguém está pronto pelo critério de presenças.
4. Abrir a ficha de um aluno de teste pelo botão de 44 px, fechar e conferir que a chamada está igual.
5. Sair da chamada no meio e voltar: as presenças continuam lá, e o VOLTARAM continua em 1 com o "Novo Aluno" marcado.
6. Nenhum nome ou faixa cortado em 390 px, com os 34 alunos reais, só olhando, sem marcar ninguém.
7. Dado de teste limpo no fim, e linha de base conferida. **Linha de base de 2026-10-30: 34 alunos ativos** (o 34º é o "Novo Aluno" de 2026-10-23, registrado no `PLANO-ATUAL.md`; apagar ou não é com o Pedro), 5 aulas ativas, e as quatro `ZZ-TESTE-G6` na lixeira até a purga de 07/11. Conferir os números com `select` antes de começar.
