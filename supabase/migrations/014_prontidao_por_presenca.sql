-- ============================================================
-- GrauMestre — Prontidão para GRAU por presença (não mais faixa por tempo zero)
-- Cole este SQL no Supabase > SQL Editor > Run
--
-- O PROBLEMA QUE ISTO FECHA
--
-- O card "Prontos para graduar" listava praticamente a turma inteira. A causa
-- não era conta errada de tempo: a IBJJF não exige tempo nenhum na faixa
-- branca (art. 3.1.3 I), então tempoMinimoAnos() sempre devolveu 0 e
-- prontoParaProximaFaixa() sempre devolveu true para todo branca adulto desde
-- o dia da matrícula. O alerta agora passa a ser sobre GRAU — rotina do
-- professor — com critério de PRESENÇA definido por ele (art. 4.1.3 permite),
-- e o alerta de FAIXA só dispara para quem está de fato no teto de graus e
-- cumpre tempo mínimo da IBJJF. Ver docs/PLANO-ATUAL.md, ETAPA 1.
--
-- 1) A COLUNA EM professor_perfil
--
-- `presencas_por_grau` é preferência do professor, não regra da federação —
-- por isso mora em professor_perfil e é lida por lib/ritmo-graus.ts, nunca
-- por lib/regras-ibjjf.ts. Default 48 (~2 aulas/semana por 6 meses), editável
-- na tela. O check é folga sã: 1 é o mínimo que faz sentido registrar, 500
-- cobre qualquer critério exigente sem deixar passar um dedo errado.
--
-- 2) A VIEW alunos_frequencia — DROP + CREATE, de novo
--
-- ⚠ Mesma armadilha da 005/008/010: `select a.*` é expandido na CRIAÇÃO da
-- view, então toda coluna nova em `alunos` (não é o caso aqui) ou toda coluna
-- derivada nova precisa de drop + create, nunca `create or replace`.
--
-- Duas colunas novas, ambas por aluno, com a mesma data-base:
--
--   greatest(
--     coalesce(
--       (select max(g.data) from graduacoes g
--         where g.aluno_id = a.id and g.deleted_at is null),
--       a.inicio
--     ),
--     a.inicio
--   )
--
-- O `g.deleted_at is null` é obrigatório: sem ele, uma graduação que foi para
-- a lixeira continua empurrando a janela para frente e o aluno nunca mais
-- aparece como pronto. E lib/carregar-dados.ts já filtra
-- `.is('deleted_at', null)` ao montar `ultima_graduacao_data` no client — sem
-- o mesmo filtro aqui, a view e o client discordariam sobre a mesma data, que
-- é exatamente a divergência que a migration 010 foi escrita para matar.
--
-- O `greatest(..., a.inicio)` por fora é o mesmo piso que a 010 já aplica em
-- total_presencas/total_aulas (`au.data >= a.inicio`), e pela MESMA razão:
-- quem vem de outra academia tem graduação registrada com data anterior à
-- matrícula aqui (é para isso que existem `veio_de_faixa_juvenil` e
-- `status_graduacao = 'provisorio'`), então a data-base sozinha podia cair
-- antes de `a.inicio` e contar aulas que aconteceram antes de o aluno existir
-- nesta turma. Sem o piso, um aluno com poucas aulas disponíveis apareceria
-- com `aulas_desde_graduacao` maior que o total de aulas que ele podia ter
-- frequentado — a mesma distorção que a 010 já fechou para o denominador
-- geral, reaberta aqui se este `greatest` for removido achando redundância.
--
-- `presencas_desde_graduacao` conta presenças reais (`presente = true`) em
-- aulas ativas com `data >= data-base`. `aulas_desde_graduacao` conta as aulas
-- ativas no mesmo intervalo. Esta última não é consumida por nenhum código
-- desta etapa — é usada pela Etapa 2 (painel do sininho, "esteve em 31 das 40
-- aulas"). Adicionar as duas agora evita dropar e recriar a view de novo só
-- para isso, que é a operação arriscada.
--
-- POR QUE SQL E NÃO CLIENT: lib/carregar-dados.ts busca aulas com `.limit(50)`.
-- Contar 48 presenças exige olhar pelo menos 48 aulas — o limite quebraria a
-- conta exatamente no ponto em que ela importa. A view não tem limite.
--
-- 3) O GRANT cai junto com a view dropada — refeito no mesmo arquivo.
-- ============================================================


-- 1) A coluna em professor_perfil.
alter table professor_perfil
  add column if not exists presencas_por_grau int not null default 48;

do $$
begin
  alter table professor_perfil
    add constraint professor_perfil_presencas_por_grau_check
    check (presencas_por_grau between 1 and 500);
exception
  when duplicate_object then null;  -- migration reexecutável
end $$;

comment on column professor_perfil.presencas_por_grau is
  'Ritmo do professor: presenças sugeridas entre um grau e o próximo, contadas desde a última graduação registrada. Preferência editável (art. 4.1.3 deixa o sistema de graus a critério do Professor até a marrom) — NÃO é regra da IBJJF.';


-- 2) A view — drop + create.
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
  ) as total_presencas,

  (
    select count(*)
    from aulas au
    where au.deleted_at is null
      and au.data >= a.inicio
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
  ) as presencas_desde_graduacao,

  -- Aulas ativas no mesmo intervalo — não usada nesta etapa, preparada para a
  -- Etapa 2 mostrar "31 de 40 aulas" no painel do sininho.
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
  ) as aulas_desde_graduacao

from alunos a;


-- O grant cai junto com a view dropada. Só `authenticated` (a 009 revogou
-- tudo de `anon`).
grant select on alunos_frequencia to authenticated;


-- 3) Conferência (rode depois do Run acima):
--
--   select column_name, data_type, column_default
--   from information_schema.columns
--   where table_name = 'professor_perfil' and column_name = 'presencas_por_grau';
--
--   select nome, presencas_por_grau from professor_perfil;
--   -- deve trazer a linha única do professor com presencas_por_grau = 48
--
--   select nome, total_presencas, total_aulas, presencas_desde_graduacao, aulas_desde_graduacao
--   from alunos_frequencia
--   where deleted_at is null
--   order by nome;
--   -- presencas_desde_graduacao <= total_presencas, e <= aulas_desde_graduacao,
--   -- para todo aluno — vale sempre por causa do greatest(..., a.inicio): a
--   -- janela "desde a graduação" nunca começa antes da janela "desde o
--   -- início", só igual ou depois.
