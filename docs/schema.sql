-- ============================================================
-- GrauMestre — Schema completo e atual do banco
--
-- Este arquivo é o retrato consolidado do estado do banco depois de
-- aplicadas as 8 migrations de supabase/migrations/. Ele existe para
-- leitura e para recriar o banco do zero num projeto Supabase novo.
--
-- ⚠ A fonte da verdade continua sendo supabase/migrations/. Uma coluna
-- nova entra como migration numerada; este arquivo é atualizado junto,
-- nunca no lugar dela.
--
-- Consolidado das migrations:
--   001_initial          tabelas base + view alunos_frequencia
--   002_rls_policies     RLS ligado, com policies liberando tudo p/ anon
--   003_grants           grants de tabela para anon/authenticated
--   004_ibjjf_regras     faixas infantis, categoria etária, professor_perfil
--   005_soft_delete      deleted_at (lixeira de 7 dias)
--   006_presenca_autoria confirmado_por / confirmado_em em presencas
--   007_link_youtube     link_youtube em aulas
--   008_afastado_manual  afastado_manual em alunos
-- ============================================================


-- ─── alunos ─────────────────────────────────────────────────────────────────
create table if not exists alunos (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  faixa       text not null default 'branca',
  graus       int  not null default 0,
  inicio      date not null default current_date,
  foto_url    text,
  instagram   text,
  notas       text,

  -- 004: categoria etária (art. 2.2.1) e validação de idade mínima por faixa
  data_nascimento date,

  -- 004: exceções que zeram/reduzem o tempo mínimo (art. 3.1.3)
  campeao_mundial_azul   boolean not null default false,
  campeao_mundial_roxa   boolean not null default false,
  campeao_mundial_marrom boolean not null default false,
  veio_de_faixa_juvenil  text,

  -- 004: graduação provisória (art. 7°) — marrom/preta sem faixa anterior registrada
  status_graduacao text not null default 'regular',
  provisorio_desde date,

  -- 004: requisitos de diploma de faixa preta (art. 5.1)
  curso_primeiros_socorros boolean not null default false,
  curso_regras_data        date,     -- validade de 12 meses (art. 5.1.4)

  -- 008: override manual de afastamento.
  --   null        -> segue o cálculo automático por frequência
  --   true/false  -> o professor decidiu, e a decisão dele prevalece
  -- O prazo do automático vive em lib/afastamento.ts (DIAS_PARA_AFASTADO).
  afastado_manual boolean,

  created_at timestamptz default now(),

  -- 005: soft delete. null = ativo · preenchido = na lixeira
  deleted_at timestamptz,

  constraint alunos_faixa_check check (
    faixa in (
      'branca',
      'cinza_branca','cinza','cinza_preta',
      'amarela_branca','amarela','amarela_preta',
      'laranja_branca','laranja','laranja_preta',
      'verde_branca','verde','verde_preta',
      'azul','roxa','marrom','preta'
    )
  ),
  -- máximo por faixa é validado no app (lib/regras-ibjjf.ts), porque depende
  -- da faixa: infantil até 3, branca–marrom até 4, preta até 9.
  constraint alunos_graus_check check (graus between 0 and 9),
  constraint alunos_veio_de_faixa_juvenil_check check (
    veio_de_faixa_juvenil in ('azul_juvenil','roxa_juvenil','laranja','verde')
    or veio_de_faixa_juvenil is null
  ),
  constraint alunos_status_graduacao_check check (
    status_graduacao in ('regular','provisorio')
  )
);


-- ─── aulas ──────────────────────────────────────────────────────────────────
create table if not exists aulas (
  id       uuid primary key default gen_random_uuid(),
  data     date not null default current_date,
  tecnica  text,
  posicao  text,
  notas    text,

  -- 007: gravação da aula para quem faltou assistir depois. Opcional: o link
  -- só existe depois que o vídeo sobe. Sem check de formato aqui de propósito
  -- — a validação de domínio vive no formulário, e um check rejeitaria em
  -- silêncio um encurtador legítimo.
  link_youtube text,

  created_at timestamptz default now(),

  -- 005: soft delete
  deleted_at timestamptz
);


