-- ============================================================
-- GrauMestre — Frequência passa a contar AULAS, não linhas de presença
-- Cole este SQL no Supabase > SQL Editor > Run
--
-- O BUG QUE ISTO CORRIGE
--
-- Até a 008 a view era:
--
--   count(p.id) filter (where p.presente = true) as total_presencas,
--   count(p.id)                                   as total_aulas
--   from alunos a left join presencas p on p.aluno_id = a.id
--
-- `total_aulas` contava LINHAS EM `presencas`, não aulas que aconteceram. E o
-- app só cria linha de presença para quem é marcado: falta não gera registro
-- (ver `alternar` e `marcarTodos` em components/AppShell.tsx). Logo, para quase
-- todo aluno, numerador = denominador, e a frequência dava ~100% — inclusive
-- para quem sumiu há semanas.
--
-- Isso contaminava o donut "Frequência geral", o anel de cada crachá, a
-- FreqBar do modal e a condição "Precisa atenção" (pct < 0.5), que na prática
-- nunca disparava.
--
-- DE QUEBRA, a divergência com o afastamento morre aqui. A view antiga contava
-- presenças de aulas que já estavam na lixeira (ela nem passava por `aulas`),
-- enquanto `ultima_presenca_data` — derivada em lib/carregar-dados.ts — já
-- filtrava `deleted_at is null`. Duas fontes discordando sobre o mesmo fato: um
-- aluno podia aparecer "AFASTADO" no filtro e com frequência alta no crachá.
-- Agora as duas leem aulas ativas, e só elas.
--
-- O DENOMINADOR É POR ALUNO, e não o total da academia: conta as aulas com
-- `data >= a.inicio`. Sem esse corte, quem entrou semana passada apareceria com
-- 4% e cairia direto em "Precisa atenção" no primeiro dia — medindo a data de
-- matrícula, não o comprometimento.
--
-- POR QUE SUBQUERY E NÃO JOIN: com `join aulas` + `group by`, o produto
-- cartesiano entre presenças e aulas infla as duas contagens. Duas subqueries
-- correlacionadas contam cada coisa na sua própria granularidade e dispensam o
-- `group by` inteiro.
-- ============================================================


-- ⚠ Mesmo motivo da 005 e da 008: o `select a.*` é expandido na CRIAÇÃO da
-- view, congelando a lista de colunas daquele instante. Toda mudança aqui é
-- drop + create, nunca `create or replace` (que se recusa a renomear coluna de
-- view existente quando a posição muda).
drop view if exists alunos_frequencia;

create view alunos_frequencia as
select
  a.*,

  -- Presenças de verdade: `presente = true`, em aula que não está na lixeira e
  -- que aconteceu depois de o aluno entrar. O filtro de `inicio` é o mesmo do
  -- denominador de propósito — sem ele, uma presença lançada com data anterior
  -- à matrícula deixaria total_presencas > total_aulas, e a barra passaria de
  -- 100%.
  (
    select count(*)
    from presencas p
    join aulas au on au.id = p.aula_id
    where p.aluno_id = a.id
      and p.presente = true
      and au.deleted_at is null
      and au.data >= a.inicio
  ) as total_presencas,

  -- Aulas que realmente aconteceram desde que este aluno entrou. Não depende de
  -- ele ter sido marcado — é exatamente isso que estava errado antes.
  (
    select count(*)
    from aulas au
    where au.deleted_at is null
      and au.data >= a.inicio
  ) as total_aulas

from alunos a;


-- O grant cai junto com a view dropada. Só `authenticated`: a 009 revogou tudo
-- de `anon`, e repetir o `to anon, authenticated` da 008 reabriria a leitura da
-- turma inteira para quem não tem sessão.
grant select on alunos_frequencia to authenticated;


-- A view agora roda duas subqueries por aluno. Numa academia com dezenas de
-- alunos e centenas de aulas isso é irrelevante, mas o índice parcial é barato
-- e mantém o denominador rápido conforme o histórico de aulas cresce.
create index if not exists idx_aulas_ativas_data
  on aulas (data)
  where deleted_at is null;
