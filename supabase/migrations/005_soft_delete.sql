-- ============================================================
-- GrauMestre — Soft delete (lixeira recuperável de 7 dias)
-- Cole este SQL no Supabase > SQL Editor > Run
--
--   deleted_at IS NULL  -> registro ativo, aparece normalmente
--   deleted_at = <data>  -> está na lixeira desde essa data
--
-- ⚠ A PURGA FÍSICA NÃO ESTÁ AUTOMATIZADA.
-- Nem este arquivo nem o app apagam linha nenhuma do banco. Os 7
-- dias são, hoje, apenas um filtro de EXIBIÇÃO na aba Lixeira:
-- passado o prazo o item some da tela, mas a linha continua no
-- banco até alguém apagar à mão. Se um dia for preciso limpar de
-- verdade, isso vira um cron/job separado — ainda não existe.
-- ============================================================

-- 1) A coluna em si — só ADD COLUMN, nenhuma tabela é recriada.
alter table alunos     add column if not exists deleted_at timestamptz;
alter table aulas      add column if not exists deleted_at timestamptz;
alter table graduacoes add column if not exists deleted_at timestamptz;

-- 2) View alunos_frequencia — precisa ser recriada.
--
-- O Postgres expande o "select a.*" no momento em que a view é criada.
-- Esta view nasceu na migration 001, então congelou as 9 colunas que
-- `alunos` tinha naquela época: ela não enxerga nem as 9 colunas
-- adicionadas pela 004 (data_nascimento, status_graduacao, ...) nem o
-- deleted_at acima. Sem recriar, o filtro .is('deleted_at', null) no
-- app falharia com "column does not exist".
--
-- `create or replace view` não resolve: com o a.* re-expandido a POSIÇÃO
-- das colunas muda (data_nascimento cai onde hoje está total_presencas),
-- e o Postgres se recusa a renomear coluna de view existente. Daí o
-- drop + create.
--
-- Efeito colateral desejado: data_nascimento, status_graduacao,
-- provisorio_desde, campeao_mundial_* e curso_* voltam a chegar até o
-- app. Hoje o modal do aluno mostra esses campos sempre em branco, mesmo
-- quando o banco tem valor, porque a view não os devolve.
drop view if exists alunos_frequencia;

create view alunos_frequencia as
select
  a.*,
  count(p.id) filter (where p.presente = true)  as total_presencas,
  count(p.id)                                    as total_aulas
from alunos a
left join presencas p on p.aluno_id = a.id
group by a.id;

-- O grant cai junto com a view dropada — refazendo o que a 003 deu.
grant select on alunos_frequencia to anon, authenticated;
