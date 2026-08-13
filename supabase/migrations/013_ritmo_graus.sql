-- ============================================================
-- GrauMestre — Ritmo de graus do professor (sugestão editável)
-- Cole este SQL no Supabase > SQL Editor > Run
--
-- O QUE ISTO **NÃO** É
--
-- Não é regra da IBJJF. É o ritmo de trabalho DESTE professor: de quantos
-- em quantos meses ele costuma dar um grau. O Artigo 4.1.3 do Sistema Geral
-- de Graduação diz explicitamente que, até a faixa marrom, o sistema de
-- graus fica a critério de cada Professor — é exatamente essa brecha que
-- esta coluna preenche.
--
-- Não confundir com os TEMPOS MÍNIMOS DE PERMANÊNCIA por faixa (art. 3.1.3
-- — 2 anos para virar azul, etc.), que são exigência da federação e não
-- podem ser alterados por ninguém. Aqueles vivem em lib/regras-ibjjf.ts e
-- continuam intocados; esta coluna alimenta lib/ritmo-graus.ts, que é outro
-- arquivo de propósito, para as duas coisas não se misturarem no código do
-- mesmo jeito que não devem se misturar na tela.
--
-- POR QUE EM `professor_perfil` E NÃO EM `alunos`
--
-- É o ritmo de quem gradua, não uma propriedade de quem é graduado. O app é
-- de um professor só (a 004 garante uma única linha aqui), então um valor
-- global é o modelo honesto. Se um dia precisar variar por aluno, o certo é
-- uma coluna nullable em `alunos` que caia de volta neste valor — e aí sim
-- a view precisará ser recriada.
--
-- ⚠ A VIEW `alunos_frequencia` NÃO PRECISA SER RECRIADA AQUI.
-- A armadilha do `select a.*` (ver 005 e 008) vale para colunas em
-- `alunos`. Esta coluna é em `professor_perfil`, tabela que a view nunca
-- referencia: o DDL da 010 é `from alunos a` com duas subqueries que tocam
-- só `presencas` e `aulas`. Verificado no DDL antes de escrever isto, não
-- presumido.
-- ============================================================


-- 1) A coluna.
--
-- `default 5` é o ritmo que o professor pediu como padrão, e `not null`
-- porque o app sempre tem um número para mostrar — "sem ritmo definido" não
-- é um estado que a tela precise representar. A linha que já existe recebe
-- o default no próprio ALTER.
--
-- O check é folga sã, não regra: 1 mês é o mais rápido que faz sentido
-- registrar, 60 meses (5 anos) cobre qualquer ritmo lento sem deixar passar
-- um dedo errado que gravasse 500.
alter table professor_perfil
  add column if not exists meses_entre_graus int not null default 5;

do $$
begin
  alter table professor_perfil
    add constraint professor_perfil_meses_entre_graus_check
    check (meses_entre_graus between 1 and 60);
exception
  when duplicate_object then null;  -- migration reexecutável
end $$;

comment on column professor_perfil.meses_entre_graus is
  'Ritmo do professor: meses sugeridos entre um grau e o próximo. Preferência editável (art. 4.1.3 deixa o sistema de graus a critério do Professor até a marrom) — NÃO é o tempo mínimo de permanência por faixa do art. 3.1.3.';


-- 2) Grants: nada a fazer.
--
-- Os grants da 003/009 são no nível da TABELA (`grant select, update on
-- professor_perfil to authenticated`), não por coluna, então a coluna nova
-- já entra coberta. Confirmado antes de omitir — se os grants fossem por
-- coluna, esquecer isto aqui daria "column not found" só em runtime.


-- 3) Conferência (rode depois do Run acima):
--
--   select column_name, data_type, column_default, is_nullable
--   from information_schema.columns
--   where table_name = 'professor_perfil' and column_name = 'meses_entre_graus';
--
--   select nome, graus, meses_entre_graus from professor_perfil;
--   -- deve trazer a linha única do professor com meses_entre_graus = 5
