# docs/handoff — o bloco de notas entre os dois Claudes

Duas pessoas trabalham neste projeto e uma delas é o Felipe. As outras duas são
IAs que **não se falam**: o Claude do chat (que planeja, revisa e escreve os
prompts) e o Claude Code (que lê o código e executa). Até agora o Felipe era o
fio entre elas, copiando texto e print de um lado para o outro.

Esta pasta substitui isso. São dois arquivos de texto no disco, cada um com **um
dono que escreve e um dono que lê**:

| Arquivo | Quem ESCREVE | Quem LÊ |
|---|---|---|
| `PARA-O-CODE.md` | o Claude do chat | o Claude Code |
| `DO-CODE.md` | o Claude Code | o Claude do chat |

Cada um escreve só no seu. Assim os dois nunca disputam o mesmo arquivo e não
existe conflito possível.

## Como o Felipe usa

Ele não copia mais nada. Só alterna duas frases:

- para o Claude Code: **"lê o `docs/handoff/PARA-O-CODE.md` e segue"**
- para o Claude do chat: **"ele respondeu, lê o `DO-CODE.md`"**

## Regras que os dois lados seguem

1. **Reler do disco toda vez, antes de escrever.** O que está no contexto de
   qualquer um dos dois pode estar velho — o outro escreveu enquanto isso.
2. **Sobrescrever, mas CONSOLIDANDO.** Cada arquivo é sempre "a mensagem
   atual", não um histórico — mas a mensagem atual tem que conter **tudo que
   ainda está pendente**, não só a novidade da rodada. Nunca suponha que o outro
   lado leu as rodadas anteriores: ele pode ter passado três delas trabalhando
   sem reler o arquivo, e a sobrescrita apaga o que ele não viu. *(Isso já
   aconteceu uma vez, na Etapa 4: a construção das 13 faixas infantis foi
   escrita e apagada antes de ser lida.)* Histórico de decisão vive no
   `docs/PLANO-ATUAL.md`; histórico de mudança vive no `CHANGELOG.md` e no
   `git log`.
3. **Cabeçalho obrigatório** em todo escrito, para o outro lado saber se está
   lendo coisa nova ou repetida:

   ```
   > **De:** <quem> · **Para:** <quem>
   > **Etapa:** <número e nome> · **Rodada:** <n>
   > **Data:** <aaaa-mm-dd hh:mm>
   > **Preciso de:** <o que se espera de volta>
   ```

4. **Perguntas para o Felipe vão numa seção separada e marcada**, nunca
   escondidas no meio do texto. Ele é o único que pode responder decisão de
   produto, e ele lê rápido.
5. **Os dois arquivos estão no `.gitignore`.** São rascunho de trabalho, não
   fazem parte do projeto, e não devem sujar o diff das etapas. O registro que
   fica é `CLAUDE.md`, `CHANGELOG.md` e `docs/PLANO-ATUAL.md` — esses continuam
   commitados, e continuam sendo atualizados antes de todo commit.

Este `README.md` é o único arquivo desta pasta que vai para o repositório.
