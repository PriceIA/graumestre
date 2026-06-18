# GrauMestre 🥋

App de gestão de alunos e aulas de jiu-jítsu.

---

## Deploy em 5 passos

### 1. Supabase — criar o banco

1. Acesse [supabase.com](https://supabase.com) e crie um projeto novo
2. No menu lateral, vá em **SQL Editor**
3. Cole o conteúdo de `supabase/migrations/001_initial.sql` e clique em **Run**
4. Vá em **Settings > API** e copie:
   - `Project URL`
   - `anon public` key

### 2. Configurar variáveis de ambiente localmente

Duplique o `.env.example` como `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_PROFESSOR_PIN=1234
```

### 3. Testar localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000

### 4. Subir no GitHub

```bash
git init
git add .
git commit -m "feat: GrauMestre inicial"
git branch -M main
git remote add origin https://github.com/SEU_USER/graumestre.git
git push -u origin main
```

### 5. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Importe o repositório do GitHub
3. Em **Environment Variables**, adicione as 3 variáveis do `.env.local`
4. Clique em **Deploy**

Pronto! O link ficará no formato `graumestre.vercel.app`

---

## Estrutura do projeto

```
graumestre/
├── app/
│   ├── layout.tsx          # Layout raiz
│   ├── page.tsx            # Página principal (busca dados do Supabase)
│   ├── globals.css
│   └── api/
│       ├── alunos/route.ts     # Criar/editar aluno
│       ├── aulas/route.ts      # Registrar aula + presenças
│       └── graduacoes/route.ts # Historico de graduações
├── components/
│   └── AppShell.tsx        # UI completa (client-side)
├── lib/
│   ├── supabase.ts         # Cliente Supabase
│   └── types.ts            # Tipos TypeScript
└── supabase/
    └── migrations/
        └── 001_initial.sql # Schema do banco
```

## Tabelas no Supabase

| Tabela | O que guarda |
|--------|-------------|
| `alunos` | Cadastro completo de cada aluno |
| `aulas` | Registro de cada aula (técnica, posição) |
| `presencas` | Quem foi em qual aula |
| `graduacoes` | Histórico de mudanças de faixa/grau |
| `alunos_frequencia` | View com contagem automática de presença |
