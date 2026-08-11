# Changelog

Histórico de mudanças do GrauMestre, da mais recente para a mais antiga.
As datas vêm do histórico do Git; as migrations citadas estão em `supabase/migrations/`.

O projeto não usa versionamento semântico — não há releases publicadas. Cada
entrada corresponde a um commit na `main`.

---

## Não lançado

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
