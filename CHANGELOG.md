# Changelog

Histórico de mudanças do GrauMestre, da mais recente para a mais antiga.
As datas vêm do histórico do Git; as migrations citadas estão em `supabase/migrations/`.

O projeto não usa versionamento semântico — não há releases publicadas. Cada
entrada corresponde a um commit na `main`.

---

## Não lançado

- **G1 do lote v2 — ping do Supabase por Vercel Cron (migration 015).** Evita que o plano gratuito pause o projeto por inatividade (~7 dias).
  - `app/api/ping/route.ts` (novo): `GET` protegido por `CRON_SECRET` (`Authorization: Bearer`); sem segredo, ou com `CRON_SECRET` indefinido, responde 401 sem tocar o banco. Usa só a chave pública e chama `rpc('ping')`.
  - `vercel.json` (novo): cron `0 9 */5 * *` (06:00 de Brasília, a cada 5 dias; `*/5` reinicia a cada mês, o maior intervalo é 5 dias).
  - **Migration 015: `public.ping()`**, que devolve `1` e não lê tabela. Foi preciso porque a 009 revogou o `anon` das tabelas: um `select` ali dá `permission denied` e não há garantia de que conte como atividade. Só acrescenta uma função; sem RLS ou GRANT de tabela alterados. Aplicada pelo Pedro em 2026-10-22.
  - Testado no `localhost`: sem segredo 401, segredo errado 401, segredo certo 200 `{ok:true}`. `tsc --noEmit` limpo.
  - Única exceção à regra "sem `app/api`" (ver `CLAUDE.md`).
