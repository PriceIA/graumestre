-- ============================================================
-- GrauMestre — Políticas de RLS
-- Cole este SQL no Supabase > SQL Editor > Run
--
-- Problema: a leitura (select) dos alunos funciona, mas o
-- cadastro (insert) pelo botão "+" falha com 401. Isso acontece
-- porque o RLS está habilitado nessas tabelas mas só existe (ou
-- não existe nenhuma) política liberando leitura — não há
-- política liberando insert/update/delete para a chave anônima
-- usada pelo app (não há login de usuário, então o app sempre
-- acessa como "anon").
--
-- Este script garante RLS habilitado e cria políticas permitindo
-- todas as operações (select/insert/update/delete) para os
-- papéis anon e authenticated, replicando o comportamento atual
-- do app (sem autenticação de usuário).
-- ============================================================

alter table alunos     enable row level security;
alter table aulas      enable row level security;
alter table presencas  enable row level security;
alter table graduacoes enable row level security;

drop policy if exists "alunos_all"     on alunos;
drop policy if exists "aulas_all"      on aulas;
drop policy if exists "presencas_all"  on presencas;
drop policy if exists "graduacoes_all" on graduacoes;

create policy "alunos_all" on alunos
  for all to anon, authenticated
  using (true) with check (true);

create policy "aulas_all" on aulas
  for all to anon, authenticated
  using (true) with check (true);

create policy "presencas_all" on presencas
  for all to anon, authenticated
  using (true) with check (true);

create policy "graduacoes_all" on graduacoes
  for all to anon, authenticated
  using (true) with check (true);
