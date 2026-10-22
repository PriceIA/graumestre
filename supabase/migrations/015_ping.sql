-- ============================================================
-- GrauMestre — Função ping() para o cron que mantém o projeto acordado (G1)
-- Aplicada no Supabase > SQL Editor em 2026-10-22.
--
-- O plano gratuito da Supabase pausa o projeto após ~7 dias sem atividade. O
-- cron da Vercel chama /api/ping a cada 5 dias, sem sessão (papel `anon`), e a
-- 009 revogou o `anon` das tabelas: um select ali dá `permission denied`. Esta
-- função devolve 1 e não lê tabela nenhuma. Só acrescenta uma função.
-- ============================================================

create or replace function public.ping() returns integer language sql stable as $$ select 1 $$;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
