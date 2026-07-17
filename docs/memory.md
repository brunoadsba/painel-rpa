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
- **Credenciais por execução:** Para UAT interno, o token JWT gerado é efêmero e mantido em memória no frontend (não é persistido no `localStorage`). Cada clique em "Executar" sempre exibe o modal solicitando credenciais.
- **Rate limiting:** 10 req/min na rota de auth (prevenção de força bruta), 100 req/min global. Nenhuma política de rate limiting / bloqueio temporário de usuário foi adicionada para o escopo do UAT local.
- `JWT_SECRET` é obrigatório — sem fallback, throw em tempo de módulo se ausente.
- **Segurança de credenciais:** Senha trafega apenas em memória durante a requisição de execução. Nunca é salva em banco de dados, localStorage ou logs. O banco persiste apenas o operador (`triggeredBy`).

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
- `OPENPORT_MOCK=true` → modo mock (padrão para UAT interno, aceita qualquer par usuário/senha não-vazio para gerar o JWT).
- `OPENPORT_MOCK=false` → chamada HTTP real à API do OpenPort.
- **Duplo papel das credenciais:** As credenciais digitadas no modal autenticam no backend (via mock para obter o JWT) e também são passadas para o processo filho do Playwright para o login real no portal. Logo, um login com mock pode ter sucesso, mas falhar na execução real do RPA caso a senha do OpenPort esteja incorreta.

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
| `POST` | `/api/bots/:id/stream` | Bearer JWT | SSE — dispara execução + logs ao vivo (body com credenciais) |

## Fluxo de Execução

1. Usuário clica "Executar" no bot (modal abre sempre)
2. Modal pede login/senha do OpenPort (Enter envia)
3. `POST /api/auth/openport` — backend valida (mock ou real) e retorna JWT
4. `POST /api/bots/:id/stream` com JWT no header e `{ username, password }` no body
5. Backend valida se `username === JWT.sub` e se o bot já está rodando (retorna erro amigável via SSE se estiver)
6. Backend atualiza `bots.status = 'running'` e insere a execução (`triggeredBy = username`)
7. Backend spawna `python scripts/<bot>/run.py` passando as credenciais no `env` do processo (nunca no `argv`)
8. Python executa e emite JSON no stdout; backend persiste no SQLite e repassa via SSE
9. Ao concluir (sucesso ou erro), o status do bot é atualizado (`bots.status = 'done'/'error'`) e a data da última execução é registrada (`lastRun`)
10. Se o backend crashar/reiniciar, o status do bot é redefinido para `idle` automaticamente no boot do servidor (evita status órfão preso em `running`)
11. Se o cliente fechar a aba/desconectar, o backend mata o processo Python filho correspondente
12. Timeout configurável de execução (`EXECUTION_TIMEOUT_MS`, padrão 30min)

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