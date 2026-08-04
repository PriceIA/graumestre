-- ============================================================
-- GrauMestre — Link da gravação da aula
-- Cole este SQL no Supabase > SQL Editor > Run
--
-- O professor grava a aula e sobe num link privado do YouTube para
-- quem faltou assistir depois. O link quase nunca existe na hora de
-- lançar a aula — ele chega só depois da gravação subir —, então a
-- coluna é NULL e o campo é opcional na criação e editável depois.
--
-- Sem check de formato no banco de propósito: a validação de URL
-- vive no formulário, e um check aqui rejeitaria em silêncio um
-- link legítimo de um encurtador ou domínio novo do YouTube.
-- ============================================================

alter table aulas add column if not exists link_youtube text;
