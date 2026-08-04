# Changelog

Histórico de mudanças do GrauMestre, da mais recente para a mais antiga.
As datas vêm do histórico do Git; as migrations citadas estão em `supabase/migrations/`.

O projeto não usa versionamento semântico — não há releases publicadas. Cada
entrada corresponde a um commit na `main`.

---

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
