-- ============================================================
-- GrauMestre — Regras IBJJF (Sistema Geral de Graduação, Jun/2026)
-- Cole no Supabase > SQL Editor > Run
-- ============================================================

-- 1) Novas faixas infantis (04–15 anos) + remoção do limite fixo de graus
--    Vermelha-Preta / Vermelha-Branca / Vermelha NÃO entram como faixa nova:
--    são o 7º/8º/9º-10º grau da própria faixa preta (art. 4.1.2).
alter table alunos drop constraint if exists alunos_faixa_check;
alter table alunos add constraint alunos_faixa_check check (
  faixa in (
    'branca',
    'cinza_branca','cinza','cinza_preta',
    'amarela_branca','amarela','amarela_preta',
    'laranja_branca','laranja','laranja_preta',
    'verde_branca','verde','verde_preta',
    'azul','roxa','marrom','preta'
  )
);

alter table alunos drop constraint if exists alunos_graus_check;
-- validação de máximo por faixa fica no app (lib/regras-ibjjf.ts), pois é
-- dependente da faixa: infantil até 3, branca-marrom até 4, preta até 9.
alter table alunos add constraint alunos_graus_check check (graus between 0 and 9);

-- 2) Data de nascimento — necessária para calcular categoria etária (art. 2.2.1)
--    e para validar idade mínima por faixa (art. 2°).
alter table alunos add column if not exists data_nascimento date;

-- 3) Exceções que zeram/reduzem tempo mínimo (art. 3.1.3)
alter table alunos add column if not exists campeao_mundial_azul   boolean not null default false;
alter table alunos add column if not exists campeao_mundial_roxa   boolean not null default false;
alter table alunos add column if not exists campeao_mundial_marrom boolean not null default false;

-- Faixa juvenil anterior (afeta prazos de azul/roxa adulto — art. 3.1.3.II/III)
alter table alunos add column if not exists veio_de_faixa_juvenil text
  check (veio_de_faixa_juvenil in ('azul_juvenil','roxa_juvenil','laranja','verde') or veio_de_faixa_juvenil is null);

-- 4) Graduação provisória (art. 7°) — marrom/preta sem faixa anterior registrada
alter table alunos add column if not exists status_graduacao text not null default 'regular'
  check (status_graduacao in ('regular','provisorio'));
alter table alunos add column if not exists provisorio_desde date;

-- 5) Requisitos de diploma de faixa preta (art. 5.1) — checklist simples
alter table alunos add column if not exists curso_primeiros_socorros boolean not null default false;
alter table alunos add column if not exists curso_regras_data date; -- validade de 12 meses (art. 5.1.4)

-- 6) Perfil do professor responsável (single-user, mas precisa de grau
--    registrado para validar quem pode assinar graduações — art. 6° e 7°)
create table if not exists professor_perfil (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null default 'Professor',
  faixa        text not null default 'preta' check (faixa in ('preta')),
  graus        int  not null default 0 check (graus between 0 and 9),
  created_at   timestamptz default now()
);

-- garante que só existe 1 linha (é o professor dono do app)
insert into professor_perfil (nome, faixa, graus)
select 'Professor', 'preta', 0
where not exists (select 1 from professor_perfil);
