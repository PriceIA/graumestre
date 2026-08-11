-- ============================================================
-- GrauMestre — Purga física da lixeira (pg_cron, diário)
-- Cole este SQL no Supabase > SQL Editor > Run
--
-- O QUE ISTO FECHA
--
-- A 005 criou o soft delete e deixou a purga explicitamente em aberto: o app
-- carimba `deleted_at`, a aba Lixeira esconde o que passou de 7 dias, e a linha
-- ficava no banco para sempre. A interface promete "pode ser restaurado por 7
-- dias" — o que, dito ao contrário, promete que depois disso some. Até aqui não
-- sumia: só saía da tela.
--
-- O PRAZO ESTÁ EM DOIS LUGARES
--
-- `interval '7 days'` abaixo e `DIAS_LIXEIRA` em components/AppShell.tsx são o
-- mesmo prazo escrito duas vezes — um decide o que o professor VÊ, o outro o que
-- o banco GUARDA. Mexeu num, mexa no outro, senão o item some da tela dias antes
-- (ou depois) de ser apagado de verdade.
--
-- CASCADE: APAGAR UM ALUNO LEVA O HISTÓRICO JUNTO
--
-- Aqui o DELETE é físico, então as FKs de 001 entram em ação:
--   presencas.aula_id  -> aulas(id)  on delete cascade
--   presencas.aluno_id -> alunos(id) on delete cascade
--   graduacoes.aluno_id-> alunos(id) on delete cascade
--
-- Ou seja: purgar um aluno apaga TODAS as graduações e presenças dele, inclusive
-- as que nunca foram para a lixeira. É o comportamento correto — o aluno deixou
-- de existir, e histórico órfão não serve para nada —, mas não é óbvio lendo só
-- o app, onde apagar aluno e apagar graduação são ações separadas.
--
-- Nada a ajustar nas FKs: o cascade já estava lá desde a 001. A purga só passou
-- a ser o primeiro lugar do projeto que de fato o aciona.
--
-- PRESENÇAS NÃO TÊM LIXEIRA e não aparecem no DELETE de propósito (ver o
-- comentário em docs/schema.sql): desmarcar aluno é `presente = false`, nunca
-- delete. Elas só somem por cascade, junto com a aula ou o aluno.
-- ============================================================


-- 1) A extensão. No Supabase ela pode precisar ser habilitada uma vez em
-- Database > Extensions; este `create extension` faz o mesmo pelo SQL. O
-- pg_cron cria e exige o schema `cron` (está no control file dele), por isso as
-- chamadas abaixo são sempre `cron.alguma_coisa`.
create extension if not exists pg_cron;


-- 2) A função de purga.
--
-- Devolve o que apagou, por tabela, em vez de `void`: rodada na mão no SQL
-- Editor ela vira a própria verificação ("apagou 1 aula, 0 alunos"), e o
-- histórico do cron guarda o retorno.
--
-- `deleted_at < limite` já exclui os ativos sozinho — comparação com NULL não é
-- verdadeira —, então não há `is not null` redundante aqui.
--
-- A ordem importa só para a CONTAGEM, não para a corretude: alunos por último
-- para que as graduações apagadas explicitamente apareçam na linha
-- 'graduacoes', em vez de sumirem por cascade antes de serem contadas.
create or replace function purgar_lixeira()
returns table (tabela text, apagados bigint)
language plpgsql
set search_path = public
as $$
declare
  limite timestamptz := now() - interval '7 days';
begin
  return query
    with d as (delete from aulas where deleted_at < limite returning 1)
    select 'aulas'::text, count(*)::bigint from d;

  return query
    with d as (delete from graduacoes where deleted_at < limite returning 1)
    select 'graduacoes'::text, count(*)::bigint from d;

  return query
    with d as (delete from alunos where deleted_at < limite returning 1)
    select 'alunos'::text, count(*)::bigint from d;
end;
$$;

-- Sem EXECUTE para os papéis do app. Toda função em `public` nasce executável
-- por PUBLIC, e o PostgREST publicaria esta como RPC — ou seja, uma chamada de
-- browser conseguiria disparar exclusão definitiva. O único cliente legítimo é
-- o job do cron (que roda como o dono, `postgres`), e o SQL Editor.
revoke all on function purgar_lixeira() from public;
revoke all on function purgar_lixeira() from anon, authenticated;


-- 3) O agendamento — todo dia às 04:00.
--
-- pg_cron usa o fuso do banco, que no Supabase é UTC: 04:00 UTC ≈ 01:00 em
-- Brasília. De madrugada de propósito, longe do horário de treino.
--
-- O unschedule guardado deixa a migration reexecutável sem duplicar job nem
-- estourar erro quando ele ainda não existe.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'purgar-lixeira') then
    perform cron.unschedule('purgar-lixeira');
  end if;
end $$;

select cron.schedule(
  'purgar-lixeira',
  '0 4 * * *',
  $$select purgar_lixeira()$$
);


-- 4) Conferência (rode depois do Run acima):
--
--   select jobname, schedule, active from cron.job where jobname = 'purgar-lixeira';
--   select * from purgar_lixeira();
--
-- E o histórico das execuções automáticas, depois da primeira madrugada:
--
--   select status, return_message, start_time
--   from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'purgar-lixeira')
--   order by start_time desc limit 5;
