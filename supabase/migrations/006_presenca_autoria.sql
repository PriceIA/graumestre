-- ============================================================
-- GrauMestre — Autoria da presença
-- Cole este SQL no Supabase > SQL Editor > Run
--
-- Hoje só o professor lança presença, então toda linha nasce como
-- 'professor'. Quando o aluno tiver login e confirmar a própria
-- presença, o app passa 'aluno' no upsert e nada mais muda: a
-- permissão de quem pode gravar continua sendo decidida fora daqui
-- (RLS / papel), esta coluna só registra QUEM confirmou.
--
-- A confiança é a conduta do jiu-jítsu — de propósito não existe
-- geolocalização, foto nem dupla confirmação. Não acrescente.
-- ============================================================

-- Default 'professor' faz as 4 linhas que já existem virarem
-- 'professor' retroativamente, sem backfill manual.
alter table presencas
  add column if not exists confirmado_por text not null default 'professor';

alter table presencas
  add column if not exists confirmado_em timestamptz not null default now();

-- Só os dois valores previstos. Se um dia entrar um terceiro papel
-- (monitor, por exemplo), é aqui que ele é liberado.
alter table presencas drop constraint if exists presencas_confirmado_por_check;
alter table presencas
  add constraint presencas_confirmado_por_check
  check (confirmado_por in ('professor', 'aluno'));

-- presencas nunca entrou na lixeira da 005 e continua fora: desmarcar
-- um aluno é um update de `presente` para false, não um delete. O
-- histórico de quem foi/não foi na aula fica sempre íntegro.
