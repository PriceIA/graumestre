# Product

<!-- impeccable:product-schema 1 -->

> Fontes: `CLAUDE.md` e `docs/ROADMAP.md`. Tudo o que está **sem marca** vem
> desses dois documentos ou de decisão do Pedro. Tudo o que é chute do
> Claude está marcado **(proposta)** e espera a aprovação do Pedro.

## Platform

web

PWA instalável (`public/manifest.json`, `public/sw.js`), usado no celular.
Next.js 14 (App Router) + Supabase + Tailwind, deploy na Vercel. Não é app
nativo: mobile web continua `web`.

## Users

**Usuário principal: o professor.** Um professor faixa preta, dono de uma
turma de jiu-jítsu. Usa o app **no tatame, no celular, com pressa**: faz a
chamada, olha quem está pronto para graduar, registra a aula. Sai da tela no
meio de uma tarefa e o que já foi tocado tem que estar salvo.

**Segundo usuário (Parte 2 do ROADMAP, ainda não existe): o aluno.** Cada
aluno tem login próprio (apelido + senha, sem e-mail), cria o próprio
cadastro por um link e **confirma a própria presença**. Vê a própria faixa,
graus, frequência, histórico de graduação e as aulas (técnica e vídeo). Não
edita faixa, graus nem graduações: isso é do professor.

**A turma inclui crianças.** Mesmo fluxo dos adultos. A turma é privada.

Hoje existem 33 alunos cadastrados (linha de base de 2026-10-21).

## Product Purpose

Gestão de alunos e aulas de jiu-jítsu para **uma pessoa**: o professor.
Não é SaaS multi-academia e não é vendido. É a ferramenta de trabalho dele.

Faz quatro coisas: cadastro de alunos (com faixa, graus e histórico de
graduação), lançamento de aulas (com foto e vídeo), **chamada rápida** e
alerta de quem está pronto para graduar.

Sucesso, para o professor: resolver cada tarefa no tatame em menos toques,
sem perder dado. A chamada é o exemplo canônico: uma linha por aluno, um
toque, grava na hora, sem botão "Salvar".

Sucesso na Parte 2: o aluno confirma a própria presença sozinho e o
professor deixa de lançar tudo na mão.

## Positioning

**Funcionalidade antes de estética.** Entre uma tela mais bonita e uma tela
que resolve em menos toques, ganha a que resolve.

O que um app genérico de academia não copia: as regras de graduação da IBJJF
embutidas (faixas, graus, idade e tempo mínimo), com o **ritmo do próprio
professor** tratado como coisa à parte da regra da federação, e a **confiança
como método**: o aluno confirma a própria presença e o app não o vigia.

## Operating Context

- **Tatame:** celular na mão, pressa, às vezes uma mão só. A tela de celular
  é a principal (até 959 px); o computador (960 px ou mais) é o escritório.
- **Rede pode cair.** Hoje um toque na chamada sem rede se perde (fila
  offline é pendência conhecida, adiada de propósito).
- **Regras da IBJJF:** faixas e graus (art. 4.1.2), tempo mínimo por faixa
  (art. 3.1.3), idade mínima. O professor define o ritmo dos graus, que é
  sugestão dele e nunca regra da federação (art. 4.1.3).
- **Login do professor:** `apelido@graumestre.app`. O domínio é só
  identificador, não recebe e-mail. Não há cadastro público nem "esqueci a
  senha" automático.
- **Instalação:** o professor instala o PWA no celular. No iPhone, o iOS
  converte foto HEIC para JPEG sozinho (verificado em 2026-08-11).

## Capabilities and Constraints

**O que nunca pode se perder (regra de ouro):**
- cadastro dos alunos, **histórico de graduações** e **presenças**.
- Migration só acrescenta, nunca apaga nem renomeia coluna. Backup antes de
  qualquer migration. O banco é um só: teste no `localhost` escreve nos dados
  reais.
- A lixeira apaga de verdade após 7 dias. Apagar um aluno leva junto todas as
  presenças e **todo o histórico de graduações** dele.

**A presença do aluno (Parte 2):**
- Grava na hora (`confirmado_por = 'aluno'`) e **conta para a frequência na
  hora**. Nada espera o professor.
