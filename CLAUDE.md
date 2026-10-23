# CLAUDE.md — GrauMestre

Memória de trabalho para sessões futuras do Claude Code neste projeto. Leia antes de mexer em qualquer coisa.

## O que é

App de gestão de alunos e aulas de jiu-jítsu, para **um professor faixa preta**, usado **no tatame, no celular, com pressa**. Não é um SaaS multi-academia; é a ferramenta de trabalho de uma pessoa.

**Filosofia central: funcionalidade antes de estética.** Se a escolha for entre uma tela mais bonita e uma tela que resolve em menos toques, ganha a que resolve. A chamada rápida é o exemplo canônico: uma linha por aluno, um toque, salva na hora, sem botão "Salvar" — porque o professor sai da tela no meio e o que já foi tocado tem que estar no banco.

## Stack e decisões conscientes

- **Next.js 14 (App Router) + Supabase + Tailwind**, deploy na Vercel a partir da `main` (`PriceIA/graumestre`).
- **Supabase client-side direto, sem rotas de API.** O app fala com o PostgREST do browser. Não crie `app/api/*` para funcionalidade nova. **Única exceção: `app/api/ping/route.ts` (G1, migration 015)**, chamada só pelo Vercel Cron (`vercel.json`, `0 9 */5 * *`) para o projeto Supabase não ser pausado por inatividade. Exige `Authorization: Bearer $CRON_SECRET` (variável só no escopo Production da Vercel e no `.env.local`; sem ela a rota recusa tudo), usa só a chave pública e chama `rpc('ping')` — função que devolve `1` sem ler tabela, necessária porque o `anon` não tem `SELECT` em nenhuma tabela. O cron só roda no deploy de Produção (`main`).
- **`components/AppShell.tsx` usa inline styles, não classes Tailwind.** É o componente principal e concentra quase toda a UI. Siga o padrão dele ao editá-lo — não misture `className` do Tailwind lá dentro. **As cores vêm do objeto `theme` de `lib/cores.ts`, que devolve `var(--token)`** (os tokens vivem em `app/globals.css`, nos dois temas) — nunca escreva valor de cor ali; ver a seção "Tema e navegação". O Tailwind é usado no `DashboardProfessor` e nos `components/ui/*` (shadcn), que são outra geração de código. **Exceção desde a G5:** a tela de Alunos (`components/alunos/`) e os campos (`components/comum/Campos.tsx`) usam classes de `app/alunos.css` e `app/comum.css`, porque precisam de media query; ver a seção "Tela de Alunos (G5)".
- **Login via Supabase Auth, client-side.** `LoginGate` no topo do `app/page.tsx`: sem sessão, nada do app é montado. A tela pede **apelido e senha**, não e-mail — o `LoginGate` monta `apelido@graumestre.app` antes de chamar `signInWithPassword`, porque é o apelido que o professor lembra e digita rápido no celular. **A conta em Authentication > Users tem que ser criada exatamente nesse formato.** O domínio não precisa existir nem receber e-mail; é só identificador. Não há cadastro público nem "esqueci a senha". O client usa `persistSession: true` e `autoRefreshToken: true`; sem isso a sessão morre a cada reload.
- **O que protege o banco hoje é o `GRANT`, não a RLS** (conferido em produção em 2026-10-21, G0). A migration 009 criou policies `authenticated` e revogou `anon`, e o `anon` de fato não lê nem escreve nada. **Mas `alunos`, `aulas`, `graduacoes` e `presencas` estão com a RLS DESLIGADA** (`relrowsecurity = false`; só `professor_perfil` está ligada) — as policies existem e são inertes. Na prática o efeito de hoje é o mesmo (toda conta logada vê tudo; só existe a conta do professor), mas **a RLS tem que ser ligada, com as policies certas e testada, antes de existir qualquer conta de aluno (G9)**. Não aplicar `enable row level security` avulso: com as policies atuais `using (true)` ele não protegeria nada de aluno. A chave pública no `.env` é esperada e correta — ela só identifica o projeto.
- **A carga de dados é client-side.** O `app/page.tsx` é um server component fino que só monta o gate e o `AppShell`; quem busca é o `AppShell` ao montar, já com sessão. Buscar no servidor voltaria vazio — o token vive no browser.

## Padrão obrigatório: whitelist explícita de colunas

**Nunca espalhe um objeto de estado inteiro num `insert`/`update`.** Sempre monte o payload listando as colunas, uma a uma.

O motivo é um bug real que isso já custou: o objeto do aluno carrega campos **derivados** que não são colunas da tabela — `total_presencas`/`total_aulas` vêm da view, `ultima_graduacao_data`/`historico_graduacoes` são montados no carregamento. Mandar qualquer um deles no update faz o PostgREST rejeitar a request inteira com **PGRST204** e trava a edição por completo — inclusive quando o valor é um array vazio, porque a validação é sobre as *chaves* do payload, não sobre os valores.

Whitelist em vez de descartar campo a campo: assim um campo derivado novo não volta a quebrar o save silenciosamente. Ver `COLUNAS_ALUNO` em `lib/alunos.ts`, e os payloads literais de aula e presença.

## Armadilha do banco: a view `alunos_frequencia`

Ela é `select a.*`, e o Postgres **expande isso na criação**, congelando a lista de colunas daquele instante. Toda migration que adicionar coluna em `alunos` precisa **dropar e recriar a view** (e refazer o `grant`), senão a coluna existe na tabela e nunca chega no app. Já mordeu duas vezes — ver `005_soft_delete.sql` e `008_afastado_manual.sql`.

**Toda recriação da view faz `revoke all on alunos_frequencia from anon, authenticated, public` antes do `grant select ... to authenticated`** (padrão desde a `016`). O `create view` pode receber as permissões padrão do Supabase e reabrir para o `anon` o que a 009 fechou; e a view `select a.*` é atualizável pelo Postgres, então o `authenticated` fica só com `SELECT`. Depois do Run: conferir colunas por `information_schema.columns` e privilégios por `has_table_privilege` (consultas no fim da `016`), e o md5 das contagens antes/depois quando a mudança não deve alterar resultado.

## Regra de ouro do processo

**Nunca avance de fase sem a anterior funcionando e commitada.** Na prática, em toda sessão:

1. Ler o código real antes de propor — não assumir estrutura de memória.
2. Apresentar um plano curto antes de codar, e perguntar quando a decisão for do usuário (navegação, modelagem de dado) em vez de supor.
3. Migration nova é aplicada **pelo usuário** no Supabase SQL Editor. O código fica pronto e os testes esperam por isso.
4. `npx tsc --noEmit` limpo e `npm run dev` subindo.
5. **Testar manualmente e reportar teste por teste, antes de commitar.** Verificar no banco, não só na tela. Se um teste falha, reportar e parar — não commitar por cima.
6. Dado de teste criado durante a verificação é limpo no fim, e o estado do banco conferido contra a linha de base.
7. **Atualizar este arquivo e o `CHANGELOG.md` antes do commit final — não é opcional, faz parte de "pronto".** A documentação deixou de ser mantida à mão fora do código: ela vive no repositório e se atualiza sessão a sessão, junto com a mudança que a tornou verdadeira. Documentação que envelhece em silêncio é pior do que documentação nenhuma, porque a sessão seguinte confia nela.
8. **Commit não é "pronto" — `git push` para a `origin` e conferir que a Vercel disparou o deploy a partir da `main` são.** Em 2026-09-02, 11 commits de um lote inteiro (as sete etapas de agosto, mais documentação) ficaram um dia inteiro parados só no `main` local: o processo terminava no commit, ninguém verificava o push, e `origin/main` continuou congelado na migration 013 sem que nada acusasse o atraso. Depois de cada commit — o final da sessão, ou qualquer ponto em que o trabalho pareça fechado — rode `git push` e confirme com `git status`/`git log origin/main..main` que não sobrou nada; depois confira (`vercel ls` ou o dashboard) que o deploy de produção saiu a partir daquele commit.

## Branches e site no ar

Desde a G0 (2026-10-21) o projeto está no **lote v2** (`docs/ROADMAP.md`).