- **Card da aula ganha miniatura de vídeo, em vez de um botão de texto.**
  - `extrairIdYoutube()` (nova) cobre `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, ignorando `&t=`/`?si=`; nunca lança, devolve `null` para `studio.youtube.com` e formatos fora dos cobertos.
  - `MiniaturaYoutube` (novo componente), mesmo padrão de `onError` do `FotoAula`: erro na imagem cai de volta no botão de texto "▶ Assistir aula". `id` aceita `null` — achado ao testar `studio.youtube.com`: sem isso, um link válido sem id extraível virava um buraco silencioso na linha, sem imagem nem botão.
  - **Vídeo privado/removido não gera erro de rede** — o YouTube devolve HTTP 200 com um placeholder de 120×90, então `onError` sozinho não pega o caso. Corrigido depois do teste do Felipe contra um vídeo privado de verdade: `onLoad` compara `naturalWidth`/`naturalHeight` da imagem contra o tamanho do placeholder e cai no mesmo botão de texto quando bate.
  - Miniatura e foto da aula (quando as duas existem) ficam lado a lado, mesma altura de 110px; sozinha, cada uma ocupa a linha inteira. Foto à esquerda (não muda de lugar), miniatura à direita.
  - ▶ sobreposto (círculo translúcido + triângulo) só na miniatura — as duas imagens do mesmo tamanho, lado a lado, ficavam indistinguíveis sem ele.
  - Aviso novo no campo do link (`ModalAula`): "Use 'Não listado'. Vídeo 'Privado' não gera miniatura nem abre para o aluno."
- **Filtros agrupados num painel nomeado, atrás de um botão "Filtrar".**
  - Os até 8 chips soltos em duas linhas (faixa, prontos, afastados, infantil/adulto) viraram um painel (`PainelFiltros`, sétimo modal do app, mesmo padrão dos outros) com três grupos: Faixa, Situação e Categoria.
  - **Sem rascunho local, de propósito.** A ideia original era um estado de rascunho que só aplicava ao tocar "Ver N alunos"; o usuário pediu para tirar — o contador ao vivo do rodapé já passa a mensagem de "isso está valendo", então descartar ao fechar pelo backdrop seria a interação contradizendo a própria tela, e arriscado num app usado com pressa no tatame. Cada chip aplica na hora, igual antes; fechar (de qualquer jeito) nunca desfaz nada.
  - Filtro ativo também aparece como **chip removível** ao lado do botão "Filtrar", fora do painel — 1 toque tira, sem abrir nada.
  - Nenhuma lógica de filtro mudou: `aplicarFiltros`, `temFiltroAtivo`, `FILTROS_VAZIOS`, `ORDEM_FAIXAS` são os mesmos; só a casca visual foi embrulhada. AND continua sendo AND, e `aplicarFiltros` continua chamando a mesma `alertaGraduacao()`/`estaAfastado()` de sempre.
- **Faixa desenhada com graus substitui os losangos (`Diamonds`) e o texto-só (`BeltBadge`).**
  - `components/FaixaDesenhada.tsx` (arquivo novo, SVG inline): corpo com gradiente, trama de tecido, costura, ponteira e esparadrapos por grau. `<FaixaDefs/>` (gradientes + patterns) é montado uma única vez no `AppShell`, referenciado por `url(#id)` — é o que mantém os 33 cards do grid baratos de rolar no celular.
  - **As 13 faixas infantis de duas cores seguem o art. 1.3.1**: cor do grupo com uma listra branca ou preta longitudinal ao centro, correndo todo o comprimento — não duas metades lado a lado, construção inicial que foi corrigida antes de fechar a etapa. A listra decide o próprio contorno pela claridade dela mesma, nunca pela do corpo (achado em `verde_preta`, onde listra preta sobre corpo verde quase sumia).
  - **7º/8º/9º da faixa preta é estilização assumida**, não reprodução literal do art. 1.3.4/1.3.5 — os artigos pedem precisão (gomos de 20cm, barra prateada dupla) que não dá pra replicar com fidelidade a partir de texto. Três construções estilizadas e claramente distintas entre si.
  - Grau sempre no modo "preenchido": todos os espaços do teto da faixa aparecem, os conquistados acesos — decisão do usuário depois de comparar com o modo "só os que existem" numa página de teste. A largura de cada esparadrapo vem do teto (`max`), nunca da contagem de graus — bug real visto e corrigido antes do modo "exato" sair de vez.
  - `grausMaximos()` ganhou o parâmetro `infantil` (mesmo motivo de `proximaFaixa()`: `branca` está nas duas progressões, com tetos diferentes). O caso do adulto cadastrado em faixa infantil (achado real em `amarela`) foi decidido de propósito: a faixa manda, não a idade.
  - Trama corrigida para correr no comprimento da faixa, não na diagonal — uma versão inicial rotacionou o pattern e o resultado lia como jeans, não como o algodão de uma faixa de verdade.
- **Afastado passa a contar AULAS perdidas, não dias de calendário — e o card "Precisa atenção" vira a mesma resposta do selo.**
  - Duas fontes discordando sobre "quem sumiu": o selo AFASTADO usava dias sem presença, o card "Precisa atenção" usava `total_presencas / total_aulas < 0.5` — a mesma classe de divergência que a migration 010 já tinha fechado uma vez para frequência. Agora os dois chamam `estaAfastado()`.
  - `DIAS_PARA_AFASTADO` (21) vira `AULAS_PARA_AFASTADO` (6). `aulas_perdidas` é derivado em `lib/carregar-dados.ts`, sem query nova nem mudança na view: conta aulas ativas com `data > ultima_presenca_data` (com presença) ou reusa `total_aulas` da view (sem nenhuma).
  - **Sem aula lançada não existe afastado.** Um aluno novo numa academia sem chamada ainda dá `aulas_perdidas = 0` — a correção inteira da etapa: com só 3 aulas no banco, a turma inteira tinha o selo antes desta mudança.
  - `motivoAfastamento()` passa a dizer "Faltou às últimas N aulas" ou "Nunca esteve presente (N aulas lançadas)", em vez de "sem presença há N dias". O card "Precisa atenção" mostra esse motivo, não mais porcentagem.
  - Anel de frequência, donut da home e "Perto da faixa" não mudaram — medem comprometimento, pergunta diferente de "sumiu".
- **Hambúrguer vira menu de verdade; Perfil do Professor e Lixeira saem da home.**
  - `<Menu>` do header ganha `onClick` e abre uma gaveta lateral (mesmo padrão de modal dos outros, entrando pela esquerda) com quatro itens: Perfil do Professor, Lixeira (com a contagem), Instalar no celular (só quando há prompt de instalação disponível) e Sair.
  - `ProfessorCard` sai da home e é removido; as abas caem de três para duas (`ALUNOS`/`AULAS`). `tab` continua podendo valer `'lixeira'` — só a barra deixou de desenhar o terceiro botão — para reaproveitar toda a lógica de conteúdo e do FAB que já checava esse valor, sem duplicar em estado novo.
  - **A lixeira ganhou cabeçalho próprio** ("‹ Lixeira", tocável, volta para Alunos): sem aba destacada, a tela não dizia mais onde o professor estava nem como sair de lá — achado durante o teste manual, corrigido antes de fechar a etapa.
  - "Sair" sai do `ModalProfessor` — junto com o identificador da conta, que foi para o rodapé do menu, agora mostrando o apelido em vez do e-mail completo.
- **Sininho vira painel de notificações; a lista "Prontos para graduar" sai da home.**
  - `<Bell>` do header, antes decorativo, ganha `onClick` e um badge (bolinha vermelha com a contagem, só quando há alguém pronto). O toque abre `PainelProntos`, listando foto, nome, faixa+graus, o motivo do alerta e uma linha de evidência ("X de Y presenças desde o último grau", ou "Tempo mínimo da faixa cumprido") — não é barra de progresso, é a justificativa de quem já está na lista.
  - **O painel mora no `AppShell.tsx`**, com os outros modais e o mesmo padrão de bottom sheet — não um padrão novo em Tailwind dentro do `DashboardProfessor`. A lista é computada uma vez no `AppShell`; o `DashboardProfessor` só recebe a contagem, para o badge e para a estatística do hero mostrarem o mesmo número.
  - Tocar num aluno fecha o painel na hora e abre o modal dele já na aba de graduação — mesmo padrão que `ModalAula` já usa ao entregar para `Chamada`, sem empilhar overlays.
  - **O estado vazio é texto, não silêncio.** Com a linha de base de 3 aulas no banco, o painel fica vazio por meses; ele diz isso em uma linha, com o critério ao vivo, em vez de abrir em branco.
- **"Prontos para graduar" passa a ser sobre GRAU, com critério de presença — não mais sobre faixa por tempo zero.** Migration `014_prontidao_por_presenca`.
  - **O card listava quase a turma inteira, e não era conta errada de tempo.** A IBJJF não exige tempo nenhum na faixa branca (art. 3.1.3 I), então `tempoMinimoAnos()` sempre devolveu 0 e todo branca adulto aparecia pronto desde o dia da matrícula — ruído por construção, não bug de cálculo.
  - **O alerta passa a ser sobre GRAU**, com critério de presença do professor (art. 4.1.3 permite): 48 presenças reais desde a última graduação registrada (ou desde a matrícula, sem nenhuma), editável em `professor_perfil.presencas_por_grau`. Mora em `lib/ritmo-graus.ts`, nunca em `lib/regras-ibjjf.ts` — mesma separação do ritmo em meses da `013`, e `meses_entre_graus` continua sem influenciar o card.
  - **O alerta de FAIXA não sumiu — ficou raro de propósito.** Só dispara para quem está no teto de graus **e** cumpre o tempo mínimo da IBJJF **e** a idade mínima (checagem de idade que não existia antes). `alertaGraduacao()` passa a devolver um tipo discriminado (`{tipo:'grau'|'faixa', ...}`) em vez de `string|null`.
  - **A contagem é SQL, na view `alunos_frequencia`.** `lib/carregar-dados.ts` busca só as últimas 50 aulas — contar 48 presenças exigiria olhar pelo menos 48, e o limite quebraria a conta no ponto em que ela importa. Duas colunas novas, `presencas_desde_graduacao` e `aulas_desde_graduacao` (a segunda preparada para a Etapa 2), com o mesmo piso `greatest(..., a.inicio)` que a `010` já usa — sem ele, aluno vindo de outra academia (graduação registrada com data anterior à matrícula aqui) contaria aulas anteriores a ele existir na turma.
  - **Linha de base no banco em 2026-08-30: 3 aulas lançadas, presença máxima 1, zero alunos prontos.** Esperado — a lista fica vazia por meses até acumular chamada de verdade, e o professor promove na mão nesse meio tempo.
- **Ritmo de graus do professor, e o teto de 4 graus fechado por todos os caminhos.** Migration `013_ritmo_graus`.
  - **O teto do art. 4.1.2 já estava certo, e a verificação registrou isso.** `grausMaximos()` sempre devolveu 4 para branca/azul/roxa/marrom, e o seletor da aba Graduação nunca chegou a renderizar um botão "5" — não existia o bug de "5º grau" que motivou a sessão. Fica escrito para a próxima sessão não reabrir a suspeita.
  - **Mas trocar de faixa não limitava os graus.** O `onClick` do botão de faixa mexia só em `faixa`, então um preta 6º grau rebaixado para marrom salvava "marrom 6º grau" — grau que não existe. O banco aceitava (o check é `graus between 0 and 9`, global, não por faixa) e a tela escondia o erro: os botões de grau re-renderizam 0–4, e nenhum ficava destacado. Agora faixa e graus são ajustados juntos, com `Math.min(graus, grausMaximos(faixaNova))`, o que cobre também adulto→infantil (teto 3).
  - **"Próximo passo" passou a nomear a próxima faixa** em vez do genérico "pronto para subir de faixa": no 4º grau lê-se "4º grau completo → promover para Faixa Azul". A nova `proximaFaixa()` exige saber se o aluno é infantil, porque **`branca` está nas duas progressões** — deduzir pela faixa sozinha erraria justamente na faixa mais comum do app. De quebra, some a promessa falsa de faixa nova para a preta com 9 graus, onde o 10º é honorário (art. 4.1.5.X).
  - **Sugestão de ritmo: 5 meses por grau, padrão editável.** Um lembrete de quando o próximo grau poderia sair no ritmo do professor, com o valor global em `professor_perfil.meses_entre_graus` e editado no Perfil do Professor. É o ritmo de quem gradua, não propriedade de quem é graduado.
  - **A sugestão não se confunde com o tempo mínimo obrigatório, nem no código nem na tela.** Ela mora em `lib/ritmo-graus.ts`, fora do motor da federação em `lib/regras-ibjjf.ts`, porque o art. 4.1.3 deixa o sistema de graus a critério do Professor até a marrom, enquanto o tempo mínimo de permanência do art. 3.1.3 é regra da IBJJF e ninguém altera. Na tela são blocos distintos: o ritmo é tracejado e rotulado "sugestão sua", e o bloco de exceções passou a nomear a IBJJF e o artigo.
  - **Não aparece na faixa preta** — ali os intervalos entre graus são exigência da federação (3/5/7/10 anos, em `GRAUS_PRETA`), e sugerir 5 meses ao lado disso contradiria a IBJJF na tela. Também não aparece quando o aluno já está no teto de graus, onde o próximo passo é mudar de cor, não ganhar grau.
  - **O card "Prontos para graduar" não mudou, e o ritmo não o alimenta.** Verificado no código, não presumido: o card chama `alertaGraduacao()`, cujo arquivo esta sessão não tocou (zero linhas de diff), e `lib/ritmo-graus.ts` é importado num único lugar — o modal do aluno no `AppShell`. O card responde sobre o tempo mínimo da IBJJF para a próxima *faixa*; o ritmo, sobre o próximo *grau*. Mexer no ritmo não muda quem aparece como pronto.
  - A view `alunos_frequencia` **não** precisou ser recriada: a coluna é em `professor_perfil`, tabela que a view nunca referencia. Confirmado no DDL da `010` antes de escrever a migration.
- **Foto da aula, com upload real para o Supabase Storage.** Uma foto por aula, tirada com a turma, enviada da câmera ou da galeria pelo modal da aula. Sem prazo de corte: nada no fluxo olha a data da aula, então subir hoje a foto de uma aula de junho é o mesmo caminho — mesmo padrão do link do YouTube. Migration `012_foto_aula`.
  - **Bucket privado por causa das crianças, não do custo.** `aulas-fotos` é privado e as URLs são assinadas na leitura, com validade de 1h; sem sessão ninguém vê a imagem, nem de posse do link. O volume não pesava na decisão (uma foto por aula, ~10 MB/ano) — a turma tem faixas infantis, e bucket público seria obscuridade, não proteção.
  - **A coluna é `foto_path`, não `foto_url`.** Com bucket privado não há URL estável para guardar: o banco guarda o caminho, e `foto_url` passa a ser campo derivado montado em `carregarDados()`, assinado em lote numa chamada só para as até 50 aulas da listagem.
  - **Compressão obrigatória no client, sem dependência nova** — canvas nativo, 1200px na maior dimensão e JPEG 0.75, mirando 150-300 KB. O `sharp` do projeto roda no Node, não no browser. A orientação EXIF é aplicada no rasterize, senão a foto tirada em pé sobe deitada. O bucket ainda limita a 2 MB e só aceita JPEG, como rede de segurança do lado do servidor.
  - A foto é gravada no momento do upload, não no "Salvar alterações", pelo mesmo motivo da chamada rápida — e a `referrerPolicy="no-referrer"` do lote 3 vale também para a miniatura no card e para o preview no modal.
  - **A URL vencida se recupera sozinha**: o componente `FotoAula` reassina no `onError` e repõe a imagem, com uma tentativa por exibição bem-sucedida (rearmada no `onLoad`) para que um objeto apagado do bucket erre duas vezes e pare, em vez de entrar em ciclo.
  - **HEIC do iPhone falha visível, nunca em silêncio.** Quando o navegador não decodifica, o `createImageBitmap` rejeita antes de qualquer upload e o professor lê "formato não suportado pelo navegador" — nenhum byte vai ao Storage e nenhuma coluna é escrita. No aparelho do professor o caso não chega a aparecer: o iOS converte para JPEG no próprio input (verificado em aparelho real). Como o reencode sempre produz JPEG, o formato de entrada nunca viola o `allowed_mime_types` do bucket.
  - Fica registrada uma dívida: a purga da lixeira apaga a linha da aula, mas não o arquivo no bucket — o cascade do Postgres não alcança o Storage.
- **Lote 3 da auditoria: purga da lixeira, `referrerPolicy` e dois atritos de toque.**
  - **A lixeira passa a apagar de verdade.** Migration `011_purga_lixeira`: `purgar_lixeira()` agendada no `pg_cron` para 04:00 UTC todo dia, apagando fisicamente `alunos`, `aulas` e `graduacoes` com `deleted_at` além dos 7 dias. Fecha a pendência que a própria `005_soft_delete` deixou registrada — até aqui o item sumia da tela e a linha ficava no banco para sempre, enquanto a interface prometia o contrário. Os `on delete cascade` da `001`, dormentes porque nada nunca era apagado de fato, passam a valer: purgar um aluno leva junto presenças e histórico de graduações. A função é revogada de `anon`/`authenticated` — sem isso o PostgREST a publicaria como RPC, com exclusão definitiva a um `fetch` de distância.
  - **Foto de aluno para de vazar referrer.** `referrerPolicy="no-referrer"` nos três `<img>` que renderizam `foto_url` (card da lista, linha da chamada e o `AvatarImage` de "Prontos para graduar"). Como a foto é URL externa colada à mão, cada carregamento entregava o endereço do app ao host da imagem. É remendo de curto prazo: upload real via Storage continua pendente.
  - **Menos toques para graduar.** O card "Prontos para graduar" abre o modal do aluno já na aba Graduação (`tabInicial`), em vez de cair no perfil. "Perto da faixa" e a lista de alunos seguem abrindo no perfil.
  - **O ✕ de apagar aula vira alvo de 44×44.** Era ~18px dentro de um card cujo resto abre a chamada, e já causou exclusão acidental em teste. As margens negativas fazem a área crescer para dentro do padding do card, sem aumentar a altura dele nem mexer no glifo.
  - **Documentação passa a ser atualizada em toda sessão**, dentro do repositório, no lugar da manutenção manual fora do código (ver a regra 7 do processo, no `CLAUDE.md`).
- **Frequência conta aulas reais** (`5bb217c`) — `total_aulas` contava linhas de `presencas`, não aulas que aconteceram; como falta não gera registro, quase todo aluno aparecia com ~100%. Mata de quebra a divergência entre o crachá de frequência e o selo AFASTADO, que liam fontes diferentes sobre o mesmo fato. Uma falha de carga passa a preservar o que já está na tela, com aviso — rede instável no tatame não pode transformar a turma inteira em "nenhum aluno". Migration `010_frequencia_por_aulas`.
- **PWA instalável** (`c59ef4e`) — manifest, ícones gerados do logo real da academia (`scripts/gerar-icones.mjs`) e banner de "instale no celular". O service worker é mínimo e **sem cache** de propósito: ele existe porque o Chrome exige um SW com handler de `fetch` para considerar o app instalável, e cachear resposta do Supabase mostraria chamada desatualizada no tatame. Resolve de passagem o `GET /manifest.json` 404.
- **Login real via Supabase Auth e RLS travada** — o app passa a exigir e-mail e senha (`signInWithPassword`), com a sessão persistindo entre aberturas do navegador. As policies deixam de liberar tudo para `anon` e passam a exigir usuário autenticado nas 5 tabelas e na view; `anon` perde até o `select`. Migration `009_rls_authenticated`.
  - **`NEXT_PUBLIC_PROFESSOR_PIN` removido.** Era uma variável morta — nenhum código a lia, e nenhuma tela de PIN chegou a existir, então não protegia nada. O papel dela foi assumido por autenticação de verdade.
  - Corrige de passagem a pendência **"perfil do professor não encontrado"**: a tabela `professor_perfil` nasceu na migration 004, depois da 002 e da 003, e nunca recebeu policy nem `grant` — o erro real era `42501 permission denied`, não dado ausente.
  - A carga inicial de dados saiu do server component para o cliente: com a RLS exigindo sessão, buscar no servidor voltaria vazio, porque o token vive no browser.

## 2026-08-04

- **Filtros de aluno** (`1453ef2`) — barra de chips na lista: faixa, prontos para graduar, afastados e categoria de idade, combináveis em AND. Afastado tem cálculo automático por 21 dias sem presença (`lib/afastamento.ts`) com override manual do professor. Migration `008_afastado_manual`.
- **Link do YouTube na aula** (`fbceb5e`) — campo opcional validado para domínios do YouTube, com botão "Assistir aula" no card. O modal de aula passou a editar todos os campos, não só criar. Migration `007_link_youtube`.
- **Chamada rápida em tela única** (`0d77e18`) — uma linha por aluno, um toque alterna presença e grava na hora por upsert, sem botão "Salvar". Busca por nome, contador ao vivo e "Marcar todos". Migration `006_presenca_autoria` (`confirmado_por`/`confirmado_em`). Removida a rota `app/api/aulas/route.ts`.
- **Lixeira recuperável de 7 dias** (`adbc91f`) — apagar aluno, aula ou graduação passa a carimbar `deleted_at` em vez de remover a linha, com aba para restaurar. Migration `005_soft_delete`.

## 2026-08-03

- **Edição de aluno já cadastrado** (`b27c2d5`) — nome, nascimento, faixa, graus e demais campos. Corrigiu o bug em que o campo derivado `historico_graduacoes` vazava no payload do update e derrubava a request inteira (PGRST204); a correção foi a whitelist explícita de colunas, hoje padrão do projeto.

## 2026-07-29

- **Vídeo de abertura** (`ba2e760`) — a splash animada foi substituída por vídeo.

## 2026-07-28

- **Splash screen de entrada** (`a6577d2`) — logo e "OSS Professor".
- **Dashboard do professor redesenhado** (`1a231b3`) — Tailwind + shadcn/ui.
- **Histórico de graduações no perfil do aluno** (`eb81daf`).
- **Gravação automática do histórico de graduação** (`e5e8f59`) — ao mudar faixa/grau.
- **Alertas visuais de graduação** (`a71fd66`) — sugestão, nunca bloqueio.
- **Exceções de tempo mínimo e graduação provisória** (`e61aa78`) — art. 3.1.3 e art. 7°.
- **Data de nascimento, categoria etária e faixas infantis** (`cc717c2`).
- **Perfil do professor e validação de assinatura** (`4c8df9e`) — art. 6°. Migration `004_ibjjf_regras`.

## 2026-07-08

- **Tailwind CSS instalado e configurado** (`24f25ca`).
- **Imagem do hero** (`49ba38b`).

## 2026-07-07

- **Hero com foto real** (`7bde2ea`) — no lugar do placeholder SVG.
- **Paleta monocromática** (`24c1fcd`) — remove verde e laranja, fica preto/vermelho/branco.
- **Nova direção visual** (`5225e14`) — hero, insights e crachás circulares.

## 2026-06-18

- **Commit inicial** (`052041d`) — app GrauMestre. Migrations `001_initial`, `002_rls_policies` e `003_grants`.
