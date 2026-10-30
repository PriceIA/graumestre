# G6 — Tela de Aulas: design

Escrito em 2026-10-23, a partir do brainstorm com o Pedro na mesma data
(cinco perguntas, uma por vez). O que está em **§3** é decisão do Pedro, com
as palavras dele. O que está marcado **(decisão do Claude)** é escolha de quem
escreveu este documento, para o Pedro conferir ao ler; pode ser derrubada.

Referências: `docs/ROADMAP.md` (G6), `PRODUCT.md`, `DESIGN.md`, protótipo
`docs/direcoes/gm-kimono.html` (a etiqueta `.aula.etq.ponta`, linhas 445–452 e
o CSS das linhas 164–222), `CLAUDE.md` (seções "Foto da aula", "Card de vídeo
da aula", "Datas", "Tela de Alunos (G5)").

## 1. Para que serve e para quem

O professor abre Aulas para três coisas: **começar o treino de hoje** (lançar
a aula e cair na chamada), **voltar a uma aula** (reabrir a chamada, colar o
link do vídeo que acabou de subir, pôr a foto da turma) e **ver o que já foi
dado**. No tatame é com o celular, com pressa; no escritório, no computador,
com a turma de aulas à vista. Modo **Operate**: menos toques e leitura rápida
valem mais que expressão; a marca aparece no acabamento (etiqueta, costura,
estêncil, ponteira).

## 2. Objetivo, não-objetivos e anti-objetivos

**Objetivo:** tirar a tela de Aulas do `AppShell.tsx` para
`components/aulas/`, dar a ela a pele do `DESIGN.md` em duas versões de
verdade (celular e computador), criar a etiqueta "Aula do dia" e aplicar as
cinco decisões de §3.

**Não-objetivos:**
- A **Chamada** (`Chamada` em `AppShell.tsx`) não muda: é da G7. A G6 só
  continua a abri-la como hoje.
- Início, Alunos, Graduar, Mais, Lixeira e Perfil do Professor não mudam.
- O modal de edição continua fechando pelo pano escuro e pelo Cancelar **sem
  perguntar** sobre alteração não salva, como hoje. É comportamento existente;
  mudar exige pedido do Pedro. (Registrar como menor em `docs/PLANO-ATUAL.md`.)
- A seção "Foto da aula" **dentro** do modal de edição continua gravando assim
  que o professor escolhe o arquivo, sem a confirmação nova (§3, decisão 2).
- Sem migration. Sem `app/api/*`. Sem lib nova.

**Anti-objetivos (se acontecer, a G6 falhou mesmo "funcionando"):**
- qualquer coisa das telas de Aulas do FOJJ (horário de turma, "presentes por
  horário", resumo de turma);
- uma função de Aulas que existia e sumiu, ou passou a fazer outra coisa sem o
  Pedro pedir (lista em §4);
- **uma aula que existe e não aparece em lugar nenhum da tela**;
- um campo derivado (`foto_url`, `presencas`) entrando num `insert`/`update`
  (PGRST204): o payload continua literal, coluna a coluna;
- uma segunda definição de "hoje": tudo usa `hojeBrasil()` de `lib/datas.ts`,
  nunca `new Date().toISOString()`;
- a foto gravada sem o professor confirmar, quando escolhida pelo botão Foto
  da etiqueta.

## 3. Decisões do Pedro (2026-10-23)

1. **A etiqueta "Aula do dia" aparece sempre.** Sem aula com data de hoje, ela
   mostra **"Nenhuma aula lançada hoje"** e o botão **"Lançar a aula de
   hoje"**, que faz o mesmo que o "+" de hoje (abre o modal de nova aula, que
   já vem com a data de hoje, e ao criar entra direto na chamada).

2. **Com aula hoje, tocar na etiqueta abre a chamada dela** (como o toque no
   card hoje). A etiqueta mostra a **técnica** (estêncil), a **posição** e
   **"N presentes"**, e tem três botões de 44 px:
   - **Vídeo** — só existe se a aula tiver `link_youtube`; abre o link numa aba
     nova;
   - **Foto** — abre direto o seletor do celular (galeria ou câmera) e grava
     **com uma confirmação no meio**, pedida pelo Pedro: depois de escolher, a
     tela mostra a **miniatura já comprimida** e **nada é gravado** até ele
     tocar em **"Usar esta foto"** (ou **"Trocar a foto atual"**, quando a
     aula já tem foto). Ao lado: **"Escolher outra"** e **"Cancelar"**;
   - **Editar** — abre o modal de edição de sempre.

   A confirmação vale **só** para o botão Foto da etiqueta (decisão do Claude,
   aprovada pelo Pedro).

3. **O ✕ sai do card.** "Apagar aula" passa para o **fim do modal de edição**,
   com a mesma pergunta de hoje (`Apagar a aula de {data}? Ela vai para a
   lixeira e pode ser restaurada por 7 dias.`, com `DIAS_LIXEIRA`) e o mesmo
   `mandarParaLixeira('aulas', id)`. O card fica com dois toques: o card abre a
   chamada, o ✎ edita. **(decisão do Claude)** Quando o apagar dá certo, o
   modal fecha, a aula sai da lista e o contador da lixeira é atualizado. Se
   der erro, a mensagem aparece **dentro do modal**, que continua aberto. Hoje
   o `erroAula` fica na tela, por baixo do modal, onde ninguém vê. O apagar
   aparece só no modal de **edição**, nunca no de criação.

4. **Duas seções embaixo da etiqueta:**
   - **"Próximas"** — aulas com data **depois** de hoje, da mais perto para a
     mais longe. **Só aparece se houver alguma.** O card de aula futura mostra
     **"Ainda não aconteceu"** no lugar de "N presentes"; fora isso, funciona
     igual (toque abre a chamada, ✎ edita).
   - **"Aulas dadas"** — data hoje ou antes, da mais nova para a mais velha.
   - A aula de hoje que está na etiqueta **não se repete** na lista.
   - **Mais de uma aula hoje** (cuidado pedido pelo Pedro): a etiqueta mostra a
     **última lançada** (maior `created_at`); as outras de hoje entram no topo
     de "Aulas dadas". **Nenhuma aula some da tela.**

5. **Computador (960 px ou mais):**
   - a tela de Aulas usa a **largura toda**, como a de Alunos;
   - a etiqueta vai **de ponta a ponta** no topo, com a **foto e a miniatura do
     vídeo grandes dentro dela**, à direita;
   - "Próximas" e "Aulas dadas" em **grade de cards de 2 a 3 colunas**,
     conforme a largura; cada card como no celular (foto e vídeo lado a lado);
   - **editar abre o modal por cima, centralizado** — não painel fixo ao lado.
     Motivo: aula se edita de vez em quando, uma por vez; painel fixo deixaria
     uma coluna vazia quase sempre e exigiria o "Descartar alterações?" ao
     trocar de aula. Tabela foi descartada porque esconderia a foto e o vídeo.

## 4. O que não pode mudar (inventário de funções de hoje)

Tudo isto existe hoje em `AppShell.tsx` e continua funcionando igual depois da
mudança de arquivo. É a lista de conferência do teste.

- **"+" (FAB) → `ModalAula` de criação** (data padrão `hojeBrasil()`); "Iniciar
  chamada →" grava a aula e **entrega para a `<Chamada />`** sem passo no meio
  (`setModalAula(false); setChamadaAula(aula)`).
- **Toque no card abre a chamada** daquela aula; ao fechar a chamada,
  `recarregar()` atualiza "N presentes".
- **✎ abre o `ModalAula` de edição**: mesmos campos (data, técnica, posição em
  chips de `POSITIONS`, link do YouTube, foto, observações), `update` com
  payload literal (`data, tecnica, posicao, notas, link_youtube, foto_path`),
  `select().single()`, e a lista preserva `presencas` (`{ ...a, ...atualizada }`).
- **Validação do link** (`validarLinkYoutube`, mesmas três mensagens) e os
  dois textos de ajuda do campo, inclusive *"Use 'Não listado'. Vídeo
  'Privado' não gera miniatura nem abre para o aluno."*
- **Foto no modal:** só na edição (precisa do id); grava no upload
  (`onFotoAlterada`, separado de `onEditada`); "Trocar foto" / "Remover" (com o
  `confirm` "não tem lixeira"); erro em caixa `erro`; o input sem `capture`;
  ramifica por `foto_path`, nunca por `foto_url`; o texto "Uma foto por aula…".
- **`FotoAula`:** reassinatura no `onError`, anti-loop pelo par
  `onError`/`onLoad`, caixa "Não foi possível carregar a foto agora.",
  `referrerPolicy="no-referrer"`, e a lista guarda a URL renovada.
- **`MiniaturaYoutube`:** `hqdefault.jpg`, ▶ sobreposto, `onError` e o
  placeholder 120×90 pelo `onLoad` caem no botão "▶ Assistir aula", `id`
  `null` cai no mesmo botão, `stopPropagation` no link.
- **Foto e vídeo lado a lado no card**, foto à esquerda, cada um ocupando a
  linha sozinho quando é o único, nada no lugar quando não há nenhum.
- **Observações** em itálico no card.
- **Erro ao apagar** aparece na tela (hoje `erroAula`); apagar atualiza a lista
  e o contador da lixeira (`contarLixeira()`).
- **Cabeçalho** "AULAS" + "N aulas" (o `N` continua sendo o total carregado).
- **Carga**: a mesma `carregarDados()` (até 50 aulas, `presencas` embutido,
  `foto_url` assinada em lote). Nada de query nova. **Limite conhecido, não
  defeito da G6:** a carga ordena por `data desc`, então as aulas futuras
  entram nas 50 e, se forem muitas, empurram as mais antigas para fora. "Nenhuma
  aula some da tela" vale sobre o que foi carregado, como hoje.
- **Depois de editar**, a lista se atualiza como hoje: junta a aula salva na
  lista (`{ ...a, ...atualizada }`) e chama `startTransition(() =>
  router.refresh())`. Não trocar por `recarregar()`. Mudar a data de uma aula
  para hoje (ou tirar de hoje) move a aula entre a etiqueta e as seções
  sozinho, porque `separarAulas` recalcula a partir de `aulas`.

## 5. Como a tela fica

### 5.1 Celular (até 959 px)

- **Cabeçalho** de sempre (G3): "AULAS", "N aulas", costura dupla.
- **Etiqueta "Aula do dia"** (componente `etiqueta` do `DESIGN.md`: fundo
  `etiqueta`, costura interna, ponteira de 22 px à direita):
  - **com aula:** rótulo "AULA DO DIA" (label) e a posição; técnica em
    estêncil 24 px (uma linha, reticências); "N presentes"; os botões Vídeo,
    Foto e Editar de 44 px, **vazados** como o `DESIGN.md` pede para botão
    dentro da etiqueta, **com ícone e nome escrito** (Regra da Cor com Palavra;
    o protótipo esconde o nome, aqui ele aparece — decisão do Claude). Técnica
    vazia mostra "Aula", como o card hoje;
  - **com foto ou vídeo**, a mesma linha de imagens do card (foto à esquerda,
    miniatura à direita, 110 px) aparece **dentro** da etiqueta, abaixo do
    texto (decisão do Claude: a aula de hoje só existe na etiqueta, então sem
    isso a foto dela sumiria do celular);
  - **sem aula:** "Nenhuma aula lançada hoje" e o botão "Lançar a aula de
    hoje" (cheio invertido dentro da etiqueta, 48 px).
- **Seções "Próximas" e "Aulas dadas":** título de seção em label (12 px,
  caixa alta), com a contagem. "Aulas dadas" sem nenhuma aula: "Nenhuma aula
  dada ainda."
- **Card de aula** (`papel`, borda 1.5 px `controle`, raio 2 px, sem sombra):
  técnica (700, 16 px), data por extenso curta (§6.3), ✎ de 44 px à direita,
  posição em label, "N presentes" ou "Ainda não aconteceu" em etiqueta pequena
  contorno, linha de foto/vídeo, observações.
- **"+" flutuante** continua (lança aula de qualquer data).

### 5.2 Computador (960 px ou mais)

- Largura toda, com 24 px de margem (36 px a partir de 1240 px), mesmos
  números da tela de Alunos. **A página rola inteira**, normal — diferente de
  Alunos, que trava em `100dvh` com duas colunas rolando sozinhas; aqui não há
  coluna fixa (ver §7, CSS).
- **Etiqueta de ponta a ponta**, ponteira de 30 px: texto à esquerda (rótulo,
  técnica em estêncil maior, posição, presentes, botões); **foto e miniatura
  grandes à direita**, lado a lado (altura de referência ~180 px; o builder
  ajusta). Sem foto nem vídeo, o texto ocupa a etiqueta toda.
- **"+ Nova aula"** no cabeçalho (`acoes-topo`), e o "+" flutuante some no
  computador — mesmo padrão de "+ Novo aluno" (decisão do Claude).
- **Grade de cards**: 2 colunas a partir de 960 px, 3 quando couber (algo
  como `repeat(auto-fill, minmax(300px, 1fr))`; o builder decide o número).
- **Modal de aula centralizado** (largura ~520 px, altura máxima ~90vh, com
  rolagem interna e rodapé fixo); no celular continua folha que sobe de baixo.

### 5.3 Confirmação da foto (botão Foto da etiqueta)

Folha própria (celular: sobe de baixo; computador: centralizada), seguindo o
padrão de modal do app.

1. Toque em **Foto** → abre o `<input type="file" accept="image/*">` **sem
   `capture`** (mesma razão de hoje: a galeria não pode sumir).
2. Arquivo escolhido → **comprime no navegador** (`comprimirImagem`, a mesma
   de hoje) enquanto a folha mostra "Preparando a foto…".
3. **Miniatura do resultado comprimido** (o que vai subir de fato), com os
   botões:
   - **"Usar esta foto"** (aula sem foto) ou **"Trocar a foto atual"** (aula
     com foto) — botão cheio;
   - **"Escolher outra"** — reabre o seletor; a escolhida antes é descartada;
   - **"Cancelar"** — fecha sem gravar nada.
4. Confirmou → **sobe o blob já comprimido** (não comprime de novo), grava
   `foto_path`, apaga a anterior depois — a mesma ordem segura de
   `subirFotoAula()` — e a lista recebe `foto_path`/`foto_url` como o
   `onFotoAlterada` faz hoje. Folha fecha.
5. **Enquanto envia:** "Enviando…", os três botões desligados e a folha não
   fecha pelo pano escuro (decisão do Claude: cancelar no meio do upload
   deixaria o resultado incerto).
6. **Erro de leitura** (HEIC que o navegador não lê): a mesma mensagem de hoje
   aparece na folha, com "Escolher outra" e "Cancelar". **Erro de envio:**
   mensagem na folha, miniatura continua, "Usar esta foto" vira nova
   tentativa.
7. A URL de objeto da miniatura (`URL.createObjectURL`) é liberada ao fechar.

## 6. Regras de dado (puras, testadas)

### 6.1 Separar as aulas

Uma função pura, sem import, testada em `scripts/*.test.mjs` como
`lib/busca.ts` e `lib/datas.ts`:

```
separarAulas(aulas, hoje) → { doDia: Aula | null, proximas: Aula[], dadas: Aula[] }
```

- `doDia`: entre as aulas com `data === hoje`, a de maior `created_at`;
  empate ou `created_at` nulo → a que vier primeiro na entrada (decisão do
  Claude; a coluna tem `default now()` desde a 001).
- `proximas`: `data > hoje`, ordem **crescente** de data (empate: `created_at`
  crescente).
- `dadas`: as outras de hoje (sem a `doDia`), depois `data < hoje`, ordem
  **decrescente** de data (empate: `created_at` decrescente).
- **Invariante testado:** `doDia` + `proximas` + `dadas` = a entrada inteira,
  sem repetir e sem perder nenhuma.
- Datas comparadas como texto `'AAAA-MM-DD'` (regra do `CLAUDE.md`), nunca
  `new Date('AAAA-MM-DD')`.

### 6.2 Funções do YouTube

`validarLinkYoutube`, `extrairIdYoutube` e `HOSTS_YOUTUBE` saem do
`AppShell.tsx` para um arquivo puro em `lib/` e ganham testes, **sem mudar uma
linha de comportamento**: os casos do `CLAUDE.md` (`watch?v=`, `youtu.be/`,
`/shorts/`, `/embed/`, `&t=`/`?si=` ignorados, `studio.youtube.com` → `null`,
URL inválida → `null`, as três mensagens de erro).

### 6.3 Data no card (decisão do Claude)

Hoje o card mostra a data crua (`2026-10-23`). Passa a mostrar curta e por
extenso, em português (ex.: "sex, 23 out"; com ano quando não for o ano
corrente). Função pura em `lib/datas.ts`, **sem `new Date('AAAA-MM-DD')`**
(o defeito de meia-noite UTC da G4), testada nos três fusos como as outras de
`lib/datas.ts`. Os textos de confirmação (apagar) continuam com a data como
hoje.

### 6.4 Foto: comprimir e enviar separados

Para a confirmação mostrar o que vai subir, `lib/foto-aula.ts` passa a expor
o envio de um blob **já comprimido** separado da compressão. `subirFotoAula()`
continua existindo com a mesma assinatura e o mesmo comportamento (comprime +
envia), e o modal de edição continua usando ela. A ordem segura (sobe →
grava `foto_path` → apaga a antiga; falha no banco apaga o recém-subido) é a
mesma nos dois caminhos — **um código só**, não duas cópias.

## 7. Arquivos (proposta; o plano detalha)

- `components/aulas/`: a tela (etiqueta + seções + grade), o card, o
  `ModalAula`, a `FotoAula`, a `MiniaturaYoutube` e a folha de confirmação da
  foto. A `Chamada` **fica** no `AppShell.tsx`. `FotoAula` e `MiniaturaYoutube`
  saem com o comentário que explica o anti-loop e o placeholder 120×90.
- **Estilo:** como na G5, os componentes de `components/aulas/` usam classes
  de um `app/aulas.css` novo (precisam de media query para as duas versões e
  para o modal centralizado), com `var(--token)` apenas — `npm run checar-cores`
  passa. As duas cores fixas do ▶ continuam com a marca `cor-ok`.
- **Largura:** `.conteudo.larga` hoje traz `height: 100dvh` e as duas colunas
  rolando da tela de Alunos. Aulas precisa da largura sem a trava de altura:
  uma classe à parte (ou separar "larga" de "trava a altura"), sem mudar nada
  em Alunos.
- **Estado continua no `AppShell`**: `aulas`, `setAulas`, `chamadaAula`,
  `modalAula`, `aulaEdicao`, `recarregar`, `contarLixeira`. A tela recebe
  callbacks, como `TelaAlunos`.
- Restos da G3 nas folhas de Aulas (modal, confirmação da foto):
  `touch-action: manipulation` e `overscroll-behavior: contain`.
- Campos de 16 px já estão no modal desde a G5; os novos nascem assim.

## 8. Teste (banco real — o mesmo do site no ar)

Linha de base antes de começar: contagem de `alunos`, `aulas`, `presencas`,
`graduacoes` (a última conhecida: 33/5/59/29) **e o número de objetos do
bucket `aulas-fotos`**. No fim, tudo igual.

1. 390 px e 1280 px, kimono branco e kimono preto, cada passo abaixo.
2. Sem aula hoje: etiqueta vazia; "Lançar a aula de hoje" abre o modal com a
   data de hoje e cai na chamada.
3. Criar `ZZ-TESTE-G6` hoje; colar um link do YouTube **Não listado**; ver a
   miniatura com ▶ no card e na etiqueta; o botão Vídeo abre o vídeo.
4. Foto pela etiqueta: escolher → miniatura → **Cancelar** (conferir no banco
   e no bucket que nada mudou) → de novo → "Usar esta foto" (conferir
   `foto_path` no banco e o objeto no bucket) → de novo → "Trocar a foto
   atual" (o objeto antigo sumiu do bucket).
5. Foto pelo modal de edição: grava na hora, como hoje.
6. Segunda aula de teste hoje: a etiqueta mostra a última lançada; a outra
   aparece no topo de "Aulas dadas".
7. Aula de teste com data futura: aparece em "Próximas" com "Ainda não
   aconteceu"; não muda nenhum número do Início nem da ficha de nenhum aluno.
8. Card: toque abre a chamada; ✎ edita; não existe ✕.
9. Apagar pelo fim do modal: pergunta, vai para a lixeira, contador da
   lixeira sobe.
10. **Limpeza:** antes de apagar cada aula de teste, **remover a foto pelo
    modal** (a purga da lixeira não apaga o arquivo do bucket — pendência 3 do
    `CLAUDE.md`). Depois, apagar e o Pedro apaga de vez; se alguma presença foi
    marcada numa chamada de teste, ela sai junto pelo cascade só na purga, então
    **desmarcar antes**. Conferir a linha de base e o bucket.
11. `npx tsc --noEmit`, `npm run testar`, `npm run checar-cores` limpos.

## 9. O que fica para o builder

Nomes dos componentes e das classes; tamanhos exatos da etiqueta no
computador; o ícone de cada botão (os do protótipo são `play`, `camera`); a
animação da folha (a mesma de 220 ms dos outros modais); como dividir em
tarefas e commits; o texto exato de "Preparando a foto…"/"Enviando…".
