# Torre RPA — CODEBA Ilhéus

## Visão Geral

Painel web para centralizar, autenticar e executar scripts de automação RPA do Porto de Ilhéus. Cada RPA é disparado com 1 clique e requer autenticação OpenPort.

## Arquitetura

### Stack

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | Moderno, tipado, ideal para consumir APIs |
| Estilização | Tailwind CSS 3 | Produtivo, design system consistente |
| Estado servidor | TanStack React Query | Cache, refetch, mutations |
| Estado UI | Zustand | Leve, sem boilerplate |
| Roteamento | React Router v7 | SPA |
| Backend | Fastify + TypeScript | Rápido, schema-based, tipado |
| ORM | Drizzle (SQLite dev / PostgreSQL prod) | Leve, type-safe, schema compartilhável |
| Validação | Zod | Schemas compartilháveis |
| Runtime Python | Python 3.12.10 | Scripts RPA + agentes de IA futuros |
| Container | Docker + Docker Compose | Ambiente padronizado |
| CI/CD | GitHub Actions | Lint + typecheck + test |
| Lint/Format | Biome | Tudo-em-um, rápido |

### Estrutura de Diretórios

```
torre-rpa/
├── apps/
│   ├── frontend/          React 19 + Vite + TS + Tailwind
│   │   ├── public/         # Assets estáticos (codeba-logo.png)
│   │   ├── src/
│   │   │   ├── app/           # Entry, providers, router
│   │   │   ├── components/    # ui/, layout/, dashboard/, auth/, log/
│   │   │   ├── features/      # dashboard/
│   │   │   ├── hooks/         # use-bots, use-execution
│   │   │   ├── services/      # api, auth, bots
│   │   │   ├── stores/        # auth-store, ui-store (Zustand)
│   │   │   └── styles/        # globals.css (Tailwind directives)
│   │   └── ...
│   └── backend/           Fastify + TypeScript
│       ├── __tests__/        # Testes E2E (9 testes, Vitest)
│       ├── src/
│       │   ├── db/            # Schema Drizzle + conexão SQLite + seed
│       │   ├── routes/        # auth, bots, execution (SSE)
│       │   ├── services/      # openport (híbrido), executor (spawn Python)
│       │   ├── middleware/    # auth (JWT)
│       │   └── lib/           # jwt
│       ├── vitest.config.ts   # Config Vitest
│       ├── data/              # SQLite (dev), gitignored
│       └── ...
├── packages/
│   └── shared/            Tipos compartilhados (Bot, LogEntry, AuthCredentials…)
├── scripts/               RPAs em Python
│   ├── .venv/             Python 3.12.10 isolado
│   ├── __template__/      Template para novos RPAs (run.py)
│   ├── core/              Módulo compartilhado (logger, models, openport_client)
│   └── paralisacao/       RPA real (Playwright, 14 módulos, 30 testes)
├── docker/
│   ├── docker-compose.yml  # postgres + backend + frontend
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
└── .github/workflows/ci.yml
```

## Decisões Técnicas

### Node.js + Python (híbrido)
- **Fase 1 (atual):** Backend Node.js spawna scripts Python via `child_process.spawn`. Python emite logs como JSON lines no stdout → Node.js encaminha via SSE para o frontend.
- **Fase 2 (futuro):** Microserviço Python (FastAPI) para agentes de IA. Node.js vira API gateway.

### Comunicação em tempo real
- SSE (Server-Sent Events) em vez de WebSocket. Mais simples, unidirecional, nativo no HTTP.

### Autenticação
- JWT stateless (HS256). Backend autentica no OpenPort, devolve um JWT. Frontend armazena no localStorage.
- **Rate limiting:** 10 req/min na rota de auth (força bruta), 100 req/min global.
- `JWT_SECRET` é obrigatório — sem fallback, throw em tempo de módulo se ausente.

### Banco de Dados
- **SQLite** em desenvolvimento (`data/torre-rpa.db`), **PostgreSQL** em produção.
- Drizzle ORM com schema type-safe. Tabelas: `bots`, `executions`, `logs`.
- Auto-init na inicialização: raw SQL em `initDatabase()` + comentário de sync com `schema.ts`.
- Seed data em `db/seed.ts` (1 bot: `paralisacao`).

### Execução concorrente
- `executor.ts` mantém `Set<string>` de bots em execução (`runningBots`).
- `GET /api/bots/:id/stream` é a ÚNICA rota que dispara execução (via SSE).
- `POST /api/bots/:id/execute` foi removida (era dead code — frontend só usava SSE).