-- ─── presencas — relaciona aluno ↔ aula ─────────────────────────────────────
-- Fora da lixeira de propósito: desmarcar um aluno é update de `presente` para
-- false, nunca delete. O registro de que ele faltou naquele dia também é
-- histórico. Por isso não há deleted_at aqui.
create table if not exists presencas (
  id       uuid primary key default gen_random_uuid(),
  aula_id  uuid references aulas(id)  on delete cascade,
  aluno_id uuid references alunos(id) on delete cascade,
  presente boolean not null default true,

  -- 006: quem confirmou a presença. Hoje é sempre 'professor'; quando o aluno
  -- tiver login e confirmar a própria presença, só este valor muda para
  -- 'aluno'. A permissão de quem pode gravar é decidida fora daqui (RLS/papel)
  -- — esta coluna só registra a autoria.
  confirmado_por text        not null default 'professor',
  confirmado_em  timestamptz not null default now(),

  -- o unique é o que torna a chamada idempotente: o app faz upsert com
  -- onConflict 'aula_id,aluno_id', então marcar e desmarcar o mesmo aluno à
  -- vontade nunca duplica linha.
  unique (aula_id, aluno_id),
  constraint presencas_confirmado_por_check check (
    confirmado_por in ('professor','aluno')
  )
);


-- ─── graduacoes — histórico de mudanças de faixa/grau ───────────────────────
create table if not exists graduacoes (
  id             uuid primary key default gen_random_uuid(),
  aluno_id       uuid references alunos(id) on delete cascade,
  faixa_anterior text not null,
  faixa_nova     text not null,
  graus_anterior int  not null,
  graus_novo     int  not null,
  data           date not null default current_date,
  notas          text,
  created_at     timestamptz default now(),

  -- 005: soft delete
  deleted_at timestamptz
);


-- ─── professor_perfil — o dono do app ───────────────────────────────────────
-- Single-user, mas o grau precisa estar registrado para validar quem pode
-- assinar cada graduação (art. 6° e 7°). A 004 garante uma única linha.
create table if not exists professor_perfil (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null default 'Professor',
  faixa      text not null default 'preta' check (faixa in ('preta')),
  graus      int  not null default 0 check (graus between 0 and 9),
  created_at timestamptz default now()
);

insert into professor_perfil (nome, faixa, graus)
select 'Professor', 'preta', 0
where not exists (select 1 from professor_perfil);


-- ─── view alunos_frequencia ─────────────────────────────────────────────────
-- ⚠ ARMADILHA CONHECIDA, já custou dois bugs (ver 005 e 008):
-- o Postgres expande o "select a.*" no momento em que a view é CRIADA, então
-- ela congela a lista de colunas daquele instante. Toda migration que
-- adicionar coluna em `alunos` PRECISA dropar e recriar esta view, senão a
-- coluna existe na tabela e nunca chega no app.
--
-- `create or replace view` não resolve: com o a.* re-expandido a posição das
-- colunas muda, e o Postgres se recusa a renomear coluna de view existente.
-- Por isso é drop + create, e o grant tem que ser refeito junto.
drop view if exists alunos_frequencia;

create view alunos_frequencia as
select
  a.*,
  count(p.id) filter (where p.presente = true) as total_presencas,
  count(p.id)                                  as total_aulas
from alunos a
left join presencas p on p.aluno_id = a.id
group by a.id;


-- ─── Permissões ─────────────────────────────────────────────────────────────
-- O app é single-user e não tem login: toda request chega como o papel `anon`.
-- RLS está LIGADO nas quatro tabelas, mas com policies que liberam tudo para
-- anon/authenticated — o efeito prático é o de RLS desligado. É uma decisão
-- consciente e temporária; quando o aluno tiver login, é aqui que a restrição
-- de "aluno só confirma a própria presença" vai morar.
alter table alunos     enable row level security;
alter table aulas      enable row level security;
alter table presencas  enable row level security;
alter table graduacoes enable row level security;

drop policy if exists "alunos_all"     on alunos;
drop policy if exists "aulas_all"      on aulas;
drop policy if exists "presencas_all"  on presencas;
drop policy if exists "graduacoes_all" on graduacoes;

create policy "alunos_all"     on alunos     for all to anon, authenticated using (true) with check (true);
create policy "aulas_all"      on aulas      for all to anon, authenticated using (true) with check (true);
create policy "presencas_all"  on presencas  for all to anon, authenticated using (true) with check (true);
create policy "graduacoes_all" on graduacoes for all to anon, authenticated using (true) with check (true);

-- "permission denied for table alunos" é erro de GRANT, não de RLS: acontece
-- mesmo com RLS desligado, e trocar de chave (anon JWT vs. publishable key)
-- não resolve — as duas mapeiam para o mesmo papel `anon`.
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on alunos, aulas, presencas, graduacoes
  to anon, authenticated;

grant select on alunos_frequencia to anon, authenticated;
