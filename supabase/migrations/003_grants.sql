-- ============================================================
-- GrauMestre — Grants de tabela
-- Cole este SQL no Supabase > SQL Editor > Run
--
-- "permission denied for table alunos" é um erro de GRANT do
-- Postgres, não de RLS — acontece mesmo com RLS desabilitado.
-- Troca de chave (anon JWT vs. publishable key) não resolve isso:
-- as duas mapeiam para o mesmo papel "anon" no banco, que
-- aparentemente nunca recebeu privilégio de select/insert/update
-- /delete nessas tabelas.
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete
  on alunos, aulas, presencas, graduacoes
  to anon, authenticated;

grant select on alunos_frequencia to anon, authenticated;