- **`main` é o site no ar** (Vercel, produção). Só recebe merge quando o Pedro disser. Única exceção que foi direto para a `main`: a G1 (ping do Supabase), publicada em 2026-10-22 (commit `039b3eb`; no `desenvolvimento` é o `bbae981`, mesmo conteúdo).
- **O trabalho acontece no branch `desenvolvimento`**, com push a cada commit. Para esse branch, a regra 8 acima vale com a troca de alvo: `git push` e conferir `git log origin/desenvolvimento..desenvolvimento` vazio; o deploy de **produção** só é conferido quando algo entra na `main`.
- **O banco é um só, o mesmo do site no ar.** Qualquer teste no `localhost` ou em preview escreve nos dados reais — dado de teste é limpo no fim e a contagem conferida contra a linha de base (33 alunos, 5 aulas, 59 presenças, 29 graduações em 2026-10-21).
- **Cada push no `desenvolvimento` gera um deploy de Preview na Vercel** (confirmado na G0: ambiente `Preview`, status `success`; a última produção continua sendo a da `main`). Se o Preview usa as mesmas variáveis `NEXT_PUBLIC_SUPABASE_*` da produção, ele fala com o banco real — **não confirmado** (exige olhar Vercel → Settings → Environment Variables, escopo Preview); até alguém conferir, trate o Preview como produção para fins de dado de teste.
- **Migration é avisada no plano, antes, e aplicada pelo Pedro** no SQL Editor. Só acrescenta (nunca apaga nem renomeia coluna).
- **Backup antes de qualquer migration:** `scripts/backup-graumestre.mjs` (tabelas por API + fotos) e `pg_dump` (ver o cabeçalho do script). O backup vive **fora do repositório** (`C:\Backups\graumestre\<data>\`) e contém hash de senha e dados de crianças — nunca vai para git, nuvem ou e-mail. O `.emptyFolderPlaceholder` de 0 bytes que o painel do Supabase deixa numa pasta esvaziada não conta como órfã nem como não-JPEG; aparece numa linha própria do manifesto.
- **O cadastro público do Supabase fica sempre desligado.** Conta de aluno só nasce por convite (G10), e nenhum convite funciona antes da RLS por papel estar pronta e testada (G9).

## A lixeira apaga de verdade (migration 011)

Até a 010 o soft delete só carimbava `deleted_at` e escondia da tela: passados os 7 dias o item sumia da aba Lixeira, mas a linha ficava no banco para sempre. A interface prometia restauração "por 7 dias", o que promete também que depois disso some — e não sumia.

`purgar_lixeira()` roda todo dia às **04:00 UTC** (≈01:00 em Brasília) via `pg_cron`, apagando fisicamente `alunos`, `aulas` e `graduacoes` com `deleted_at` mais velho que 7 dias.

Duas coisas para não esquecer:

- **O prazo está escrito duas vezes**: `DIAS_LIXEIRA` em `lib/lixeira.ts` (o que o professor vê) e `interval '7 days'` na função (o que o banco apaga). Mexeu num, mexa no outro.
- **Aqui o `on delete cascade` finalmente dispara.** O app nunca apagava linha, então as FKs da 001 estavam dormentes. Purgar um **aluno** leva junto todas as presenças e **todo o histórico de graduações dele — inclusive graduações que nunca foram para a lixeira**. É o certo, mas não é óbvio lendo só o app, onde apagar aluno e apagar graduação são ações separadas.

A função é `revoke`ada de `anon`/`authenticated` de propósito: toda função em `public` nasce executável por PUBLIC e o PostgREST a publicaria como RPC — exclusão definitiva a um `fetch` de distância. Só o dono (`postgres`, que é quem o cron usa) executa.

## Foto da aula: upload real, bucket privado (migration 012)

Uma foto por aula, tirada com a turma, enviada do celular. **Não confunda com a foto do aluno** (seção seguinte): lá é URL externa colada à mão, aqui é arquivo nosso.

- **O bucket `aulas-fotos` é privado**, e isso decide o resto. A escolha foi por privacidade, não por custo: são fotos de uma turma que inclui crianças, e bucket público seria obscuridade (URL inadivinhável), não proteção. O volume é irrelevante — uma foto por aula, ~10 MB/ano.
- **A coluna se chama `foto_path`, não `foto_url`, porque guarda caminho e não URL.** Com bucket privado não existe URL estável para guardar: ela é assinada na leitura e vence em 1h. `foto_url` é **campo derivado**, montado em `lib/carregar-dados.ts` como `ultima_graduacao_data` — e, como todo derivado, **nunca pode entrar em payload de update** (é o PGRST204 de sempre).
- **As URLs são assinadas em lote.** A listagem traz até 50 aulas; `assinarUrls()` faz uma chamada só — 1 request extra no carregamento, com 1 ou com 50 fotos, e nenhum quando não há foto alguma.
- **A URL vence em 1h, e o componente `FotoAula` se recupera disso sozinho.** A imagem já pintada sobrevive ao vencimento (o que expira é o direito de baixar de novo), mas se o browser descartar o cache com o app aberto, o próximo pedido leva 403. O `onError` reassina e repõe. **O anti-loop é o par `onError`/`onLoad`**: uma tentativa por exibição bem-sucedida, rearmada só no `onLoad`. Objeto apagado do bucket erra, tenta uma vez, erra de novo e para — nunca dispara `onLoad`, então nunca rearma. Rearmar quando a prop muda, em vez do `onLoad`, seria exatamente o ciclo infinito.
- **O modal ramifica por `foto_path`, nunca por `foto_url`.** A URL é derivada e pode falhar sozinha; ramificar por ela faria uma aula com foto aparecer como "adicionar foto" num tropeço de assinatura, e deixaria o botão Remover inalcançável justo aí.
- **A foto grava na hora do upload, não no "Salvar alterações"** — mesma razão da chamada rápida: o professor sai da tela no meio. Por isso o modal tem `onFotoAlterada`, separado de `onEditada`: o segundo desmonta o modal, e quem acabou de escolher uma foto ainda está editando.
- **A compressão é obrigatória e roda no client** (`lib/comprimir-imagem.ts`): canvas nativo, 1200px na maior dimensão, JPEG 0.75, alvo 150-300 KB. Sem lib nova — o `sharp` do projeto é devDependency e roda no Node, não no browser. `createImageBitmap(..., { imageOrientation: 'from-image' })` aplica a orientação EXIF; sem isso a foto tirada em pé sobe deitada. O bucket ainda tem `file_size_limit` de 2 MB e `allowed_mime_types` só de JPEG, como rede de segurança do lado do servidor.
- **O input de arquivo não usa `capture`** de propósito: com ele o Android abre direto a câmera e tira a galeria da jogada, e subir foto de uma aula de semana passada deixa de funcionar.
- **HEIC do iPhone tem três desfechos, e nenhum é silencioso.** (1) O iOS converte para JPEG no próprio `<input>` — **é o que acontece no aparelho do professor, verificado em 2026-08-11**; (2) o browser decodifica HEIC e o nosso `toBlob` reencoda para JPEG; (3) o browser não decodifica, o `createImageBitmap` rejeita e o professor vê *"Não foi possível ler esta imagem (formato não suportado pelo navegador). Tente tirar uma foto nova ou salvar como JPEG."* — **nada sobe e nada é gravado**, porque o upload só acontece depois de a compressão retornar. Como o `toBlob` sempre produz JPEG e o upload fixa `contentType: 'image/jpeg'`, o formato de entrada nunca viola o `allowed_mime_types` do bucket. A mensagem **não** sugere trocar câmera por galeria: não está confirmado que o caminho de escolha muda o resultado, e mandar repetir o que já falhou é pior do que não sugerir nada.
- **A coluna é em `aulas`, então a view `alunos_frequencia` NÃO precisou ser recriada.** Confirmado no DDL antes de codar, não presumido: a armadilha do `select a.*` vale para colunas em `alunos`; a view só toca `aulas` dentro de subqueries com `count(*)` e colunas nomeadas, nunca `au.*`.

## Graus: o teto do art. 4.1.2 e o ritmo do professor (migration 013)

Duas coisas que **parecem a mesma** e não são. Confundi-las é o erro que esta seção existe para prevenir.

### O teto de 4 graus sempre esteve certo — não reabra a suspeita

Branca, azul, roxa e marrom são "faixa lisa + 4 graus" (art. 4.1.2 I): **não existe 5º grau** em nenhuma delas; o que vem depois do 4º é a promoção para a próxima cor. A preta é o caso à parte (art. 4.1.2 II), com o sistema de 1–9 em `GRAUS_PRETA`.

`grausMaximos()` sempre devolveu isso corretamente, e o seletor de graus (`Array.from({ length: max + 1 })`) nunca renderizou um botão "5". Uma auditoria em 2026-08-12 procurou o bug e **não encontrou** — está registrado aqui para a próxima sessão não gastar a verificação de novo.

**O buraco real era outro**: o botão de faixa chamava `set('faixa', fx)` sem tocar em `graus`, então rebaixar um preta 6º grau para marrom gravava "marrom 6º grau". Duas coisas conspiravam para esconder isso — o check do banco é `graus between 0 and 9`, **global e não por faixa**, então o Postgres aceitava; e os botões de grau re-renderizam 0–4, então nenhum ficava destacado e o valor inválido não aparecia em lugar nenhum da tela. Hoje faixa e graus são ajustados no mesmo `setForm`, com `Math.min(f.graus, grausMaximos(fx))`.

**`proximaFaixa(faixa, infantil)` precisa do segundo argumento**, e não é preciosismo: **`branca` está em `FAIXAS_INFANTIS` e em `FAIXAS_ADULTAS`**. Deduzir a lista pela faixa sozinha (`FAIXAS_INFANTIS.includes(faixa)`) responderia "cinza e branca" para todo aluno branca adulto — errado justamente na faixa mais comum do app. Quem chama já sabe: é o mesmo `ehInfantil()` que decide quais faixas o seletor mostra.

### O ritmo é sugestão do professor, e mora fora do motor da IBJJF

`professor_perfil.meses_entre_graus` (default 5, editável no Perfil do Professor) é o **ritmo de trabalho dele**: de quantos em quantos meses costuma dar um grau. O art. 4.1.3 diz que, até a marrom, o sistema de graus fica a critério de cada Professor — é essa brecha que a coluna preenche.

**Não é, e nunca pode virar, o tempo mínimo de permanência por faixa** (art. 3.1.3 — 2 anos para virar azul, etc.), que é exigência da federação e ninguém altera.

A separação é **lógica antes de ser visual**, e é por isso que existe `lib/ritmo-graus.ts` separado de `lib/regras-ibjjf.ts`: se as duas morassem no mesmo arquivo, a próxima sessão trataria uma como a outra. Na tela o mesmo cuidado — o bloco de ritmo é tracejado e rotulado "SUGESTÃO SUA", e o bloco de exceções nomeia a IBJJF e o artigo. **Se mexer num, olhe o outro**: o valor do contraste é a única coisa que impede o professor de ler a sugestão como regra da federação.

`sugestaoProximoGrau()` devolve `null` em dois casos, e ambos são decisão de produto, não falta de dado:

- **Faixa preta.** Lá os intervalos são da IBJJF (3/5/7/10 anos). Sugerir "5 meses" ao lado disso contradiria a federação na cara do professor.
- **Já no teto de graus.** No 4º grau o próximo passo é mudar de cor, e quem diz isso é o painel "Próximo passo" — não o cálculo de ritmo.

A coluna é em `professor_perfil`, tabela que a view `alunos_frequencia` **nunca referencia** (confirmado no DDL da 010, não presumido), então a armadilha do `select a.*` não foi acionada e a view não precisou ser recriada. Se um dia o ritmo virar por aluno, aí sim a view entra na conta.

### O ritmo em MESES não alimenta "Prontos para graduar" — o critério de PRESENÇA, desde a migration 014, alimenta

Até a `013` isto era simples: nada do ritmo do professor tocava o card. A
`014` mudou isso de propósito — ver a seção seguinte (linha do tempo completa
no `CHANGELOG.md`). A distinção que importa hoje não é mais "ritmo vs. card":
é **qual preferência do professor**, porque `professor_perfil` guarda duas,
lado a lado, e só uma alimenta o card.

- **`meses_entre_graus` continua isolado.** Só é lido por `sugestaoProximoGrau()`
  (`lib/ritmo-graus.ts`), importado num único lugar — o bloco tracejado
  "sugestão sua" do modal do aluno em `AppShell.tsx`. Não entra em
  `alertaGraduacao()`, não influencia o card, o selo do crachá nem o chip
  "Prontos".
- **`presencas_por_grau` alimenta o card.** É o critério de
  `prontoParaProximoGrau()` (também em `lib/ritmo-graus.ts`), que
  `alertaGraduacao()` chama para decidir o alerta de GRAU — a fonte do card
  "Prontos para graduar" na home, do selo do crachá e do chip "Prontos" (é a
  mesma função nos três lugares, ver seção abaixo).

As duas continuam preferência do professor (art. 4.1.3), nunca regra da
IBJJF — nenhuma migrou para `lib/regras-ibjjf.ts`. A diferença é só "qual
delas o card lê", e é intencional: meses é um lembrete solto no modal do
aluno, presença é o critério de prontidão de verdade, porque é o que o
professor de fato controla lançando a chamada.

### Migration 014 — o alerta virou GRAU por presença, não mais FAIXA por tempo zero

O card "Prontos para graduar" listava quase a turma inteira. Não era conta
errada de tempo: a IBJJF não exige tempo nenhum na faixa branca (art. 3.1.3
I), então `tempoMinimoAnos()` sempre devolveu `0` e `prontoParaProximaFaixa()`
sempre devolveu `true` para todo branca adulto desde a matrícula — ruído por
construção, não bug de cálculo. A investigação está fechada em
`docs/PLANO-ATUAL.md` com a citação do artigo; não reabrir.

`alertaGraduacao()` (`lib/alertas-graduacao.ts`) passou de `string | null`
para um tipo discriminado:

```ts
type Alerta =
  | { tipo: 'grau';  msg: string; proximoGrau: number }
  | { tipo: 'faixa'; msg: string; faixaAlvo: Faixa }
  | null
```

Nesta ordem:

1. **Faixa preta** — intocado: os intervalos entre graus são da IBJJF
   (`GRAUS_PRETA`), nunca presença.
2. **Abaixo do teto de graus** — alerta de `grau`, só pelo critério de
   presença (`prontoParaProximoGrau()`, `lib/ritmo-graus.ts`): presenças reais
   desde a última graduação registrada `>= professor_perfil.presencas_por_grau`
   (default 48). Vale para infantil também — o professor decide os graus das
   crianças do mesmo jeito, e o próprio teto (3 graus infantil = 144
   presenças) já protege da mesma forma que protege o adulto.
3. **No teto de graus** (`grausMaximos()`) — alerta de `faixa`, e só quando é
   verdade de verdade: tempo mínimo da IBJJF **e** idade mínima válida
   (`idadeMinimaValida()` — checagem que não existia antes desta migration).

Três call sites leem o mesmo retorno — `LinhaAluno` (selo/tooltip, desde a G5; era o `AlunoCard`) e a `FichaAluno` (selo e motivo),
`aplicarFiltros` (chip "Prontos") e `DashboardProfessor` (lista da home,
contador do hero) — e recebem `presencasPorGrau` (`professor?.presencas_por_grau
?? PRESENCAS_POR_GRAU_PADRAO`) do `AppShell`, para os três concordarem sobre o
mesmo critério.

**A contagem é SQL, na view `alunos_frequencia`, nunca no client.**
`lib/carregar-dados.ts` busca só as últimas 50 aulas; contar 48 presenças
exige olhar pelo menos 48, e o `.limit(50)` quebraria a conta exatamente no
ponto em que ela importa. Duas colunas novas: `presencas_desde_graduacao` e
`aulas_desde_graduacao` (esta última ainda não consumida por nenhum código —
preparada para o painel do sininho mostrar "31 de 40 aulas" no futuro, para
não dropar e recriar a view de novo só por isso). Data-base:
`greatest(coalesce((select max(data) das graduações não deletadas do aluno), a.inicio), a.inicio)`.
O `greatest(..., a.inicio)` por fora é o mesmo piso que a `010` já aplica em
`total_presencas`/`total_aulas`, pela mesma razão: aluno vindo de outra
academia tem graduação registrada com data anterior à matrícula aqui — é para
isso que existem `veio_de_faixa_juvenil` e `status_graduacao = 'provisorio'`
— e sem o piso a janela "desde a graduação" contaria aulas anteriores a ele
existir nesta turma. Removê-lo achando redundante reabre exatamente o que a
`010` fechou para o denominador geral.

**Linha de base no banco em 2026-08-30**: 3 aulas lançadas, presença máxima 1
em toda a turma, zero alunos prontos. A lista fica vazia por meses até
acumular chamada de verdade — é o comportamento esperado, não um alerta
quebrado; o professor promove na mão nesse meio tempo. Quem ler isto daqui a
alguns meses e achar a lista sempre vazia estranha: comparar `presencas_por_grau`
contra `presencas_desde_graduacao` de um aluno específico antes de suspeitar
de bug.

## Foto do aluno: URL externa, com `referrerPolicy`

`foto_url` é uma URL colada à mão — não há Storage no projeto. Todo `<img>` que renderiza foto de aluno leva `referrerPolicy="no-referrer"`, senão o host da imagem recebe o endereço do app a cada carregamento. São **três** pontos: a linha da lista (`LinhaAluno`, em `components/alunos/ListaAlunos.tsx`; era o `AlunoCard` até a G5; uma URL quebrada cai na inicial), a linha da chamada (`Chamada`, em `AppShell.tsx`) e a lista do painel de prontos (`PainelProntos`, em `AppShell.tsx`, ver seção abaixo — substituiu o antigo `AvatarImage` do "Prontos para graduar" quando esse card saiu do `DashboardProfessor.tsx` para o Painel de prontos). O `<img>` do hero fica de fora conscientemente: é asset local, não há terceiro para vazar. Ponto novo que renderize foto nasce com o atributo.

## Painel de prontos para graduar (sininho) — migration 014 completa a UI

O `<Bell>` do header do `DashboardProfessor` virou `<button>` com badge — bolinha vermelha com a contagem, só quando `qtdProntos > 0` — e abre `PainelProntos`. O painel **mora no `AppShell.tsx`, não no `DashboardProfessor`**, pelo mesmo motivo de sempre: é um modal, e os modais do app vivem todos no `AppShell` com inline styles e o mesmo padrão de bottom sheet (`visible`/`setTimeout(onClose, 220)`). Um painel em Tailwind dentro do `DashboardProfessor` seria um padrão de modal à parte — CLAUDE.md já pedia consistência, e foi o precedente seguido pelo `<Menu>` no Menu lateral (ver seção abaixo).

A lista de prontos é computada **uma vez**, no `AppShell` (mesma `alertaGraduacao()` de sempre). `DashboardProfessor` recebe só `qtdProntos` — usado no badge **e** na estatística "Prontos p/ graduar" do hero, de propósito o mesmo número nos dois lugares — e `onAbrirProntos`.

**Selecionar um aluno fecha o painel na hora**, sem esperar o fade de saída, e abre o modal dele já na aba de graduação — mesmo padrão que `ModalAula` já usa ao entregar para `<Chamada />` (`setModalAula(false); setChamadaAula(aula)`). Evita dois overlays empilhados; não é preciosismo, é o que já existia no código antes deste painel.

**O estado vazio é obrigatório, não ausência de UI.** Com a linha de base de 3 aulas no banco (ver a seção "Graus" acima), o painel fica vazio por meses — um sininho que abre e não mostra nada volta a parecer decoração, exatamente o problema que este estado vazio existe para resolver. O texto nomeia o critério ao vivo: "Nenhum aluno com N presenças desde o último grau. O app conta a partir das aulas lançadas na chamada" (N = `presencas_por_grau`).

Cada item da lista mostra, abaixo do motivo (`alerta.msg`), uma linha de evidência — não é barra de progresso, é a justificativa de quem já está ali: para alerta de **grau**, "X de Y presenças desde o último grau" (recalculado com `prontoParaProximoGrau()`); para alerta de **faixa**, "Tempo mínimo da faixa cumprido" (só chega ali com tempo IBJJF e idade já validados por `alertaGraduacao()`).

## Menu lateral (hambúrguer)

O `<Menu>` do header ganhou `onClick` e abre `MenuLateral`, mesmo padrão de modal dos outros — `AppShell.tsx`, `visible`/`handleClose` com fade de 220ms — mas entra **pela esquerda**, não de baixo: é o lado do ícone que abriu. Quatro itens: Perfil do Professor, Lixeira, Instalar no celular (condicional) e Sair.

**`tab` continua com o tipo `'alunos' | 'aulas' | 'lixeira'`** — não virou estado separado para a lixeira. A barra de abas só deixou de iterar o terceiro valor (`(['alunos', 'aulas'] as const).map(...)`); o item "Lixeira" do menu faz `setTab('lixeira')` como sempre fez o clique na aba. Toda a lógica que já checava `tab === 'lixeira'` — o conteúdo renderizado e o FAB escondido (`tab !== 'lixeira'`) — continuou correta sem precisar mudar uma linha. **Esse é o padrão a seguir**: quando um destino sai da barra de navegação visível mas o componente de destino continua existindo, prefira reaproveitar o estado que já o seleciona a duplicar em uma flag nova — a duplicação é como duas fontes de verdade nascem, e este projeto já pagou caro por isso (ver a migration 010 e a seção "Afastado: por aulas perdidas..." abaixo).

**A `Lixeira` precisou de cabeçalho próprio.** Sem aba destacada acima dela (a barra mostra só ALUNOS/AULAS, nenhum ativo), nada na tela dizia "você está na lixeira" nem como sair — um bug real, achado só ao abrir a tela, que `tsc` e a suíte de tipos não pegam porque não é erro de tipo. `Lixeira` ganhou `onVoltar` e uma linha "‹ Lixeira" tocável no topo (chama `setTab('alunos')`), presente também no estado de carregamento — não só depois da lista chegar.

**"Instalar no celular" é um segundo consumidor de `lib/instalacao.ts`, independente do `BannerInstalar`.** `MenuLateral` assina `eventoAtual()`/`inscrever()` por conta própria, com o mesmo cuidado: só a captura mora cedo, no layout; cada exibição (banner, agora também o item de menu) lê o que já foi capturado, e cada uma decide sozinha se se mostra. O item some quando não há evento (iOS, ou já instalado) — mesma lógica do banner, código duplicado de propósito porque são exibições independentes, não uma reexportando a outra.

**"Sair" e o identificador da conta saíram do `ModalProfessor`, foram embora juntos, para o rodapé do `MenuLateral`.** Era o único lugar do app que mostrava com qual conta o professor está logado — não podia simplesmente sumir junto com o botão. Mostra o **apelido**, não o e-mail inteiro (`email.split('@')[0]`): é o que o professor digita no login (`LoginGate` monta `apelido@graumestre.app`), e o domínio é só identificador, não recebe e-mail de verdade — mostrá-lo completo seria expor um detalhe de implementação sem utilidade para quem lê.

`ProfessorCard` saiu da home e o componente foi removido do `AppShell.tsx` — ficou sem nenhum uso depois que o Perfil do Professor virou item de menu.

## Afastado: por aulas perdidas, não por dias de calendário

Até aqui `estaAfastado()` (`lib/afastamento.ts`) contava **dias de calendário** sem presença (`DIAS_PARA_AFASTADO = 21`), e o card "Precisa atenção" do `DashboardProfessor` respondia a pergunta "quem sumiu?" por uma conta **diferente**: `total_presencas / total_aulas < 0.5`. Duas fontes para a mesma pergunta, que podiam discordar — a mesma classe de bug que a migration 010 já tinha fechado uma vez para frequência. E dias de calendário erram sozinhos: um aluno que ficou 21 dias sem vir numa quinzena **sem aula nenhuma lançada** não faltou a nada, mas levava o carimbo — foi o que aconteceu com a turma inteira em 2026-08-30, com só 3 aulas no banco.

**A pergunta certa é "quantas vezes ele podia ter vindo e não veio", não "quantos dias se passaram".** `aulas_perdidas` é campo **derivado**, montado em `lib/carregar-dados.ts` no mesmo laço que já monta `ultima_presenca_data`, a partir das mesmas aulas carregadas (`.limit(50)`) — sem query nova, sem tocar na view:

- **Aluno com presença registrada**: conta as aulas ativas já carregadas com `data > ultima_presenca_data` (`>`, não `>=` — a aula em que ele esteve presente não é perdida).
- **Aluno sem nenhuma presença**: reusa `total_aulas` da view (migration 010), que já é "aulas ativas desde que este aluno entrou" — é o que faz um aluno novo, numa academia sem chamada lançada ainda, dar `0` e **não** nascer afastado. Essa é a correção inteira desta mudança.
- Se a contagem encostar no limite de 50 aulas carregadas, a conclusão não muda: o limiar (`AULAS_PARA_AFASTADO = 6`) já foi ultrapassado bem antes disso.

**Uma resposta só, não duas.** `estaAfastado()` continua com as mesmas duas camadas de sempre (`afastado_manual` true/false ganha do cálculo; `null` devolve o automático), só que lendo `aulas_perdidas` em vez de dias. "Precisa atenção" no `DashboardProfessor` passou a chamar essa **mesma** função — não mais a conta de porcentagem — e o card mostra o motivo (`motivoAfastamento()`: "Faltou às últimas N aulas", ou "Nunca esteve presente (N aulas lançadas)" para quem nunca veio) em vez de um número de frequência.

**O que mede comprometimento continua medindo comprometimento.** O anel de frequência do crachá, o donut "Frequência geral" da home e o card "Perto da faixa" (`comPct`/`perto`, que responde outra pergunta e continua com o rótulo errado de propósito — o professor viu e escolheu deixar para depois) não foram tocados. Afastado é sobre sumiço; frequência é sobre comprometimento — são perguntas diferentes, e essa é a linha que não pode voltar a se confundir (era exatamente a confusão que gerava a divergência desta seção).

## Faixa desenhada com graus

`Diamonds` (losangos) e o `BeltBadge` texto-só saíram. `components/FaixaDesenhada.tsx` desenha a faixa de verdade — corpo com gradiente, trama de tecido, costura, ponteira e esparadrapos por grau — em SVG inline, arquivo separado do `AppShell.tsx` de propósito (mesmo padrão do `BannerInstalar.tsx`). `BeltBadge` agora é etiqueta de texto + `<FaixaDesenhada/>`; o grid de 33 cards (`AlunoCard`) usa `<FaixaDesenhada size="sm"/>` sozinho, sem etiqueta. `<FaixaDefs/>` (gradientes + pattern de trama) é montado **uma única vez**, no topo do `return` do `AppShell` — nunca por instância, é o que mantém 33 faixas no grid baratas de rolar no celular.

Quatro coisas que a próxima sessão não pode reabrir por engano:

- **As 13 faixas infantis de duas cores vêm do art. 1.3.1, não de duas metades.** O regulamento diz "apenas a cor do grupo (A) ou com uma listra branca (B) ou preta (C) ao centro em todo o seu comprimento" — uma tentativa inicial desenhou metade-esquerda/metade-direita, e estava errada. A construção certa é **uma cor de corpo com uma listra longitudinal fina ao centro**, correndo o comprimento inteiro inclusive por baixo da ponteira (a listra é desenhada antes dela na árvore SVG, e a ponteira opaca cobre o trecho perto da extremidade sozinha, sem código de recorte). O sufixo `_branca`/`_preta` do enum é a cor da listra, não uma segunda metade — o que também explica a ordem que `FAIXAS_INFANTIS` já tinha: X-e-Branca → X → X-e-Preta.
- **A listra decide o contorno pela claridade DELA MESMA, nunca pela do corpo.** Achado real ao revisar as 17 visualmente: `verde_preta` (listra preta sobre corpo verde) quase sumia, porque as duas cores têm luminância parecida. O contorno "escuro sobre claro / claro sobre escuro" que o resto do desenho usa resolve pra cor do **corpo** — pergunta diferente de "essa listra contrasta com o que está por baixo dela". A listra preta sempre leva contorno claro, a branca sempre contorno escuro, **independente do corpo**. Vale para qualquer combinação escura-sobre-escura que apareça depois; não trocar por um contorno que segue o corpo achando que simplifica.
- **O 7º/8º/9º da faixa preta é estilização ASSUMIDA, não reprodução do art. 1.3.4/1.3.5.** Os artigos pedem "gomos de 20cm" e "barra prateada dupla" com precisão que não dá para replicar com fidelidade a partir de descrição de texto. `VariantePretaAlta` desenha três construções estilizadas e claramente distintas entre si (gomos alternados vermelho/preto no 7º, vermelho/branco com friso prateado no 8º, base branca com barras douradas no 9º) — melhor uma estilização assumida do que uma fidelidade alegada e falsa, num app que um faixa preta vai abrir. `MAX_ESPARADRAPOS_PRETA = 6` mora em `FaixaDesenhada.tsx`, não em `lib/regras-ibjjf.ts`, porque é limite de **desenho**: só os graus 1–6 da preta são esparadrapo na mesma ponteira, o 7º–9º já são outra construção inteira. `grausMaximos('preta', ...)` continua devolvendo 9 (o teto de negócio, até o honorário) — é uma constante diferente, para uma pergunta diferente, e não deve ser movida para junto das regras da IBJJF achando que é a mesma coisa.
- **A trama corre no comprimento da faixa (eixo X do viewBox) de propósito, sem `patternTransform`.** Uma tentativa inicial rotacionou os dois patterns 35° e o resultado lia como jeans, não como o algodão ondulado de uma faixa de jiu-jítsu de verdade (conferido contra foto de referência). Não "arrumar" de volta para diagonal numa sessão futura achando que é mais "tecido" — o comprimento é a leitura certa, e num card pequeno a direção da linha carrega mais reconhecimento do que a textura em si.
- **A faixa da lista de Alunos (`LinhaAluno`, antes `AlunoCard`) usa `size="sm"` (sem trama nem costura) por escolha do professor, TESTADA — não por esquecimento nem por limitação técnica.** Depois disso, ele pediu para comparar: um branch à parte (`experimento/textura-alunocard`, descartado, nunca chegou na `main`) montou 4 variantes lado a lado no tamanho real do card — atual lisa, +costura sem trama, +trama na escala de hoje, +trama mais grossa/contrastada — nas 4 faixas mais distintas. Ele olhou no celular e ficou com a lisa: *"preferi elas lisas mesmo"*. Se uma sessão futura achar que o card "ficou incompleto" por não ter textura como o `md`, a resposta já foi dada — não reabrir sem pedido novo do usuário.

`grausMaximos(faixa, infantil)` ganhou o segundo parâmetro na faixa desenhada — mesmo motivo de `proximaFaixa()`, `branca` está nas duas listas e tem tetos diferentes (3 infantil, 4 adulta). O caso do adulto cadastrado numa faixa infantil (não deveria existir depois dos 16 — art. 2.2.3 — mas o cadastro aceita, e há um caso real em `amarela`) foi decidido de propósito: **3, "a faixa manda"** — o art. 4.1.2 I nomeia especificamente branca/azul/roxa/marrom, não "toda faixa usada por adulto", e `amarela` é faixa infantil por natureza (Anexo I) independente de quem a veste.

## Filtros num painel nomeado

Os até 8 chips soltos em duas linhas (`BarraFiltros`, hoje em `components/alunos/FiltrosAlunos.tsx`, junto com a busca por nome da G5) viraram um botão **"Filtrar"** com badge de contagem, chips removíveis por filtro ativo (1 toque tira, sem abrir nada) e um painel (`PainelFiltros`, sétimo modal do app, mesmo padrão `visible`/`handleClose` de 220ms do `MenuLateral`/`PainelProntos`) com três grupos nomeados: **Faixa**, **Situação** (Prontos/Afastados) e **Categoria** (Infantil/Adulto).

**Não existe rascunho local no painel — decisão consciente, não o design original.** A primeira proposta foi abrir o painel com uma cópia do estado (`draft`), aplicando só ao tocar num botão "Ver N alunos" no rodapé, e descartando ao fechar por fora. O usuário derrubou isso: se o contador do rodapé atualiza ao vivo enquanto o professor marca, a tela já está dizendo "isso vale" — descartar ao fechar pelo backdrop viraria a interação contradizendo a própria informação na tela, e um toque sem querer fora do painel (fácil de acontecer com pressa, no tatame) apagaria a seleção sem aviso. Cada chip do painel chama `setFiltros` direto, exatamente como os chips soltos de antes; fechar (backdrop, ✕, ou o botão "Ver N alunos") nunca desfaz nada, porque não há nada para desfazer. O botão de baixo é só o jeito rápido de fechar sabendo o resultado — texto "Ver N alunos" com filtro ativo, "Ver todos os N alunos" sem nenhum, para não parecer ação pendente quando não há filtro.

Nada na lógica de filtro mudou: `Filtros`, `FILTROS_VAZIOS`, `temFiltroAtivo`, `aplicarFiltros` e `ORDEM_FAIXAS` são os mesmos de sempre — só a casca visual foi embrulhada num painel. `aplicarFiltros` continua chamando a mesma `alertaGraduacao()` e a mesma `estaAfastado()`; o painel não pode nunca ganhar um critério próprio de "quem sumiu" ou "quem está pronto" — é exatamente a duplicação de fonte que a seção "Afastado: por aulas perdidas..." fechou.

## Card de vídeo da aula, com miniatura

O botão de texto "▶ Assistir aula" (só aparecia quando `link_youtube` existia) virou uma miniatura de verdade — a capa do vídeo, com um ▶ sobreposto — ao lado da foto da aula (migration 012) no card da aula, em `AppShell.tsx`. As duas ficam lado a lado, `flex:1` cada, 110px de altura (mesma altura que a foto já usava sozinha): **foto à esquerda** (não muda de lugar, quem já usa o app não estranha), **miniatura à direita** (a novidade). Quando só uma existe, ocupa a linha inteira sozinha — mesmo princípio de sempre, sem placeholder para o que não existe.

- **`extrairIdYoutube()`**, nova, ao lado de `validarLinkYoutube()`: cobre `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, ignorando `&t=`/`?si=` e outros parâmetros. Nunca lança — `try/catch` só no `new URL()`, o resto é string pura. Devolve `null` para `studio.youtube.com` (que passa em `validarLinkYoutube()`, está em `HOSTS_YOUTUBE`) e para qualquer formato fora dos cobertos.
- **`MiniaturaYoutube`, novo, mesmo padrão do `FotoAula` logo acima dele**: `onError` na `<img>` cai para um estado visível (o próprio botão de texto de hoje) em vez de deixar retângulo quebrado. **`id` aceita `null` de propósito** — achado só ao testar o caso `studio.youtube.com` de propósito: a primeira versão só renderizava o componente quando `extrairIdYoutube()` tinha sucesso, e um link válido sem id extraível virava **buraco silencioso** na linha (nem imagem, nem botão, nem indício de que existia link). `MiniaturaYoutube` agora trata `id === null` exatamente como `onError`: mesmo botão de texto, mesmo lugar. É por isso que o card sempre renderiza `<MiniaturaYoutube/>` quando `a.link_youtube` existe, passando `id` (que pode ser `null`) — nunca `{idYoutube && <MiniaturaYoutube/>}`.
- **O ▶ sobreposto (círculo translúcido + triângulo CSS) existe só na miniatura, nunca na foto da aula.** Foi acréscimo pedido depois de ver as duas lado a lado, do mesmo tamanho: sem nada distinguindo, as duas imagens ficam indistinguíveis e o professor só descobre qual é qual tocando — o toque desperdiçado que este app existe para evitar. A foto abre o modal da aula (o card inteiro faz isso); só a miniatura é um link de verdade, e só ela precisa dizer "isto é clicável".
- **Vídeo privado/removido não dá erro de rede — confirmado testando contra vídeo privado de verdade.** `i.ytimg.com` devolve **HTTP 200** com uma imagem de placeholder **120×90** (bem menor que os 480×360 do `hqdefault.jpg` de verdade), então `onError` **nunca dispara** nesse caso — só pega link malformado ou host fora do ar. Quem detecta é o `onLoad`, comparando `naturalWidth`/`naturalHeight` da imagem carregada contra `LARGURA_PLACEHOLDER_YOUTUBE`/`ALTURA_PLACEHOLDER_YOUTUBE` (120×90): bateu, é placeholder, cai no botão de texto igual ao `onError`. Testar esse caminho com um id inventado (que nunca existiu) tende a bater no mesmo placeholder também, mas o teste que prova a regra é contra um vídeo que existiu e foi tornado privado/removido — não um id fake qualquer.
- **Ajuda no campo do link** (`ModalAula`), abaixo do texto já existente: *"Use 'Não listado'. Vídeo 'Privado' não gera miniatura nem abre para o aluno."* — vídeo Privado no YouTube não tem capa nem player para ninguém além do dono da conta; o professor pode subir tudo certo e o recurso simplesmente não funcionar para a turma, sem nenhuma pista do porquê sem o aviso.

## Tema e navegação (G3)

O app tem dois temas, **kimono branco** (claro) e **kimono preto** (escuro), com os tokens do `DESIGN.md`.

- **A cor nasce em `app/globals.css`** como custom property (`--fundo`, `--tinta`, `--ativo`, `--alerta`, `--erro`…), uma vez por tema. Chega ao código por `var(--token)`: no `AppShell`, `LoginGate` e `BannerInstalar` pelo objeto `theme` de **`lib/cores.ts`** (única fonte; as ~260 chamadas `t.xxx` mudam de cor sem reescrita) e no Tailwind pelo `tailwind.config.js`, que aponta para as mesmas variáveis. Tailwind `/opacidade` não funciona com `var(--x)`: use `color-mix` em valor arbitrário.
- **O vermelho foi dividido em papéis**, não em "vermelho": `ativo` (ação e seleção, neutro), `alerta` (âmbar, o professor precisa olhar), `erro` (falha ou impedimento, sempre com texto) e neutro. O vermelho de verdade só sobrou na ponteira, como decoração. Mapa e desvios em `docs/superpowers/plans/2026-10-22-g3-mapa-do-vermelho.md`.
- **Troca de tema (`lib/tema.ts`):** atributo `data-tema="claro"|"escuro"` no `<html>`, chave `gm-tema` no `localStorage`. Sem escolha salva, segue o celular (`prefers-color-scheme`). Um script inline no `<head>` (`SCRIPT_TEMA`) aplica o tema antes da primeira pintura, para não piscar o errado; também aceita `?tema=claro|escuro`. Todo acesso ao `localStorage` está em `try/catch` (aba privada): falhou, vira "sem escolha". O botão fica **só no menu** (Mais → "Tema"), decisão registrada no ROADMAP.
- **`scripts/checar-cores.mjs` (`npm run checar-cores`) reprova cor escrita à mão** em `app/`, `components/` e `lib/` (hex e `rgb()/hsl()`). `globals.css` e `FaixaDesenhada.tsx` são ignorados por inteiro. Cor que **não é de tema** (as de faixa da IBJJF, a meta `theme-color`, o fundo da abertura em vídeo) leva a marca **`cor-ok: <motivo>`** na linha ou no comentário logo acima; um bloco entre `cor-ok-inicio: <motivo>` e `cor-ok-fim` passa inteiro (a tabela `BELT_COLORS` tem 17 linhas). Tem testes (`node --test scripts/checar-cores.test.mjs`). Rode antes de commitar; um valor de cor novo vai para um token, nunca para a marca.
- **Navegação (`components/Navegacao.tsx`):** barra de abas embaixo no celular (**Início, Alunos, Aulas, Graduar, Mais**) e menu lateral de 232 px no computador, trocados **só por CSS em 960 px** — o componente é o mesmo e não detecta aparelho. Início, Alunos e Aulas são telas (`aria-current`); Graduar e Mais são ações (abrem o painel de prontos e o menu) e nunca ficam "ativas". Por precisar de media query, usa classes de `globals.css` e não inline style. A coluna de conteúdo no computador é de 720 px centralizada (layouts largos reais são G5–G8). O botão flutuante "+" só aparece em Alunos e Aulas.
- **A dívida do rodapé do modal do aluno (conteúdo do `<fieldset>` pintado por cima de Cancelar/Salvar no Chrome) foi fechada na G5.2:** a rolagem passou para uma `<div>` por fora e o `<fieldset>` ficou só para desligar a edição. Reproduzida e conferida no Chrome; no Safari do iPhone não foi testada a fundo (a ficha usa a mesma estrutura).

## Tela de Alunos (G5)

Aluno aparece em **duas versões de verdade**, trocadas só por CSS (`app/alunos.css`, mesmo padrão da `Navegacao`), e tudo o que é da tela saiu do `AppShell.tsx` (147 KB → ~88 KB).

- **Celular (até 959 px):** lista **agrupada por faixa** (preta primeiro, depois marrom, roxa, azul, branca e as infantis; `ORDEM_GRUPOS` em `lib/alunos.ts`) — linha de 64 px com foto ou inicial, nome, "Azul, 2 graus · 18 de 25 aulas", selos PRONTO (âmbar cheio) e AFASTADO (só contorno âmbar) e a faixa desenhada lisa. Busca por nome (sem acento nem maiúscula, `lib/busca.ts`) ao lado do botão Filtrar. A ficha do aluno é uma **folha que cobre a tela** (`position: fixed`), com abas coladas no topo e rodapé fixo.
- **Computador (960 px ou mais):** só a tela de Alunos usa a largura toda (`.conteudo.larga`, `height: 100dvh`; Início e Aulas continuam nos 720 px até a G6/G8). **Duas colunas que rolam cada uma no seu ritmo** (lista à esquerda com busca e filtros presos no alto, ficha à direita, parada) — não `sticky`: no mockup o `sticky` deixava o rodapé da ficha fora da tela no topo da página. **A tabela (Nome, Faixa, Frequência "18 de 25 (72%)", Situação) só aparece a partir de 1240 px**, porque a ficha ocupa 380 px e a lista de 960 px teria 288 px; entre 960 e 1239 px a lista usa a linha do celular ao lado de uma ficha de 330 px. "+ Novo aluno" no cabeçalho; o "+" flutuante some só em Alunos.
- **A ficha (`components/alunos/FichaAluno.tsx`, ex-`ModalAluno`) é um componente só, em dois lugares, escolhidos pela `origem`:** `'alunos'` (tocou na lista: mora na vaga ao lado da tabela) ou `'fora'` (veio do Início ou do Graduar: painel de 440 px pela direita, com pano escuro, por cima da tela em que o professor estava). O `AppShell` guarda **`ficha = { id, origem, aba }` — o ID, não o objeto**; o aluno é lido da lista a cada render, então a recarga depois de graduar chega na ficha aberta, e um aluno apagado fecha a ficha sozinho. A `key` inclui id, origem e aba.
- **A ficha compara sempre com `original`, o aluno de quando ela abriu — nunca com o `aluno` vivo da lista.** Achado da revisão final da G5: se o salvar grava `alunos` e falha no `insert` em `graduacoes`, o `AppShell` já pôs a faixa nova na lista; comparando com o aluno vivo, a "nova tentativa" não via mudança de faixa, não gravava a graduação e fechava como se tivesse dado certo. O prop `aluno` serve só para o que é fato do banco (selos, nome). Reproduzido com `fetch` simulado antes de corrigir.
- **Graduar ou apagar graduação chama `recarregar()` (`onGraduacaoMudou`).** A gravação sempre esteve certa; o que ficava velho era a lista em memória (histórico sem a linha nova, ✕ apagado voltando, selo PRONTO no aluno recém-graduado). A lista volta do banco — fonte única —, nada é remendado na mão.
- **Alteração não salva nunca se perde sem pergunta:** Cancelar, ✕ e Esc da ficha, e também trocar de aluno, trocar de aba de navegação, "+ Novo aluno" e escolher aluno no painel de prontos passam por `confirmarDescarte()` ("Descartar as alterações em {nome}?"). "Alteração" = `alunoAlterado()` (`lib/comparar.ts`, testado): só as colunas de `COLUNAS_ALUNO`, e texto vazio e `null` valem o mesmo; `null` e `false` NÃO (`afastado_manual`: automático × "ativo" decidido na mão).
- **A rolagem da ficha é uma `<div>` por fora do `<fieldset>`.** No Chrome o conteúdo de um `<fieldset>` com `overflow` vazava e era pintado por cima do rodapé. O fieldset só desliga a edição (`podeEditar`).
- **Zoom liberado e campos de 16 px.** Saiu o `maximumScale: 1` de `app/layout.tsx`; sem ele o iPhone dá zoom sozinho em campo com letra menor que 16 px, então **todo** campo de texto do app (ficha, Perfil do Professor, modal de aula, busca da Chamada, login) tem 16 px — Regra do 16 do `DESIGN.md`. Campo novo nasce com 16 px. Testado no iPhone do Pedro (2026-10-23).
- **`Field` e `Toggle` (`components/comum/Campos.tsx`) são classes de `app/comum.css`** (campo de 48 px, borda de 1,5 px), usadas também pelo Perfil do Professor e pelo modal de aula. O `Toggle` virou `<button role="switch">`.
- **O "+" abre a ficha do aluno recém-criado** (decisão do Pedro). A linha continua nascendo no banco na hora ("Novo Aluno", branca, 0 graus, início hoje); abandonar a ficha deixa o "Novo Aluno" lá — apagar é com o professor.
- **O que saiu da lista (por decisão, nada se perdeu):** o anel de frequência do crachá (virou o "18 de 25") e o tempo de treino ("1A 3M"; a data de início continua na ficha). "Apagar aluno" saiu do rodapé e mora no fim da aba Perfil.
- **Nada do FOJJ entrou:** sem horário de turma, sem "30 dias", sem o resumo com botões Graduar/Editar/Histórico.

## Datas: "hoje" é o dia de São Paulo (G4)

**Nunca escreva `new Date().toISOString().split('T')[0]` para "hoje".** Isso é o dia em UTC: das 21h à meia-noite de Brasília já é amanhã lá, e o professor lança a chamada justamente nesse horário. Já sujou dados reais (aula de terça 08/09 gravada como quarta 09/09). Use **`hojeBrasil()`** de `lib/datas.ts`, a única fonte de "hoje" do app; ela devolve `'AAAA-MM-DD'` no fuso `America/Sao_Paulo` qualquer que seja o fuso do aparelho.

**Nunca leia o ano com `new Date('AAAA-MM-DD').getFullYear()`.** Texto sem hora é meia-noite UTC, que no Brasil ainda é o dia anterior: quem nasceu em 1º de janeiro ganhava um ano. Use `anoDaData()`. Datas `'AAAA-MM-DD'` se comparam certo como texto — prefira isso a montar `Date`.

`lib/datas.ts` não tem import de propósito: `scripts/datas.test.mjs` o carrega direto no Node 24 (`npm run testar`), sem framework de teste. Cada caso roda em três fusos de processo.

**Aula com data futura não conta como dada** (migration `016`). O professor pode lançar aula com antecedência, e a Parte 2 depende disso (prazo de 24 h do aluno). Ela aparece na lista de Aulas, mas fica fora de `total_presencas`, `total_aulas`, `presencas_desde_graduacao` e `aulas_desde_graduacao` (view), de `aulas_perdidas` e `ultima_presenca_data` (`lib/carregar-dados.ts`) e do contador "aulas deste mês". **Os dois lados usam o mesmo "hoje" de São Paulo**: no SQL é `(now() at time zone 'America/Sao_Paulo')::date`, **nunca `current_date`** — no Supabase a sessão é UTC, e `current_date` repetiria dentro do banco o defeito das 21h. Se um lado mudar o critério, mude o outro: é o que mantém o crachá e o selo AFASTADO contando a mesma história.

## Arquitetura futura que já está no dado

**Login de aluno, com permissão apenas de confirmar a própria presença** — não editar mais nada. A confiança é a conduta do próprio jiu-jítsu: de propósito **não** haverá geolocalização, foto, nem dupla confirmação.

`presencas.confirmado_por` (`'professor' | 'aluno'`) já foi desenhado para isso: hoje é sempre `'professor'`, e quando o aluno logar só esse literal muda no upsert. A decisão de *quem pode gravar* fica fora da coluna — é RLS/papel. Não modele nada novo que amanhã obrigue a reescrever essa lógica de permissão.

## PWA: o app é instalável

`public/manifest.json`, `public/sw.js` e os PNGs de `public/icons/`. Ícones gerados do logo real da academia por `scripts/gerar-icones.mjs` (roda na mão, `node scripts/gerar-icones.mjs`; os PNGs são commitados). A fonte é `public/icons/source-logo.jpg.jpeg` — extensão dupla mesmo, é como o arquivo foi salvo. Não há SVG: a origem é raster.

Três decisões que parecem descuido e não são:

- **O service worker é mínimo de propósito e não tem cache.** Ele existe só porque o Chrome exige um SW registrado *com handler de `fetch`* para considerar o app instalável. Cachear resposta do Supabase por engano faria o professor ver chamada e presença desatualizadas no tatame — que é exatamente o erro que este app não pode cometer. Offline é etapa própria, e precisa decidir invalidação antes de escrever uma linha.
- **Ícones só com `purpose: "any"`, sem variante maskable.** Maskable exige recorte circular com padding seguro, que clipparia o "Life Style" do logo.
- **A captura do `beforeinstallprompt` mora em `lib/instalacao.ts`, não dentro do banner.** O evento dispara logo no carregamento e o banner só monta depois do login: com o listener dentro dele, o evento disparava enquanto o professor digitava a senha, sem ninguém escutando, e como não dispara de novo o banner nunca apareceria. Quem escuta é o layout, cedo; o banner só lê o que já foi capturado. Se um dia o banner mudar de lugar, essa separação continua sendo o que faz ele aparecer. Desde que o Menu lateral existe há um segundo consumidor — o item "Instalar no celular" do `MenuLateral` — assinando `eventoAtual()`/`inscrever()` do mesmo jeito, independente do banner; a separação captura/exibição foi o que tornou isso possível sem duplicar o listener.

O banner é dispensável e grava em `sessionStorage` (não `localStorage`): o pedido é não incomodar de novo na *mesma sessão*; numa aba nova o convite volta. iOS não recebe banner — Safari não implementa `beforeinstallprompt`, e sem evento o componente não renderiza nada, sem farejar user-agent.

## Pendências conhecidas

1. **Passo 6 — geração de PDF: pausado em 2026-08-04.** Sem prazo definido; outro projeto teve prioridade. Nada foi commitado e nada ficou pela metade na árvore — a pausa foi antes de qualquer código. O escopo do Passo 6 não está registrado em lugar nenhum do repo; quem retomar precisa levantar isso com o usuário antes de planejar.
2. **Foto do ALUNO por upload real (Supabase Storage) — a da AULA já foi feita na migration 012.** A `referrerPolicy` acima é o remendo de curto prazo, não a solução: a foto do aluno continua sendo uma URL que o professor tem que hospedar em algum lugar e colar à mão — no celular, no tatame. O certo é bucket + policy de upload + captura pela câmera, igual ao que a `012` já entregou para a foto da aula. **É sessão própria, adiada de propósito — não esquecida.**
3. **A purga da lixeira não apaga o arquivo no Storage.** A `011` apaga a linha da aula; o cascade do Postgres não alcança o bucket, então a foto daquela aula fica órfã. É pouco (uma por aula) e não vaza — o bucket é privado —, mas cresce devagar para sempre. Resolver exige varrer o bucket contra as linhas existentes, o que é trabalho próprio.
4. **Fila offline da chamada.** Achado da mesma auditoria, maior do que cabe numa sessão só: hoje um toque na chamada com a rede caída se perde. Ligado à decisão de cache que o service worker adiou de propósito (ver a seção de PWA) — offline precisa de invalidação decidida antes da primeira linha de código. **Adiada de propósito — não esquecida.**
5. **Anos contados como "dias ÷ 365,25"** em `anosNaFaixaAtual` e no prazo do provisório (`lib/regras-ibjjf.ts`). No dia exato em que o aluno completa o tempo mínimo da IBJJF, a resposta pode sair com até um dia de diferença. Achado na G4, fora do escopo aprovado — **só registrado, não corrigido**.
6. **Aula e graduação no mesmo dia.** A view conta "desde o último grau" com `au.data >= data da graduação`, então a aula do dia em que o grau foi dado entra na conta do grau novo, mesmo tendo acontecido antes dele. Decisão do Pedro em aberto (provavelmente migration de view). A correção da data da graduação da Aninha (G4.3) espera por ela — ver `docs/PLANO-ATUAL.md`.

Já resolvidas: a **purga física da lixeira** (era pendência explícita desde a 005 — ver a seção acima). `GET /manifest.json` 404 (o `metadata` do layout referenciava um manifest que nunca existiu — resolvido junto com o PWA acima). RLS aberta para `anon`, PIN morto no `.env` e o "perfil do professor não encontrado" (que era `GRANT` ausente em `professor_perfil`, não bug de leitura) — as três na migration 009. E os arquivos órfãos de `app/api/`, removidos.

## Onde as coisas moram

| Arquivo | O que é |
|---|---|
| `docs/PLANO-ATUAL.md` | Plano da etapa em andamento; volta a ficar vazio quando o lote fecha |
| `PRODUCT.md` | Contexto de produto (G2): quem usa, o que nunca se perde, o que o app não faz. Lido pelo Impeccable |
| `DESIGN.md` | Sistema visual (G2): tokens dos dois temas, regras (trama, costura, ponteira, estêncil, 44 px), alerta âmbar. Gerado do protótipo `gm-kimono.html`; vale a partir da G3 |
| `docs/handoff/` | Troca de contexto entre Claude (chat) e Claude Code — `PARA-O-CODE.md`/`DO-CODE.md` |
| `components/AppShell.tsx` | Estado e cargas do app, aulas, chamada, lixeira, perfil do professor, painel de prontos, menu |
| `components/alunos/` | Tela de Alunos (G5): `TelaAlunos` (grade lista+ficha), `ListaAlunos`/`LinhaAluno`, `FiltrosAlunos` (busca, chips, painel), `FichaAluno` (ex-`ModalAluno`), `AbaGraduacao` |
| `components/comum/` | `Campos` (`Field`, `Toggle`), `BeltBadge`, `FreqBar` |
| `app/alunos.css`, `app/comum.css` | Classes da tela de Alunos (celular e computador) e dos campos; só `var(--token)` |
| `lib/alunos.ts` | Payload e validação do aluno (`COLUNAS_ALUNO`), filtros, `agruparPorFaixa`, `alunoAlterado`, `AlunoFicha` |
| `lib/lixeira.ts` | Soft delete: `mandarParaLixeira`, `restaurarDaLixeira`, `DIAS_LIXEIRA` e o prazo |
| `lib/busca.ts`, `lib/comparar.ts` | Puros e sem import (testados em `scripts/*.test.mjs`): busca sem acento, agrupar na ordem, comparar payloads |
| `lib/cores-faixa.ts` | `BELT_COLORS`: as 17 cores de faixa da IBJJF (marca `cor-ok`) |
| `components/FaixaDesenhada.tsx` | Faixa desenhada (SVG) com graus — corpo, listra, ponteira, esparadrapos, `<FaixaDefs/>` |
| `components/DashboardProfessor.tsx` | Home (Tailwind/shadcn): frequência geral, distribuição, prontos para graduar |
| `lib/carregar-dados.ts` | Carga única das listagens ativas + campos derivados. Usada no server e no client |
| `lib/regras-ibjjf.ts` | Faixas, categoria etária, tempo mínimo, quem pode assinar — **só o que a IBJJF exige** |
| `lib/ritmo-graus.ts` | Ritmo de graus do professor — **sugestão dele**, separado do motor da IBJJF de propósito |
| `lib/datas.ts` | `hojeBrasil()` e `anoDaData()` — única fonte de "hoje" (fuso de São Paulo); testes em `scripts/datas.test.mjs` |
| `lib/alertas-graduacao.ts` | `alertaGraduacao()` — fonte única do "pronto para graduar"; devolve `{tipo:'grau'\|'faixa', ...} \| null`, não mais `string\|null` |
| `lib/afastamento.ts` | `AULAS_PARA_AFASTADO`; `estaAfastado()`/`motivoAfastamento()` leem `aulas_perdidas`, não dias de calendário |
| `lib/auth.ts` | `useSessao()` e `sair()` — estado da sessão do professor |
| `components/LoginGate.tsx` | Tela de login e gate no topo do app |
| `lib/cores.ts` | Objeto `theme` com `var(--token)` — única fonte de cor dos componentes com inline style |
| `lib/tema.ts` | Ler, aplicar e guardar o tema; `SCRIPT_TEMA` (antes da primeira pintura) |
| `components/Navegacao.tsx` | Barra de abas (celular) e menu lateral (computador) |
| `scripts/checar-cores.mjs` | `npm run checar-cores`: reprova cor solta; marca `cor-ok` para exceções |
| `lib/instalacao.ts` | Captura global do `beforeinstallprompt` (começa no layout, cedo) |
| `components/BannerInstalar.tsx` | Convite "instale no celular" — montado no `AppShell`, pós-login |
| `components/RegistroServiceWorker.tsx` | Registra `sw.js` e liga a captura. Monta no layout, fora do login |
| `scripts/gerar-icones.mjs` | Gera os PNGs de `public/icons/` a partir do logo (roda na mão) |
| `lib/comprimir-imagem.ts` | Resize + reencode JPEG no browser, antes do upload |
| `lib/foto-aula.ts` | Upload/troca/remoção da foto da aula e assinatura das URLs |
| `lib/types.ts` | Tipos do modelo + `TabAluno` (aba inicial do modal do aluno) |
| `supabase/migrations/` | Fonte da verdade do schema, numeradas |
| `docs/schema.sql` | Retrato consolidado do banco, para leitura |
