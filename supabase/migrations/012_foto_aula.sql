-- ============================================================
-- GrauMestre — Foto da aula (upload real no Supabase Storage)
-- Cole este SQL no Supabase > SQL Editor > Run
--
-- UMA foto por aula, tirada com os alunos. Diferente de `alunos.foto_url`,
-- que é uma URL externa que o professor cola à mão: aqui o arquivo é
-- enviado de verdade, do celular, e vive num bucket nosso.
--
-- POR QUE `foto_path` E NÃO `foto_url`
--
-- O bucket é PRIVADO, então não existe URL estável para guardar. O que a
-- coluna guarda é o caminho dentro do bucket (`<aula_id>/<uuid>.jpg`), e a
-- URL é assinada na hora da leitura, com validade curta. Guardar uma URL
-- assinada no banco seria guardar algo que vence.
--
-- O nome diferente de `alunos.foto_url` é de propósito: ali é URL mesmo,
-- aqui é caminho. Mesmo nome para coisas diferentes é como se erra depois.
--
-- ⚠ A VIEW `alunos_frequencia` NÃO PRECISA SER RECRIADA AQUI.
-- A armadilha do `select a.*` (ver 005 e 008) vale para colunas em
-- `alunos`. Esta coluna é em `aulas`, e a view só toca `aulas` dentro de
-- duas subqueries que usam `count(*)` e colunas nomeadas (`au.id`,
-- `au.deleted_at`, `au.data`) — nunca `au.*`. Verificado no DDL da 010
-- antes de escrever isto, não presumido.
-- ============================================================


-- 1) A coluna.
alter table aulas add column if not exists foto_path text;

comment on column aulas.foto_path is
  'Caminho no bucket aulas-fotos (<aula_id>/<uuid>.jpg). NÃO é URL: o bucket é privado e a URL é assinada na leitura.';


-- 2) O bucket, privado.
--
-- `public = false` é a decisão central: a foto é de uma turma de jiu-jítsu
-- que inclui crianças (o app tem faixas infantis), então ninguém sem sessão
-- vê a imagem — nem de posse do link. Bucket público seria obscuridade
-- (URL inadivinhável), não proteção.
--
-- Os dois limites são rede de segurança do lado do servidor: o app já
-- comprime para ~150-300 KB antes de subir (lib/comprimir-imagem.ts), mas
-- se a compressão falhar ou for burlada, o Storage recusa em vez de aceitar
-- um arquivo de câmera de vários MB e comer o plano free.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('aulas-fotos', 'aulas-fotos', false, 2097152, array['image/jpeg'])
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- 3) Policies do bucket.
--
-- Mesmo desenho das tabelas (009): uma policy por operação, e não `for all`
-- — restringir só a escrita no futuro vira editar uma linha. `anon` não
-- aparece em nenhuma: sem sessão não lê, não escreve, não apaga.
--
-- Ainda é app de um usuário só; quem está autenticado é o professor. Quando
-- o aluno tiver login, a distinção nasce aqui, comparando auth.uid() com o
-- dono — hoje seria complexidade sem uso.
--
-- Os drops deixam a migration reexecutável: `create policy` não tem
-- `if not exists`.
drop policy if exists "aulas_fotos_select" on storage.objects;
drop policy if exists "aulas_fotos_insert" on storage.objects;
drop policy if exists "aulas_fotos_update" on storage.objects;
drop policy if exists "aulas_fotos_delete" on storage.objects;

create policy "aulas_fotos_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'aulas-fotos');

create policy "aulas_fotos_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'aulas-fotos');

create policy "aulas_fotos_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'aulas-fotos')
  with check (bucket_id = 'aulas-fotos');

create policy "aulas_fotos_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'aulas-fotos');


-- 4) Conferência (rode depois do Run acima):
--
--   select id, public, file_size_limit, allowed_mime_types
--   from storage.buckets where id = 'aulas-fotos';
--
--   select policyname, cmd, roles from pg_policies
--   where schemaname = 'storage' and tablename = 'objects'
--     and policyname like 'aulas_fotos%';
--
--   select column_name, data_type from information_schema.columns
--   where table_name = 'aulas' and column_name = 'foto_path';
--
-- ⚠ A purga da lixeira (011) apaga a LINHA da aula, não o objeto no
-- Storage: o cascade do Postgres não alcança o bucket. Uma aula purgada
-- deixa o arquivo órfão. É pouco (uma foto por aula) e não vaza — o bucket
-- é privado —, mas está registrado como dívida conhecida no CLAUDE.md.
