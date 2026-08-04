-- ============================================================
-- GrauMestre — Afastado: override manual do professor
-- Cole este SQL no Supabase > SQL Editor > Run
--
--   afastado_manual IS NULL  -> segue o cálculo automático por frequência
--   afastado_manual = true   -> afastado, mesmo com presença recente
--   afastado_manual = false  -> ativo, mesmo sem presença há meses
--
-- Três estados de propósito: o professor sabe de coisas que a
-- frequência não conta (lesão, viagem, mudança de horário). O NULL é
-- o padrão e devolve a decisão para o automático quando o override
-- é desfeito — por isso a coluna é nullable e não `default false`.
-- O prazo do cálculo automático vive em lib/afastamento.ts
-- (DIAS_PARA_AFASTADO), não aqui.
-- ============================================================

alter table alunos add column if not exists afastado_manual boolean;

-- ⚠ A view PRECISA ser recriada, pelo mesmo motivo da 005: o "select a.*"
-- foi expandido quando a view nasceu, então ela devolve a lista de colunas
-- congelada naquele momento e ignora qualquer coluna adicionada depois.
-- Sem este drop/create, `afastado_manual` existe na tabela mas nunca chega
-- no app, e o override manual nasce invisível.
--
-- `create or replace view` não serve: com o a.* re-expandido a POSIÇÃO das
-- colunas muda, e o Postgres se recusa a renomear coluna de view existente.
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
