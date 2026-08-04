# CLAUDE.md — GrauMestre

Memória de trabalho para sessões futuras do Claude Code neste projeto. Leia antes de mexer em qualquer coisa.

## O que é

App de gestão de alunos e aulas de jiu-jítsu, para **um professor faixa preta**, usado **no tatame, no celular, com pressa**. Não é um SaaS multi-academia; é a ferramenta de trabalho de uma pessoa.

**Filosofia central: funcionalidade antes de estética.** Se a escolha for entre uma tela mais bonita e uma tela que resolve em menos toques, ganha a que resolve. A chamada rápida é o exemplo canônico: uma linha por aluno, um toque, salva na hora, sem botão "Salvar" — porque o professor sai da tela no meio e o que já foi tocado tem que estar no banco.

## Stack e decisões conscientes

- **Next.js 14 (App Router) + Supabase + Tailwind**, deploy na Vercel a partir da `main` (`PriceIA/graumestre`).
- **Supabase client-side direto, sem rotas de API.** O app fala com o PostgREST do browser. Não crie `app/api/*` para funcionalidade nova.
  *Pendência:* sobraram dois arquivos órfãos, `app/api/alunos/route.ts` e `app/api/graduacoes/route.ts` — código morto, zero referências no app. O terceiro (`api/aulas`) já foi removido.
- **`components/AppShell.tsx` usa inline styles, não classes Tailwind.** É o componente principal e concentra quase toda a UI. Siga o padrão dele ao editá-lo — não misture `className` do Tailwind lá dentro. O Tailwind é usado no `DashboardProfessor` e nos `components/ui/*` (shadcn), que são outra geração de código.
- **RLS ligado, mas com policies liberando tudo para `anon`** (migration 002). O efeito prático é o de RLS desligado. É consciente e temporário: sem login, toda request chega como `anon`.

## Padrão obrigatório: whitelist explícita de colunas

**Nunca espalhe um objeto de estado inteiro num `insert`/`update`.** Sempre monte o payload listando as colunas, uma a uma.

O motivo é um bug real que isso já custou: o objeto do aluno carrega campos **derivados** que não são colunas da tabela — `total_presencas`/`total_aulas` vêm da view, `ultima_graduacao_data`/`historico_graduacoes` são montados no carregamento. Mandar qualquer um deles no update faz o PostgREST rejeitar a request inteira com **PGRST204** e trava a edição por completo — inclusive quando o valor é um array vazio, porque a validação é sobre as *chaves* do payload, não sobre os valores.

Whitelist em vez de descartar campo a campo: assim um campo derivado novo não volta a quebrar o save silenciosamente. Ver `COLUNAS_ALUNO` em `AppShell.tsx`, e os payloads literais de aula e presença.

## Armadilha do banco: a view `alunos_frequencia`

Ela é `select a.*`, e o Postgres **expande isso na criação**, congelando a lista de colunas daquele instante. Toda migration que adicionar coluna em `alunos` precisa **dropar e recriar a view** (e refazer o `grant`), senão a coluna existe na tabela e nunca chega no app. Já mordeu duas vezes — ver `005_soft_delete.sql` e `008_afastado_manual.sql`.

## Regra de ouro do processo

**Nunca avance de fase sem a anterior funcionando e commitada.** Na prática, em toda sessão:

1. Ler o código real antes de propor — não assumir estrutura de memória.
2. Apresentar um plano curto antes de codar, e perguntar quando a decisão for do usuário (navegação, modelagem de dado) em vez de supor.
3. Migration nova é aplicada **pelo usuário** no Supabase SQL Editor. O código fica pronto e os testes esperam por isso.
4. `npx tsc --noEmit` limpo e `npm run dev` subindo.
5. **Testar manualmente e reportar teste por teste, antes de commitar.** Verificar no banco, não só na tela. Se um teste falha, reportar e parar — não commitar por cima.
6. Dado de teste criado durante a verificação é limpo no fim, e o estado do banco conferido contra a linha de base.

## Arquitetura futura que já está no dado

**Login de aluno, com permissão apenas de confirmar a própria presença** — não editar mais nada. A confiança é a conduta do próprio jiu-jítsu: de propósito **não** haverá geolocalização, foto, nem dupla confirmação.

`presencas.confirmado_por` (`'professor' | 'aluno'`) já foi desenhado para isso: hoje é sempre `'professor'`, e quando o aluno logar só esse literal muda no upsert. A decisão de *quem pode gravar* fica fora da coluna — é RLS/papel. Não modele nada novo que amanhã obrigue a reescrever essa lógica de permissão.

## Pendências conhecidas

1. **"Perfil do professor não encontrado"** na aba de graduação — trava a validação de quem pode assinar (art. 6° IBJJF). A tabela `professor_perfil` existe e a migration 004 insere uma linha, então é bug de leitura no app, não de dado ausente.
2. **`GET /manifest.json` retorna 404** — `app/layout.tsx` referencia o manifest, mas o arquivo não existe em `public/`. PWA ainda não implementado.
3. **Segurança do PIN** — `NEXT_PUBLIC_PROFESSOR_PIN` está no `.env`, exposto no bundle. Hoje o risco é teórico: **nenhum código lê essa variável**, não existe tela de PIN. Aceitável enquanto for demo de um professor só.
4. **RLS efetivamente desligado** — policies liberam tudo para `anon`. Precisa ser resolvido antes do login de aluno.

## Onde as coisas moram

| Arquivo | O que é |
|---|---|
| `components/AppShell.tsx` | UI principal: lista e modal de aluno, aulas, chamada, lixeira, filtros |
| `components/DashboardProfessor.tsx` | Home (Tailwind/shadcn): frequência geral, distribuição, prontos para graduar |
| `lib/carregar-dados.ts` | Carga única das listagens ativas + campos derivados. Usada no server e no client |
| `lib/regras-ibjjf.ts` | Faixas, categoria etária, tempo mínimo, quem pode assinar |
| `lib/alertas-graduacao.ts` | `alertaGraduacao()` — fonte única do "pronto para graduar" |
| `lib/afastamento.ts` | `DIAS_PARA_AFASTADO` e a regra de afastado (automático + override) |
| `supabase/migrations/` | Fonte da verdade do schema, numeradas |
| `docs/schema.sql` | Retrato consolidado do banco, para leitura |
