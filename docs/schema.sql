-- ============================================================
-- GrauMestre — Schema completo e atual do banco
--
-- Este arquivo é o retrato consolidado do estado do banco depois de
-- aplicadas as 10 migrations de supabase/migrations/. Ele existe para
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
--   009_rls_authenticated  RLS exigindo sessão autenticada
--   010_frequencia_por_aulas  frequência conta aulas reais, não linhas de presença
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
--
-- 010: `total_aulas` conta AULAS QUE ACONTECERAM, não linhas de `presencas`.
-- A versão antiga (`count(p.id)` sobre um left join com presencas) contava
-- registros de presença — e como falta não gera registro, numerador e
-- denominador eram quase o mesmo número e a frequência dava ~100% para todo
-- mundo. As duas contagens agora passam por `aulas` com `deleted_at is null`,
-- que é também o que faz o crachá e o selo AFASTADO pararem de divergir.
--
-- Subquery correlacionada em vez de join: `join aulas` + `group by` produziria
-- produto cartesiano entre presenças e aulas, inflando as duas contagens.
--
-- O denominador é por aluno (`au.data >= a.inicio`): sem esse corte, quem
-- entrou semana passada apareceria com 4% e cairia em "Precisa atenção" no
-- primeiro dia de aula.
drop view if exists alunos_frequencia;

create view alunos_frequencia as
select
  a.*,
  (
    select count(*)
    from presencas p
    join aulas au on au.id = p.aula_id
    where p.aluno_id = a.id
      and p.presente = true
      and au.deleted_at is null
      and au.data >= a.inicio
  ) as total_presencas,
  (
    select count(*)
    from aulas au
    where au.deleted_at is null
      and au.data >= a.inicio
  ) as total_aulas
from alunos a;

create index if not exists idx_aulas_ativas_data
  on aulas (data)
  where deleted_at is null;


-- ─── Permissões ─────────────────────────────────────────────────────────────
-- O professor entra com e-mail e senha (Supabase Auth), e toda request do app
-- carrega o JWT dele — papel `authenticated`. `anon` não lê nem escreve nada.
--
-- A chave pública no .env é esperada e correta: ela só identifica o projeto e
-- vai no bundle do browser por design. Quem protege os dados é a policy.
--
-- Ainda é um app de um usuário só: quem está autenticado é o professor, e ele
-- pode tudo. Quando o aluno tiver login, a distinção nasce no `using (true)`
-- de `presencas`, que passa a comparar auth.uid() com o dono da linha.
alter table alunos           enable row level security;
alter table aulas            enable row level security;
alter table presencas        enable row level security;
alter table graduacoes       enable row level security;
alter table professor_perfil enable row level security;

-- Uma policy por operação, e não `for all`: restringir só a escrita (ou só a
-- leitura) no futuro vira editar uma linha, não reescrever o bloco.
create policy "alunos_select" on alunos for select to authenticated using (true);
create policy "alunos_insert" on alunos for insert to authenticated with check (true);
create policy "alunos_update" on alunos for update to authenticated using (true) with check (true);
create policy "alunos_delete" on alunos for delete to authenticated using (true);

create policy "aulas_select" on aulas for select to authenticated using (true);
create policy "aulas_insert" on aulas for insert to authenticated with check (true);
create policy "aulas_update" on aulas for update to authenticated using (true) with check (true);
create policy "aulas_delete" on aulas for delete to authenticated using (true);

create policy "presencas_select" on presencas for select to authenticated using (true);
create policy "presencas_insert" on presencas for insert to authenticated with check (true);
create policy "presencas_update" on presencas for update to authenticated using (true) with check (true);
create policy "presencas_delete" on presencas for delete to authenticated using (true);

create policy "graduacoes_select" on graduacoes for select to authenticated using (true);
create policy "graduacoes_insert" on graduacoes for insert to authenticated with check (true);
create policy "graduacoes_update" on graduacoes for update to authenticated using (true) with check (true);
create policy "graduacoes_delete" on graduacoes for delete to authenticated using (true);

-- sem delete: apagar o perfil do dono do app não é operação de interface
create policy "professor_perfil_select" on professor_perfil for select to authenticated using (true);
create policy "professor_perfil_insert" on professor_perfil for insert to authenticated with check (true);
create policy "professor_perfil_update" on professor_perfil for update to authenticated using (true) with check (true);

-- GRANT e RLS são camadas independentes: sem o privilégio de tabela o
-- PostgREST devolve 42501 antes mesmo de olhar a policy. Foi exatamente o que
-- aconteceu com professor_perfil, que nasceu na 004 — depois da 002 e da 003 —
-- e ficou sem grant até a 009.
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on alunos, aulas, presencas, graduacoes
  to authenticated;

grant select, insert, update on professor_perfil to authenticated;

grant select on alunos_frequencia to authenticated;
