# Hub de Automações — Roadmap

Visão: Torre RPA como aplicação web central (Hub) com todos os RPAs inseridos/configurados.

## Onde estamos
- 1 bot (`paralisacao`), seed estático, execução via SSE, SQLite, 1 instância.

## Fase A — Catálogo dinâmico (próximo)
- Tabela `bots` já existe. Adicionar colunas: `version`, `enabled`, `params_schema (JSON)`, `timeout_ms`, `updated_at`.
- Endpoints: `POST /api/bots` (cadastrar), `PATCH /api/bots/:id` (enable/disable, timeout), `GET /api/bots` filtra `enabled=true`.
- Frontend: cards com status, busca, toggle ativo.
- DoD: cadastrar 2º RPA só via API/UI, sem editar `seed.ts`.

## Fase B — Params por RPA
- Hoje: só `username/password` via env. Evoluir para `params: Record<string, unknown>` validado por Zod por bot.
- `tools.json` por bot: `{ "fields": [{ "name": "ESTADIA_LABEL", "type": "string", "required": true }] }`.
- Executor passa params como env prefixado `RPA_*` + argv `--params-json` (nunca shell).
- Frontend gera form dinâmico a partir do schema.
- DoD: executar `paralisacao` informando estadia/operador no modal, sem `.env`.

## Fase C — Histórico + agendamento
- Tabelas `executions/logs` já existem. Criar página `/historico` (filtros por bot, status, período, triggeredBy; download de artefato).
- Agendamento: `node-cron` no backend + tabela `schedules(bot_id, cron, params, enabled)`.
- DoD: agendar `paralisacao` diário 06h e ver no histórico.

## Fase D — Multi-instância / produção
- Trocar `runningBots` Set por lock no banco (`UPDATE bots SET status='running' WHERE id=? AND status='idle'`).
- Migrar SQLite → Postgres (Drizzle), fila (BullMQ) se >5 RPAs concorrentes.
- DoD: 2 réplicas sem duplo-run.

## Ordem de execução
A → B → C → D. Não pular.
