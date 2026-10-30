# COMO-USAR-SKILLS.md — qual skill em qual fase

Guia rápido do lote v2 (`docs/ROADMAP.md`). O Claude Code diz **qual skill
está usando** no começo de cada etapa. Em dúvida, o ROADMAP manda.

## Por fase

| Fase | Superpowers | Impeccable | Outras |
|---|---|---|---|
| G0 Terreno | plano + execução | — | — |
| G1 Ping | plano | — | — |
| G2 PRODUCT/DESIGN | — | `init`, `document` | UI UX Pro Max (alerta, erro/sucesso, contraste AA) |
| G3 Fundação visual | plano + execução | — | Chrome DevTools (comparar com o protótipo), `react-best-practices` no fim |
| G4 Datas | plano + TDD | — | — |
| G5 Alunos / G6 Aulas | plano + execução | `shape` antes de codar | Chrome DevTools, `react-best-practices`, `web-design-guidelines` no fim |
| G7 Chamada | plano + execução | `shape` | Chrome DevTools, `web-design-guidelines` |
| G8 Graduar/Início/Mais | plano + execução | `shape`, `audit`, `polish` | Taste (Início e login), todas de revisão |
| G9 Contas e papéis | **brainstorm** | — | Chrome DevTools (teste de segurança) |
| G10 Convites | plano + execução | `shape`, `onboard` | Taste |
| G11 Portal do aluno | plano + execução | `shape` | Taste, `web-design-guidelines` |
| G12 Login/ícones | — | `critique` | Taste |
| G13 Revisão final | — | `audit`, `harden`, `polish` | `web-design-guidelines`, Chrome DevTools |

## Regras de uso

- **Superpowers** é o processo: brainstorm → plano em `docs/superpowers/plans/`
  → execução em tarefas → revisão. Nada de código antes do plano aprovado.
- **Impeccable** e **UI UX Pro Max** não criam visual novo: o protótipo
  `docs/direcoes/gm-kimono.html` manda. Servem para planejar, revisar e
  documentar.
- **Taste** só em telas de impacto (cadastro/portal do aluno, login, splash,
  Início). Nunca em listas, tabelas e chamada.
- **Chrome DevTools MCP** substitui o Playwright (não instalado): console,
  chamadas ao Supabase (`PGRST204`), Lighthouse, comparação com o protótipo em
  390 px e 1280 px, nos dois temas.
- Nenhuma tela é dada como pronta sem teste em 390 px e 1280 px, nos dois temas.

## Comandos interativos (só o Pedro roda)

`/plugin` (ver o que está instalado), `/mcp` (servidores MCP) e
`/permissions` (liberar `Read(~/.claude/skills/**)`). O Claude Code não
consegue executá-los.

## Modelo por fase

Cada fase do ROADMAP começa com uma linha **🔁 Modelo**. O Claude Code avisa
quando é hora de trocar (`/model`). Critério: erro que mexe em dado de aluno
ou em segurança → Opus; rotina fácil de desfazer → Sonnet.
