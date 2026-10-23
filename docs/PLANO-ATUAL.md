# PLANO-ATUAL.md — Lote v2 em andamento (G0 a G5 concluídas, próxima: G6)

**Plano mestre: `docs/ROADMAP.md`.** Branch de trabalho: `desenvolvimento`
(a `main` é o site no ar). Plano da G0: `docs/superpowers/plans/2026-10-21-g0-preparar-terreno.md`.

| Fase | Estado |
|---|---|
| G0 Preparar o terreno | **CONCLUÍDA** (2026-10-21, testada no `localhost` e aprovada pelo Pedro) — backup verificado, migrations 001–014 conferidas, branch criado, permissão de leitura das skills liberada |
| G1 Ping do Supabase (vai direto para a `main`) | **CONCLUÍDA e PUBLICADA** (2026-10-22). Migration 015 aplicada; na `main` é o commit `039b3eb` (cherry-pick do `bbae981`). Em produção o Pedro rodou o cron à mão duas vezes: `GET /api/ping` 200 nos Request Logs da Vercel |
| G2 PRODUCT.md e DESIGN.md | **CONCLUÍDA** (2026-10-22, aprovada pelo Pedro). Decisão 1: alerta âmbar (opção A). Só documento, sem código nem migration |
| G3 Fundação visual | **CONCLUÍDA** (2026-10-22, testada no `localhost` e aprovada pelo Pedro; commits `b6ff404` a `0cadf11`). Tokens e temas, `lib/cores.ts`, `checar-cores`, barra de abas e menu lateral. Sem migration. Pendências adiadas por decisão do Pedro: ver a lista abaixo da tabela |
| G4 Correção de datas | **CONCLUÍDA** (2026-10-23), com uma pendência (ver abaixo da tabela). Decisão 3 aprovada pelo Pedro em 2026-10-23. **G4.1** (`lib/datas.ts`, `hojeBrasil()`/`anoDaData()`, 18 testes; só código): **CONCLUÍDA**, conferida pelo Pedro, commit `3898fa6`. **G4.2** (migration 016: aula futura não conta): **CONCLUÍDA.** Backup novo em `C:\Backups\graumestre\2026-10-23` antes; 016 aplicada pelo Pedro; md5 das 4 contagens idêntico antes/depois (`55d51351…`); 24 colunas na ordem; anon sem nada e authenticated só `SELECT` (SQL e API); teste com aula `ZZ-TESTE-G4` em 26/10 sem mudar nada na tela nem na view, apagada de vez pelo Pedro, linha de base 33/5/59/29. **G4.3** (3 registros errados do passado, um `UPDATE` por id, decisão um a um do Pedro): **2 corrigidos, 1 pendente.** Aula `13934eaa` de 09/09 para 08/09 e `inicio` do Pedro Henrique (`dc16d3a4`) de 19/06 para 18/06, rodados pelo Pedro em 2026-10-23 e conferidos por id; Frequência geral 25% → 26%, como previsto. A graduação da Aninha (`17849d3e`, 11/09) **não** foi corrigida |

| G5 Tela de Alunos | **CONCLUÍDA** (2026-10-23, conferida pelo Pedro tarefa a tarefa no `localhost` e no iPhone; commits `189fc7a` a `beab72d` e o de fechamento). Sem migration. Design e plano em `docs/superpowers/specs/2026-10-23-g5-alunos-design.md` e `docs/superpowers/plans/2026-10-23-g5-alunos.md`. Teste completo no banco real com `ZZ-TESTE-G5` em 390 px e 1280 px; apagado de vez pelo Pedro; linha de base 33/5/59/29. Revisão final por revisor de fora: 1 Importante corrigido, 6 Menores registrados (abaixo) |
| G6 em diante | PENDENTE, na ordem do ROADMAP |

**Adiado da G3 (decisão do Pedro, 2026-10-22):**

- **Sidecar `.impeccable/design.json`:** não foi gerado na G3. Fica para a **G8 ou a G13**.
- **Pontos de revisão da G3 (resolvidos na G5, exceto o `theme-color`):**
  1. ~~`maximumScale: 1` bloqueia o zoom~~ — **fechado na G5.2** (campos em 16 px, testado no iPhone).
  2. `touch-action: manipulation` e `overscroll-behavior: contain`: **feitos nas folhas de Alunos** (ficha, painel de filtros); **faltam** nos modais de Aulas, Chamada, Perfil, Prontos e Menu — entram na G6 a G8, com cada tela.
  3. A meta `theme-color` segue o celular, não o tema escolhido no menu — **continua para a G12**.
  4. ~~Histórico de graduações do modal só atualiza ao recarregar~~ — **fechado na G5.2** (recarrega depois de graduar e de apagar graduação).
- ~~**Dívida anterior à G3:** rodapé do modal do aluno sobreposto~~ — **fechada na G5.2** (rolagem numa `<div>` por fora do `<fieldset>`).

**Pendente da G4 (decisão do Pedro, 2026-10-23):**

- **Graduação da Aninha gravada em 11/09, devia ser 10/09** (`17849d3e-bb5f-4442-94bf-28792bb4a5c8`; branca 1º grau → branca 0, gravada às 23h23 de 10/09). Não corrigida porque a view conta "desde o último grau" com `au.data >= data da graduação`: aula no mesmo dia da graduação conta como depois dela. Movida para 10/09, a aula de 10/09 entraria na conta da Aninha sem presença dela. **Resolver junto com a regra do mesmo dia** (aula e grau no mesmo dia: a aula vem antes ou depois do grau?), que é decisão do Pedro e provavelmente migration de view. O `UPDATE` já pronto, para quando a regra estiver decidida: `update graduacoes set data = '2026-09-10' where id = '17849d3e-bb5f-4442-94bf-28792bb4a5c8' and data = '2026-09-11' returning id, data;`
- **`docs/schema.sql` parou na 011** (não tem as colunas da 014 nem a 016). Achado na G4, não atualizado.

**Menores da revisão final da G5 (registrados, não corrigidos — decisão do Pedro quando quiser):**

- Computador: o `setTimeout` de 220 ms do fechar pode fechar a ficha que o professor abriu logo depois de salvar ou apagar (a ficha fixa não tem animação de saída). No Apagar, o `setFicha(null)` roda duas vezes.
- Esc, pano escuro e Cancelar durante "Salvando…" fecham sem perguntar; se o save falhar depois, o erro se perde (o Cancelar já era assim antes da G5).
- O Esc é escutado no `document`: com `PainelFiltros`, menu ou Perfil por cima da ficha fixa, ele age na ficha de trás.
- `LinhaAluno`: a foto quebrada não é reavaliada quando `foto_url` muda (mostra a inicial até recarregar).
- "Ver N alunos" do `PainelFiltros` ignora a busca (com busca ativa o número não bate com a lista).
- Celular: a ficha aberta pela tela de Alunos cobre tudo mas não tem `aria-modal`, e o foco não volta à linha ao fechar.

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
