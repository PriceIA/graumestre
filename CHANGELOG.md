# Changelog

Histórico de mudanças do GrauMestre, da mais recente para a mais antiga.
As datas vêm do histórico do Git; as migrations citadas estão em `supabase/migrations/`.

O projeto não usa versionamento semântico — não há releases publicadas. Cada
entrada corresponde a um commit na `main`.

---

## Não lançado

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
