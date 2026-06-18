-- ============================================================
-- GrauMestre — Schema inicial
-- Cole este SQL no Supabase > SQL Editor > Run
-- ============================================================

-- Alunos
create table if not exists alunos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  faixa       text not null default 'branca',
  graus       int  not null default 0 check (graus between 0 and 4),
  inicio      date not null default current_date,
  foto_url    text,
  instagram   text,
  notas       text,
  created_at  timestamptz default now()
);

-- Aulas
create table if not exists aulas (
  id          uuid primary key default gen_random_uuid(),
  data        date not null default current_date,
  tecnica     text,
  posicao     text,
  notas       text,
  created_at  timestamptz default now()
);

-- Presenças (relaciona aluno ↔ aula)
create table if not exists presencas (
  id          uuid primary key default gen_random_uuid(),
  aula_id     uuid references aulas(id)  on delete cascade,
  aluno_id    uuid references alunos(id) on delete cascade,
  presente    boolean not null default true,
  unique (aula_id, aluno_id)
);

-- Histórico de graduações
create table if not exists graduacoes (
  id              uuid primary key default gen_random_uuid(),
  aluno_id        uuid references alunos(id) on delete cascade,
  faixa_anterior  text not null,
  faixa_nova      text not null,
  graus_anterior  int  not null,
  graus_novo      int  not null,
  data            date not null default current_date,
  notas           text,
  created_at      timestamptz default now()
);

-- View útil: alunos com contagem de presenças
create or replace view alunos_frequencia as
select
  a.*,
  count(p.id) filter (where p.presente = true)  as total_presencas,
  count(p.id)                                    as total_aulas
from alunos a
left join presencas p on p.aluno_id = a.id
group by a.id;