### Tratamento de erros
- Fastify `setErrorHandler` global captura exceções não tratadas → `{ success: false, error: string }`.
- `executor.ts`: DB writes e `onLog` com try/catch isolados — falha de IO não quebra a execução.
- Frontend: SSE trata `event: done` e `event: error`; erros de rede não são silenciosos.

### Segurança
- `JWT_SECRET` sem fallback — o servidor não inicializa se não estiver definido.
- `jwt.verify` com `algorithms: ['HS256']` explícito — prevenção contra algorithm confusion.
- `openport.ts`: mock via `OPENPORT_MOCK=true` explícito (não mais heuristic `includes('example.com')`).
- Fetch para OpenPort com AbortController (timeout 15s).
- `:id` nas rotas validado (rejeita vazio/null).

### Graceful Shutdown
- `SIGTERM`/`SIGINT` fecham o servidor Fastify + conexão SQLite — previne corrupção de DB em container.

### OpenPort (autenticação híbrida)
- `OPENPORT_MOCK=true` ou `OPENPORT_API_URL` ausente → mock (aceita qualquer credencial).
- `OPENPORT_MOCK!=true` + `OPENPORT_API_URL` real → chamada HTTP com timeout.

### Monorepo npm workspaces
- `packages/shared` — tipos TypeScript compartilhados entre frontend e backend
- `ApiResponse<T>` é discriminated union (`success: true` → `data` garantido)

## API REST

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/openport` | Não (rate 10/min) | Autentica no OpenPort, retorna JWT |
| `GET` | `/api/health` | Não | Health check |
| `GET` | `/api/bots` | Não | Lista automações (público) |
| `GET` | `/api/bots/:id` | Bearer JWT | Detalhes de um bot |
| `GET` | `/api/bots/:id/stream` | Bearer JWT | SSE — dispara execução + logs ao vivo |

## Fluxo de Execução

1. Usuário clica "Executar" no bot
2. Modal pede login/senha do OpenPort (com `<form>` nativo, Enter funciona)
3. `POST /api/auth/openport` — retorna JWT
4. `GET /api/bots/:id/stream` — backend verifica se bot já está rodando, cria registro no banco, spawna `python scripts/<bot>/run.py`
5. Python emite JSON lines no stdout
6. Node.js captura, persiste no SQLite (com try/catch) e envia via SSE
7. Frontend renderiza cada log em tempo real; trata eventos `done` e `error`
8. Se cliente desconectar, processo Python é morto (`req.raw.on('close')`)
9. Timeout configurável (`EXECUTION_TIMEOUT_MS`, padrão 30min)

## Convenções

- **Tamanho máximo de arquivo:** ~300 linhas.
- **TypeScript strict mode** habilitado.
- **Biome** para formatação e lint.
- **Componentes:** funções puras, props com interface.
- **Estilos:** Tailwind CSS + animações centralizadas em `globals.css`. Sem `<style>` inline.

## Como Rodar

```bash
# Desenvolvimento
npm run dev:backend   # Fastify :3001
npm run dev:frontend  # Vite :5173 (proxy /api → :3001)

# Testes
npm run test -w apps/backend   # 9 testes E2E
npm run lint                   # Biome
npm run typecheck              # tsc --noEmit

# Build produção
npm run build
docker compose -f docker/docker-compose.yml up
```

## Python

```bash
scripts/.venv/Scripts/pip install -r scripts/requirements.txt
scripts/.venv/Scripts/python scripts/<bot>/run.py --bot-id x --openport-token y
```

## Adicionar novo RPA

1. Copiar `scripts/__template__/` → `scripts/meu-rpa/`
2. Implementar lógica em `run()` usando `core.logger`
3. Adicionar ao array `SEED_BOTS` em `apps/backend/src/db/seed.ts`
4. Executar: `npm run test -w apps/backend && npm run lint && npm run typecheck`

## Próximos Passos

1. **Novos RPAs** — Seguir o template `scripts/__template__/run.py`
2. **Histórico** — Página `/historico` de execuções com filtros (dados já no banco)
3. **Integração OpenPort real** — Remover `OPENPORT_MOCK`, apontar para API real
4. **Migrar SQLite → PostgreSQL** — Trocar driver Drizzle, rodar migrations
5. **Agentes de IA** — Evoluir scripts Python com langchain/crewai
6. **Microserviço Python** — Extrair `scripts/` para FastAPI independente