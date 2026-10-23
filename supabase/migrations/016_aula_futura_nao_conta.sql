-- ============================================================
-- 016 — G4: aula com data futura não conta como dada
--
-- O professor pode lançar uma aula com antecedência (e a Parte 2 vai
-- depender disso: o prazo de 24 h do aluno, decisão 7 do ROADMAP). Até a
-- 015, a view contava essa aula na hora do lançamento: a frequência da turma
-- inteira caía, e cada aluno ganhava uma "aula perdida" antes do treino
-- acontecer.
--
-- O que muda: as quatro contagens ganham o limite de cima
--   au.data <= (now() at time zone 'America/Sao_Paulo')::date
-- e NADA mais. O corpo é o da 014 linha por linha; mesmas 24 colunas, mesmos
-- nomes, mesma ordem. Com os dados de hoje (nenhuma aula futura) o resultado
-- é idêntico — ver a conferência por md5 no fim.
--
-- "Hoje" é o dia de São Paulo, nunca current_date: no Supabase o fuso da
-- sessão é UTC, e current_date repetiria dentro do banco o defeito das 21h
-- que a G4.1 tirou do app (lib/datas.ts, hojeBrasil()). Os dois lados usam o
-- mesmo fuso de propósito, para o crachá e o selo AFASTADO concordarem.
--
-- A view continua `select a.*`: o Postgres expande na criação. Nenhuma
-- coluna nova em `alunos` desde a 014 (a 015 só criou a função ping), então
-- a expansão dá as mesmas 20 colunas de hoje.
--
-- Segurança: o create view pode receber as permissões padrão do Supabase e
-- reabrir para o anon o que a 009 fechou. Por isso o revoke de tudo antes do
-- grant — inclusive de `authenticated`, que fica só com SELECT (a view
-- `select a.*` é atualizável pelo Postgres, e o app nunca escreve nela).
--
-- Rodar inteira, de uma vez, no SQL Editor.
-- ============================================================

begin;

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
      and au.data <= (now() at time zone 'America/Sao_Paulo')::date
  ) as total_presencas,

  (
    select count(*)
    from aulas au
    where au.deleted_at is null
      and au.data >= a.inicio
      and au.data <= (now() at time zone 'America/Sao_Paulo')::date
  ) as total_aulas,

  -- Presenças reais desde a última graduação registrada (ou desde a
  -- matrícula, quando não há nenhuma) — critério de prontidão para o próximo
  -- GRAU, definido pelo professor em presencas_por_grau.
  (
    select count(*)
    from presencas p
    join aulas au on au.id = p.aula_id
    where p.aluno_id = a.id
      and p.presente = true
      and au.deleted_at is null
      and au.data >= greatest(
        coalesce(
          (select max(g.data) from graduacoes g where g.aluno_id = a.id and g.deleted_at is null),
          a.inicio
        ),
        a.inicio
      )
      and au.data <= (now() at time zone 'America/Sao_Paulo')::date
  ) as presencas_desde_graduacao,

  -- Aulas ativas no mesmo intervalo — preparada para o painel do sininho
  -- mostrar "31 de 40 aulas".
  (
    select count(*)
    from aulas au
    where au.deleted_at is null
      and au.data >= greatest(
        coalesce(
          (select max(g.data) from graduacoes g where g.aluno_id = a.id and g.deleted_at is null),
          a.inicio
        ),
        a.inicio
      )
      and au.data <= (now() at time zone 'America/Sao_Paulo')::date
  ) as aulas_desde_graduacao

from alunos a;

revoke all on alunos_frequencia from anon, authenticated, public;
grant select on alunos_frequencia to authenticated;

commit;


-- ============================================================
-- Conferências (rodar depois do Run acima, uma por vez)
-- ============================================================
--
-- A) md5 das quatro contagens — rodar ANTES e DEPOIS da 016, no mesmo dia.
--    Os dois resultados têm que ser idênticos (hoje não há aula futura).
--
--   select count(*) as alunos,
--          md5(string_agg(
--            id::text || ':' || total_presencas || ':' || total_aulas || ':' ||
--            presencas_desde_graduacao || ':' || aulas_desde_graduacao,
--            ',' order by id)) as assinatura
--   from alunos_frequencia;
--
-- B) Colunas: tem que devolver exatamente estas 24, nesta ordem.
--     1 id                       13 campeao_mundial_marrom
--     2 nome                     14 veio_de_faixa_juvenil
--     3 faixa                    15 status_graduacao
--     4 graus                    16 provisorio_desde
--     5 inicio                   17 curso_primeiros_socorros
--     6 foto_url                 18 curso_regras_data
--     7 instagram                19 deleted_at
--     8 notas                    20 afastado_manual
--     9 created_at               21 total_presencas
--    10 data_nascimento          22 total_aulas
--    11 campeao_mundial_azul     23 presencas_desde_graduacao
--    12 campeao_mundial_roxa     24 aulas_desde_graduacao
--
--   select ordinal_position, column_name, data_type
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'alunos_frequencia'
--   order by ordinal_position;
--
-- C) Segurança (a mesma pergunta da G0): anon sem nada, authenticated só lê.
--    Esperado: anon = false nas 4 colunas; authenticated = true só em select.
--
--   select r.papel,
--          has_table_privilege(r.papel, 'public.alunos_frequencia', 'select') as pode_ler,
--          has_table_privilege(r.papel, 'public.alunos_frequencia', 'insert') as pode_inserir,
--          has_table_privilege(r.papel, 'public.alunos_frequencia', 'update') as pode_alterar,
--          has_table_privilege(r.papel, 'public.alunos_frequencia', 'delete') as pode_apagar
--   from (values ('anon'), ('authenticated')) as r(papel);
--
--   select grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema = 'public' and table_name = 'alunos_frequencia'
--   order by grantee, privilege_type;
--   -- não pode aparecer anon nem PUBLIC; authenticated só com SELECT
--   -- (postgres, dono, e service_role podem aparecer)
