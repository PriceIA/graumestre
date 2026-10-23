# PLANO-ATUAL.md — Lote v2 em andamento (G0 a G3 concluídas, próxima: G4)

**Plano mestre: `docs/ROADMAP.md`.** Branch de trabalho: `desenvolvimento`
(a `main` é o site no ar). Plano da G0: `docs/superpowers/plans/2026-10-21-g0-preparar-terreno.md`.

| Fase | Estado |
|---|---|
| G0 Preparar o terreno | **CONCLUÍDA** (2026-10-21, testada no `localhost` e aprovada pelo Pedro) — backup verificado, migrations 001–014 conferidas, branch criado, permissão de leitura das skills liberada |
| G1 Ping do Supabase (vai direto para a `main`) | **CONCLUÍDA e PUBLICADA** (2026-10-22). Migration 015 aplicada; na `main` é o commit `039b3eb` (cherry-pick do `bbae981`). Em produção o Pedro rodou o cron à mão duas vezes: `GET /api/ping` 200 nos Request Logs da Vercel |
| G2 PRODUCT.md e DESIGN.md | **CONCLUÍDA** (2026-10-22, aprovada pelo Pedro). Decisão 1: alerta âmbar (opção A). Só documento, sem código nem migration |
| G3 Fundação visual | **CONCLUÍDA** (2026-10-22, testada no `localhost` e aprovada pelo Pedro; commits `b6ff404` a `0cadf11`). Tokens e temas, `lib/cores.ts`, `checar-cores`, barra de abas e menu lateral. Sem migration. Pendências adiadas por decisão do Pedro: ver a lista abaixo da tabela |
| G4 Correção de datas | **EM ANDAMENTO.** Decisão 3 aprovada pelo Pedro em 2026-10-23. **G4.1** (`lib/datas.ts`, `hojeBrasil()`/`anoDaData()`, 18 testes; só código): **CONCLUÍDA**, conferida pelo Pedro, commit `3898fa6`. **G4.2** (migration 016: aula futura não conta): **CONCLUÍDA.** Backup novo em `C:\Backups\graumestre\2026-10-23` antes; 016 aplicada pelo Pedro; md5 das 4 contagens idêntico antes/depois (`55d51351…`); 24 colunas na ordem; anon sem nada e authenticated só `SELECT` (SQL e API); teste com aula `ZZ-TESTE-G4` em 26/10 sem mudar nada na tela nem na view, apagada de vez pelo Pedro, linha de base 33/5/59/29. **G4.3** (3 registros errados do passado: aula 09/09, graduação 11/09, `inicio` 19/06): um `UPDATE` por id, decisão um a um do Pedro; nada corrigido até lá |
| G5 em diante | PENDENTE, na ordem do ROADMAP |

**Adiado da G3 (decisão do Pedro, 2026-10-22):**

- **Sidecar `.impeccable/design.json`:** não foi gerado na G3. Fica para a **G8 ou a G13**.
- **Quatro pontos de revisão da G3, para a G5 e a G12** (a divisão entre as duas fases não foi definida; decidir ao abrir cada uma):
  1. `maximumScale: 1` no viewport bloqueia o zoom (`app/layout.tsx`; já existia antes da G3).
  2. Faltam `touch-action: manipulation` e `overscroll-behavior: contain` nos modais.
  3. A meta `theme-color` segue o celular, não o tema escolhido no menu.
  4. O histórico de graduações do modal do aluno só atualiza depois de recarregar (a gravação está certa).
- **Dívida anterior à G3, ainda aberta:** o rodapé do modal do aluno sobrepõe o conteúdo no Chrome (`<fieldset>` com `overflowY:auto`; ver `CLAUDE.md`, "Tema e navegação").

**Achado da G0 que vira requisito da G9:** a RLS está desligada em `alunos`,
`aulas`, `graduacoes` e `presencas` em produção (só o `GRANT` protege). Ver
`CLAUDE.md` (seção Stack) e `docs/ROADMAP.md` (G9).

---

*(O texto abaixo é o procedimento permanente deste arquivo.)*

# Como este arquivo funciona

Não há lote de trabalho ativo agora. **O `CLAUDE.md` diz como o projeto é;
este arquivo diz o que está sendo feito e onde paramos** — quando não há
nada em andamento, ele fica assim: vazio, esperando o próximo lote.

Não é histórico. O último lote (agosto/2026 — faixa desenhada com graus,
filtros num painel, card de vídeo da aula, entre outras etapas) está
registrado no `CHANGELOG.md`, entrada por entrada, e o que virou verdade
permanente do projeto já migrou para o `CLAUDE.md`.

---

## Como o Claude Code usa este arquivo

Igual sempre foi neste projeto, resumido aqui para quando o próximo lote
começar:

1. Ler `CLAUDE.md` inteiro antes de tocar em qualquer coisa.
2. Ler este arquivo (quando tiver um plano vivo) e achar a primeira etapa
   `PENDENTE`. Etapa seguinte não começa antes da anterior estar
   `CONCLUÍDA` e commitada.
3. Ler o código real da etapa antes de propor qualquer coisa — nunca de
   memória, nem deste arquivo.
4. Apresentar um plano curto e esperar o "ok" antes de escrever a primeira
   linha. Decisão de produto (navegação, modelagem de dado, texto que o
   professor lê no tatame) é perguntada, nunca suposta.
5. Implementar. Migration nova é SQL pronto e numerado em
   `supabase/migrations/`, **rodado à mão pelo usuário** — parar e avisar
   claramente, não seguir para os testes antes da confirmação.
6. `npx tsc --noEmit` limpo, `npm run dev` subindo, teste manual no
   `localhost` relatado teste por teste, conferido no banco quando fizer
   sentido. Teste que falha: parar e reportar, nunca commitar por cima.
   **O usuário confere no `localhost` antes do commit** — não presumir "ok"
   a partir do próprio teste.
7. Limpar dado de teste criado durante a verificação.
8. Atualizar `CLAUDE.md`, `CHANGELOG.md` e este arquivo antes do commit —
   faz parte de "pronto", não uma etapa à parte.
9. Commit. Uma etapa, um commit.
10. **`git push` para a `origin` e conferir que a Vercel disparou o deploy
    a partir da `main`** (`vercel ls` ou o dashboard) — faz parte de
    "pronto" tanto quanto o commit. Ver o `CLAUDE.md` para o porquê: 11
    commits de um dia inteiro já ficaram parados só no `main` local por
    esse passo não existir no processo.

## Fila conhecida (não é plano — lembrete para quando um lote começar)

Sem ordem de prioridade fixada:

- Fila offline da chamada — hoje um toque na chamada com a rede caída se
  perde. Ligado à decisão de o service worker não cachear nada (ver PWA no
  CLAUDE.md); offline precisa de invalidação decidida antes da primeira
  linha de código.
- Foto do aluno por upload real (Supabase Storage) — hoje é URL externa
  colada à mão (`referrerPolicy` é o remendo, não a solução).
- Ping/keep-alive do Supabase.
- Layout novo (desenho do usuário) — inclui decidir o que fazer com
  `components/AppShell.tsx` (2.500+ linhas), que nenhum lote recente teve
  espaço de refatorar no meio de mudanças de comportamento.
- Login de aluno, com permissão só de confirmar a própria presença — o
  campo `presencas.confirmado_por` já está desenhado para isso (ver
  CLAUDE.md).
- **Passo 6 (geração de PDF)** — parado desde 2026-08-04, sem escopo
  registrado em lugar nenhum do repositório. Quem retomar levanta o escopo
  com o usuário antes de planejar, não assume a partir do nome.
