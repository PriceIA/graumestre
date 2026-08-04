# GrauMestre 🥋

App de gestão de alunos e aulas de jiu-jítsu, feito para **um professor faixa preta usar no tatame, no celular**. Cadastro de alunos com as regras de graduação da IBJJF, chamada rápida de presença, histórico de graduações e gravação das aulas.

A filosofia é **funcionalidade antes de estética**: menos toques ganha de mais bonito.

---

## Rodando localmente

### 1. Clonar e instalar

```bash
git clone https://github.com/PriceIA/graumestre.git
cd graumestre
npm install
```

### 2. Variáveis de ambiente

Se o projeto já está linkado na Vercel:

```bash
vercel env pull .env.local
```

Senão, duplique o `.env.example` como `.env.local` e preencha à mão. São duas variáveis em uso, as duas em **Supabase > Settings > API**:

| Variável | O que é |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (`anon` legada ou `publishable` nova) |
| `NEXT_PUBLIC_PROFESSOR_PIN` | Reservada — nenhum código lê hoje, ver `.env.example` |

### 3. Subir

```bash
npm run dev
```

http://localhost:3000

---

## Banco de dados

### Criando do zero

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor**
3. Rode as migrations de `supabase/migrations/` **na ordem numérica**, da `001` à `008` — uma de cada vez
4. Pegue `Project URL` e a chave `anon public` em **Settings > API**

O arquivo `docs/schema.sql` é o retrato consolidado do banco depois de todas as migrations. Serve para leitura e para recriar tudo de uma vez; a **fonte da verdade continua sendo as migrations numeradas**.

### Mudando o schema

Coluna nova entra como **migration numerada nova**, aplicada manualmente no SQL Editor — não há migration runner automático.

> ⚠ **Adicionou coluna em `alunos`?** A view `alunos_frequencia` é `select a.*` e congela as colunas na criação. A migration precisa dropar e recriar a view (e refazer o `grant`), senão a coluna nunca chega no app. Ver `005` e `008`.

### Tabelas

| Tabela | O que guarda |
|---|---|
| `alunos` | Cadastro, faixa, graus, datas, situação |
| `aulas` | Data, técnica, posição, notas, link da gravação |
| `presencas` | Quem foi em qual aula, e quem confirmou |
| `graduacoes` | Histórico de mudanças de faixa/grau |
| `professor_perfil` | O dono do app — faixa e grau, para validar assinatura |
| `alunos_frequencia` | View: alunos + contagem de presenças |

---

## Estrutura

```
graumestre/
├── app/
│   ├── layout.tsx              # Layout raiz + splash
│   ├── page.tsx                # Server component: carga inicial
│   ├── globals.css
│   └── api/                    # ⚠ código morto (ver CLAUDE.md)
│       ├── alunos/route.ts
│       └── graduacoes/route.ts
├── components/
│   ├── AppShell.tsx            # UI principal — inline styles, não Tailwind
│   ├── DashboardProfessor.tsx  # Home (Tailwind + shadcn)
│   ├── SplashGate.tsx
│   ├── SplashScreen.tsx
│   └── ui/                     # shadcn: avatar, badge, button, card
├── lib/
│   ├── supabase.ts             # Cliente Supabase
│   ├── carregar-dados.ts       # Carga das listagens ativas + derivados
│   ├── types.ts
│   ├── regras-ibjjf.ts         # Faixas, categoria etária, tempo mínimo
│   ├── alertas-graduacao.ts    # Fonte única do "pronto para graduar"
│   ├── afastamento.ts          # Regra de afastado (automático + override)
│   └── utils.ts
├── docs/
│   └── schema.sql              # Schema consolidado
└── supabase/
    └── migrations/             # 001 … 008 — fonte da verdade
```

O app conversa com o Supabase **direto do cliente**, sem rotas de API. As duas rotas em `app/api/` são resquício e não são chamadas por nada.

---

## Deploy

Automático: **push na `main` → a Vercel builda e publica**.

```bash
git push origin main
```

Primeira vez:

1. [vercel.com](https://vercel.com) → **Add New Project** → importe o repositório
2. Em **Environment Variables**, adicione as variáveis do `.env.local`
3. **Deploy**

Migration é passo à parte: aplique o SQL no Supabase **antes** de subir código que dependa da coluna nova, senão a produção quebra com `PGRST204`.

---

## Documentação

- **`CLAUDE.md`** — memória de trabalho: decisões de arquitetura, padrões obrigatórios, armadilhas e pendências. Leia antes de mexer no código.
- **`CHANGELOG.md`** — histórico de mudanças.
- **`docs/schema.sql`** — schema completo do banco.
