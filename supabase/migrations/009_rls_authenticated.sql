-- ============================================================
-- GrauMestre — RLS travada para usuário autenticado
-- Cole este SQL no Supabase > SQL Editor > Run
--
-- ⚠ RODE ESTE SQL SÓ DEPOIS DE CRIAR A CONTA DO PROFESSOR em
-- Authentication > Users, e de o código com a tela de login estar no ar.
-- A partir daqui, `anon` não lê nem escreve mais nada: sem conta criada,
-- ninguém entra.
--
-- O QUE MUDA
--
-- Até a 002, as policies eram `for all to anon, authenticated using(true)`.
-- Na prática isso é o mesmo que não ter RLS: qualquer pessoa com a URL do
-- projeto e a chave pública — que vai no bundle do browser, por design —
-- lia e escrevia os dados dos alunos. A chave pública não é o segredo; a
-- policy é. Este arquivo passa a exigir sessão de verdade.
--
-- Depois desta migration:
--   anon           -> nada. Nem select.
--   authenticated  -> tudo, nas 5 tabelas e na view.
--
-- Ainda é um app de um usuário só: quem está autenticado é o professor, e
-- ele pode tudo. Quando o aluno tiver login (ver CLAUDE.md), a distinção
-- entre os dois papéis nasce aqui — a policy de `presencas` passa a
-- comparar auth.uid() com o dono da linha, e `confirmado_por` deixa de ser
-- sempre 'professor'. Não há nada a desfazer para chegar lá.
-- ============================================================


-- ─── 1) professor_perfil entra no regime de RLS ─────────────────────────────
-- Ela nasceu na 004, DEPOIS da 002 e da 003, e por isso nunca recebeu policy
-- nem grant. O sintoma era o erro 42501 "permission denied for table
-- professor_perfil", que o app mostrava como "perfil do professor não
-- encontrado" e travava a validação de quem pode assinar graduação (art. 6°).
-- Incluí-la aqui corrige isso de passagem.
alter table professor_perfil enable row level security;


-- ─── 2) Fora as policies antigas ────────────────────────────────────────────
drop policy if exists "alunos_all"     on alunos;
drop policy if exists "aulas_all"      on aulas;
drop policy if exists "presencas_all"  on presencas;
drop policy if exists "graduacoes_all" on graduacoes;


-- ─── 3) Policies novas: só quem está autenticado ────────────────────────────
-- Uma policy por operação em vez de `for all`, para que restringir só a
-- escrita (ou só a leitura) no futuro seja editar uma linha, não reescrever
-- o bloco.
--
-- `to authenticated` já garante que a request traz um JWT de usuário: o papel
-- só é atribuído quando o token é válido. O `using (true)` que vem depois é o
-- filtro DE LINHA — hoje "todas as linhas", porque o professor é dono de tudo.
-- É neste `true` que a regra por aluno vai entrar um dia.

-- alunos
create policy "alunos_select" on alunos for select to authenticated using (true);
create policy "alunos_insert" on alunos for insert to authenticated with check (true);
create policy "alunos_update" on alunos for update to authenticated using (true) with check (true);
create policy "alunos_delete" on alunos for delete to authenticated using (true);

-- aulas
create policy "aulas_select" on aulas for select to authenticated using (true);
create policy "aulas_insert" on aulas for insert to authenticated with check (true);
create policy "aulas_update" on aulas for update to authenticated using (true) with check (true);
create policy "aulas_delete" on aulas for delete to authenticated using (true);

-- presencas
create policy "presencas_select" on presencas for select to authenticated using (true);
create policy "presencas_insert" on presencas for insert to authenticated with check (true);
create policy "presencas_update" on presencas for update to authenticated using (true) with check (true);
create policy "presencas_delete" on presencas for delete to authenticated using (true);

-- graduacoes
create policy "graduacoes_select" on graduacoes for select to authenticated using (true);
create policy "graduacoes_insert" on graduacoes for insert to authenticated with check (true);
create policy "graduacoes_update" on graduacoes for update to authenticated using (true) with check (true);
create policy "graduacoes_delete" on graduacoes for delete to authenticated using (true);

-- professor_perfil — sem delete: apagar o perfil do dono do app não é uma
-- operação que deva existir pela interface.
create policy "professor_perfil_select" on professor_perfil for select to authenticated using (true);
create policy "professor_perfil_insert" on professor_perfil for insert to authenticated with check (true);
create policy "professor_perfil_update" on professor_perfil for update to authenticated using (true) with check (true);


-- ─── 4) Grants: tirar de anon, dar a authenticated ──────────────────────────
-- Policy sozinha não basta. GRANT e RLS são camadas independentes: sem o
-- privilégio de tabela o PostgREST devolve 42501 antes mesmo de olhar a
-- policy — foi exatamente o que aconteceu com professor_perfil.
revoke all on alunos, aulas, presencas, graduacoes from anon;
revoke all on professor_perfil from anon;
revoke all on alunos_frequencia from anon;

grant select, insert, update, delete
  on alunos, aulas, presencas, graduacoes
  to authenticated;

-- sem delete, espelhando a ausência de policy de delete acima
grant select, insert, update on professor_perfil to authenticated;

-- A view roda com os privilégios de quem a criou (security definer é o padrão
-- de view no Postgres), mas ainda exige que o chamador tenha SELECT nela.
grant select on alunos_frequencia to authenticated;

-- `usage` no schema continua valendo para os dois papéis: sem ele nem o login
-- funciona. Não é ele que expõe dado nenhum — quem faz isso é o grant de
-- tabela, revogado acima.
grant usage on schema public to anon, authenticated;