- Prazo para o aluno confirmar: 24 horas, contadas a partir do mais tarde
  entre o lançamento da aula e o começo do dia dela.
- O professor **confere depois**: uma lista "Para conferir" com um contador,
  "Conferir todas" com um toque, ou tira a que estiver errada.
- **Isto não é "dupla confirmação".** Dupla confirmação seria a presença só
  valer depois de um segundo ok. Aqui a presença do aluno já vale; a
  conferência do professor é uma **revisão posterior**, que não trava nem
  atrasa nada e que o professor pode inclusive não fazer. Ela existe para
  corrigir exceção, não para validar cada presença. (Redação desta
  distinção: **proposta**, a partir de "Presença conta na hora e avisa o
  professor" no ROADMAP; o Pedro confirma.)

**O que o app deliberadamente não faz:**
- Não usa geolocalização, foto nem dupla confirmação para presença: a
  confiança é a conduta do próprio jiu-jítsu.
- Não tem cadastro público. Conta de aluno só nasce por convite, e nenhum
  convite funciona antes da RLS por papel estar pronta e testada.
- Não tem multi-academia.

**Terminologia:** faixa, grau, graduação, chamada, presença, afastado,
"pronto para graduar", lixeira. "Afastado" é por aulas perdidas, não por dias
de calendário.

**Segurança (estado atual):** o que protege o banco hoje é o `GRANT`, não a
RLS (desligada em `alunos`, `aulas`, `graduacoes`, `presencas`). Ligar a RLS
por papel é pré-requisito da Parte 2.

**Em aberto (decisões do Pedro):** o que o aluno pode editar no próprio
cadastro (campo a campo, no começo da G9); recuperação de senha (sugestão:
"Nova senha provisória" pelo professor); como ligar contas aos alunos que já
existem (link pessoal é a preferência).

## Brand Commitments

- Nome: **GrauMestre**. Logo definitivo ainda não existe: o Pedro desenha; até
  lá, "GM" provisório.
- Os ícones atuais do PWA vêm do logo de outro projeto e serão substituídos.
- Faixas e graus aparecem desenhados de verdade, seguindo o regulamento da
  IBJJF (cores e estrutura).
- Linguagem do app: **português do Brasil**.
- Voz: curta, direta, de quem fala no tatame. Estado sempre escrito, sem
  depender só de cor. **(proposta)**

## Evidence on Hand

Dados reais (linha de base de 2026-10-21): 33 alunos, 5 aulas, 59
presenças, 29 graduações.

Backup fora do repositório em `C:\Backups\graumestre\<data>\` (contém hash
de senha e dados de crianças: nunca vai para git, nuvem ou e-mail).

**Não existe, e não deve ser inventado:** depoimentos, métricas de uso,
outros professores ou academias usando o app, preço.

## Product Principles

1. **Um toque, salvo na hora.** O professor sai da tela no meio; o que foi
   tocado já está no banco.
2. **Os dados dos alunos são intocáveis.** Em dúvida entre rapidez e não
   perder dado, ganha não perder dado.
3. **Uma pergunta, uma resposta.** "Quem sumiu", "quem está pronto" e a
   frequência têm uma função cada, usada em todas as telas. Duas contas para
   a mesma pergunta acabam divergindo. **(proposta de redação; a regra vem do
   CLAUDE.md)**
4. **A regra da federação e a sugestão do professor ficam separadas.** O app
   nunca apresenta o ritmo dele como exigência da IBJJF. **(proposta de
   redação)**
5. **Confiança no aluno, revisão depois.** Nada de vigilância; a conferência
   do professor corrige exceção, não bloqueia o aluno.

## Accessibility & Inclusion

- Contraste **AA** nos dois temas (claro e escuro) e alvos de toque de
  **44 px** (ROADMAP, regra 10 e G13).
- Uso com pressa e, muitas vezes, com uma mão só.
- Crianças na turma: dados de menores (nome, nascimento, foto) tratados como
  sensíveis; bucket de fotos privado.
- Nenhuma informação importante só por cor. **(proposta)**
