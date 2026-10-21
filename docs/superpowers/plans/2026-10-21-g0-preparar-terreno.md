# G0 — Preparar o terreno: plano de implementação

> **Para quem executa:** usar superpowers:executing-plans (tarefas pequenas, sequenciais, sem subagentes — a G0 é rotina e quase tudo é conferência). Passos em checkbox.

**Goal:** deixar o projeto pronto para a v2: backup verificado dos dados e das fotos, produção conferida contra as migrations 001–014, branch `desenvolvimento` publicado e documentos de trabalho criados. **Nenhum comportamento do app muda.**

**Architecture:** o backup tem duas camadas independentes (dump SQL completo + exportação por API autenticada com fotos), ambas **fora do repositório**. Só depois do backup verificado se mexe em git.

**Tech Stack:** PostgreSQL client tools (`pg_dump`), Node 24 + `@supabase/supabase-js` (já no projeto), Git, Supabase SQL Editor (só leitura).

**Spec:** `docs/ROADMAP.md`, seção G0 e regras de ouro 1–3, 6–9.

## Global Constraints

- Dados dos alunos intocáveis: **somente leitura** no banco e no bucket durante toda a G0. Nenhuma migration.
- Backup **fora do repo** e nunca no git (proposta: `C:\Backups\graumestre\2026-10-21\`).
- Credenciais (senha do banco, senha do professor) **nunca** coladas no chat, gravadas em arquivo do repo ou em log: entram por variável de ambiente na sessão do terminal.
- Trabalho no branch `desenvolvimento`; a `main` não recebe nada na G0.
- Antes de cada commit: `npx tsc --noEmit` limpo; `CLAUDE.md`, `CHANGELOG.md` e `docs/PLANO-ATUAL.md` atualizados.
- Depois do push: `git log origin/desenvolvimento..desenvolvimento` vazio (regra 8 do CLAUDE.md).

## Review Focus

- Backup "bem-sucedido" que saiu vazio ou truncado (RLS devolve 0 linhas sem erro para sessão sem login) → contagens do backup comparadas com contagens no banco.
- Foto no bucket sem linha em `aulas` (órfã, pendência 3 do CLAUDE.md) ou linha com `foto_path` sem arquivo → relatório das duas diferenças, sem apagar nada.
- Lixeira: linhas com `deleted_at` precisam entrar no backup (não filtrar por `deleted_at is null`).
- Arquivo de backup com dado de crianças parar no git/OneDrive/nuvem sem querer → pasta fora do repo, conferir que não está dentro de pasta sincronizada.
- `docs/ROADMAP.md` e `docs/direcoes/` hoje não estão versionados (untracked na `main`): entram no primeiro commit do `desenvolvimento`, não na `main`.

## Pontos que precisam de decisão ou ação do Pedro (levantados na leitura do ambiente)

1. **Não há `pg_dump`, `psql` nem Supabase CLI instalados.** O `.env.local` só tem a chave `anon`, que com a RLS atual não lê nada sem login. Para o dump SQL real preciso que o Pedro: (a) autorize instalar o cliente PostgreSQL (winget, só as ferramentas de linha de comando) e (b) pegue a connection string em Supabase → Connect → *Session pooler* e a coloque numa variável de ambiente **na própria janela do terminal dele** (eu digo o comando; a senha não passa pelo chat).
2. **A exportação por API precisa do apelido e senha do professor**, também por variável de ambiente local, pelo mesmo motivo.
3. **Caminho do projeto:** o ROADMAP cita `A:\Graumestre\graumestre`; este checkout está em `C:\Projetos\graumestre`. Vou trabalhar aqui, salvo se o Pedro disser o contrário.
4. **Pasta do backup:** `C:\Backups\graumestre\2026-10-21\` serve? (Precisa ficar fora de OneDrive/pasta sincronizada.)
5. **`/plugin`, `/mcp` e `/permissions` são comandos interativos do Claude Code** — não consigo rodá-los. Verifico o que dá pelos arquivos; o que faltar, o Pedro roda.

## File Structure

- Create: `scripts/backup-graumestre.mjs` — exporta tabelas (JSON + CSV) e baixa o bucket; lê credenciais do ambiente; sem segredo no arquivo. Fica no repo porque a G9 exige novo backup antes da maior migration.
- Create: `docs/COMO-USAR-SKILLS.md` — qual skill usar em qual fase.
- Modify: `docs/PLANO-ATUAL.md` — aponta para a G1.
- Modify: `CLAUDE.md` — seção "Branches e site no ar".
- Modify: `CHANGELOG.md` — entrada da G0.
- Fora do repo: `C:\Backups\graumestre\2026-10-21\{dump.sql, api\*.json, api\*.csv, fotos\**, MANIFESTO.txt}`.

---

### Task 1: Backup do banco (dump SQL + exportação por API)

**Files:**
- Create: `scripts/backup-graumestre.mjs`
- Escreve fora do repo: pasta de backup acima

**Interfaces:**
- Produces: pasta de backup + `MANIFESTO.txt` (contagem de linhas por tabela, nº de fotos, tamanho, SHA-256 de cada arquivo). A Task 2 e a G9 reutilizam o script.

- [ ] **Step 1: Instalar o cliente PostgreSQL** (com autorização do Pedro). Verificação: `pg_dump --version` imprime a versão.
- [ ] **Step 2: Pedro define `PGCONN` (session pooler) no terminal dele.** Rodar `pg_dump --no-owner --no-privileges --schema=public --schema=storage -f dump.sql "$PGCONN"`; para o `auth`, `pg_dump --data-only --table=auth.users` (as contas dos `apelido@graumestre.app` fazem parte do que "não pode se perder"). Esperado: `dump.sql` > 0 bytes contendo `CREATE TABLE public.alunos` e `COPY public.alunos`.
- [ ] **Step 3: Implementar `scripts/backup-graumestre.mjs`.** Entrada: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (do `.env.local`), `GM_APELIDO`, `GM_SENHA`, `BACKUP_DIR` (todos de ambiente). Faz `signInWithPassword('<apelido>@graumestre.app')`, e para `alunos`, `aulas`, `graduacoes`, `presencas`, `professor_perfil` e a view `alunos_frequencia` pagina com `.range()` em lotes de 1000 **sem filtrar `deleted_at`**, gravando `.json` e `.csv`. Aborta com erro claro se o login falhar (nunca grava backup vazio em silêncio).
- [ ] **Step 4: Rodar o script e conferir contagens.** Esperado: no `MANIFESTO.txt`, linhas por tabela iguais a `select count(*)` feito pelo Pedro no SQL Editor (inclui itens da lixeira).
- [ ] **Step 5: Conferir que o dump e o JSON concordam** (nº de `COPY` de `alunos` no `dump.sql` == nº de linhas de `alunos.json`).

### Task 2: Backup das fotos do bucket `aulas-fotos`

**Files:**
- Modify: `scripts/backup-graumestre.mjs` (etapa de fotos, mesma sessão autenticada)

**Interfaces:**
- Consumes: sessão e `BACKUP_DIR` da Task 1; `aulas.foto_path` do backup JSON.
- Produces: `fotos/<aula_id>/<uuid>.jpg` + seção "Fotos" no `MANIFESTO.txt`.

- [ ] **Step 1: Listar o bucket** (`storage.from('aulas-fotos').list` recursivo por pasta de aula) e baixar cada objeto com `download()` — a policy `aulas_fotos_select` já permite a `authenticated`.
- [ ] **Step 2: Gerar o relatório de diferenças:** `foto_path` sem arquivo (perda) e arquivo sem linha em `aulas` (órfão). **Só relata, não apaga.** Esperado: lista (pode ser vazia) no manifesto.
- [ ] **Step 3: Verificar integridade:** nº de arquivos baixados == nº de objetos listados; cada arquivo > 0 bytes e começa com os bytes JPEG `FF D8`. Abrir 2–3 fotos na mão.
- [ ] **Step 4: Teste de restauração mínimo:** Pedro abre o `alunos.csv` (colunas legíveis) e eu confiro que o `dump.sql` carrega num banco descartável **local**, se o Pedro quiser a prova completa (opcional; não toca produção).
- [ ] **Step 5: Commit** (só o script; backup nunca entra): primeiro rodar `git status` e confirmar que nenhum arquivo de `C:\Backups` aparece. Mensagem: `chore: script de backup do banco e das fotos`. Vai no branch `desenvolvimento` (Task 4), não na `main`.

### Task 3: Conferir migrations 001–014 em produção (só leitura)

**Files:**
- Nenhum arquivo do repo muda. Resultado entra no `MANIFESTO.txt` e no `CHANGELOG.md`.

- [ ] **Step 1: Entregar ao Pedro um único `SELECT` read-only** para colar no SQL Editor, verificando uma assinatura por migration: colunas (`aulas.link_youtube` 007, `alunos.afastado_manual` 008, `aulas.foto_path` 012, `professor_perfil.meses_entre_graus` e `presencas_por_grau` 013/014), colunas da view (`presencas_desde_graduacao`, `aulas_desde_graduacao` 014), função `purgar_lixeira` e job em `cron.job` (011), bucket e 4 policies `aulas_fotos_*` (012), policies `authenticated` e ausência de `anon` (009), `presencas.confirmado_por` (006).
- [ ] **Step 2: Comparar o resultado com o esperado.** Esperado: todas as assinaturas presentes. Qualquer ausência → **parar e reportar**; não aplicar nada.
- [ ] **Step 3: Registrar** o resultado (tabela migration → assinatura → ok) no manifesto.

### Task 4: Branch `desenvolvimento` e documentos de trabalho

**Files:**
- Create: `docs/COMO-USAR-SKILLS.md`
- Modify: `docs/PLANO-ATUAL.md`, `CLAUDE.md`, `CHANGELOG.md`
- Versionar (hoje untracked): `docs/ROADMAP.md`, `docs/direcoes/gm-kimono.html`, `docs/superpowers/plans/2026-10-21-g0-preparar-terreno.md`

**Interfaces:**
- Produces: branch `origin/desenvolvimento`, base de G1 em diante (exceto G1, que vai para a `main`).

- [ ] **Step 1:** `git checkout -b desenvolvimento` a partir da `main` (arquivos untracked acompanham). Esperado: `git branch --show-current` → `desenvolvimento`.
- [ ] **Step 2: Escrever `docs/COMO-USAR-SKILLS.md`:** tabela fase → skills (da seção 5 do ROADMAP), com o aviso de que Impeccable/Taste/Vercel só entram nas fases indicadas.
- [ ] **Step 3: `docs/PLANO-ATUAL.md`** passa de "nenhum lote em andamento" para "Lote v2 em andamento — G0 concluída, próxima: G1 (ping)", apontando para `docs/ROADMAP.md`.
- [ ] **Step 4: `CLAUDE.md` — seção "Branches e site no ar":** `main` = site no ar, só recebe merge quando o Pedro mandar (exceção G1); trabalho no `desenvolvimento`; banco único compartilhado; migration avisada antes e aplicada pelo Pedro; **ajustar a regra 8** para "push do branch de trabalho". Conferir se a Vercel gera preview do branch `desenvolvimento` (e se esse preview apontaria para o banco de produção — se sim, registrar o risco).
- [ ] **Step 5: `CHANGELOG.md`:** entrada G0 (backup feito e verificado, migrations conferidas, branch criado). Sem apontar caminhos ou segredos.
- [ ] **Step 6: Verificar:** `npx tsc --noEmit` limpo; `npm run dev` sobe; app idêntico no `localhost` (login, lista de alunos, uma aula). Esperado: nenhuma mudança visível.
- [ ] **Step 7: Commit e push:** `git add` explícito dos arquivos acima; `git push -u origin desenvolvimento`; conferir `git log origin/desenvolvimento..desenvolvimento` vazio e `git status` limpo.

### Task 5: Skills, MCPs e permissão de leitura das skills

**Files:**
- `~/.claude/settings.json` (usuário, fora do repo) — só com autorização explícita do Pedro.

- [ ] **Step 1: Inventário pelos arquivos** (`~/.claude/plugins/cache`, `~/.claude/skills`): já vistos Superpowers, Impeccable, UI UX Pro Max e i-have-adhd; Chrome DevTools MCP disponível. **Verificar** Taste, Vercel `react-best-practices`, `web-design-guidelines` e Vercel MCP. Entregar ao Pedro a lista do que falta e o comando de instalação.
- [ ] **Step 2:** adicionar `Read(~/.claude/skills/**)` à lista de permissões (via skill `update-config`, mostrando o diff ao Pedro antes) ou o Pedro faz em `/permissions`.
- [ ] **Step 3: Pedro roda `/plugin` e `/mcp`** e confirma o inventário.

---

## Ordem e critério de pronto

Ordem: **1 → 2 → 3 → 4 → 5.** Nada de git antes do backup verificado. G0 só está "pronta" quando: backup com manifesto conferido contra o banco; 14 migrations confirmadas; `desenvolvimento` no `origin` sem commits pendentes; app igual no `localhost`; Pedro testou e aprovou (regra 6). Ao terminar, aviso o modelo da G1 (Sonnet 5.5, Medium) e termino com "Próximo passo — o que digitar".

## Auto-revisão

- Cobertura do ROADMAP G0: itens 1→T5, 2→T1/T2, 3→T3, 4→T4, 5→T4, 6→T5. ✔
- Acréscimos além do ROADMAP, para o Pedro vetar: dump de `auth.users` (T1.2), script de backup versionado (reuso na G9), relatório de fotos órfãs (T2.2), conferência do preview da Vercel (T4.4).
