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

## Atualização 2026-09-18 — Base estável + visão Hub

Branch: `feat/hub-ux-clean`. Decisão sênior: estabilizar base antes de expandir Hub.

- `docker/Dockerfile.backend`: imagem única Node 22 bookworm-slim + Python3 + Chromium (Playwright). Copia `scripts/` para a imagem, `SCRIPTS_DIR=/app/scripts`, `DATABASE_PATH=/data`, volume `torre-data`. Antes o spawn Python falharia em prod.
- `executor.ts`: `SCRIPTS_DIR` via env com fallback dev; guard anti path-traversal (`resolve` + prefix check rejeita `../`); `findPython()` com `.venv/bin/python` (Linux) + `PYTHON_PATH`.
- `docker-compose.yml`: removido `postgres` fantasma (backend usa SQLite better-sqlite3); volume persistente; `JWT_SECRET` obrigatório via `${JWT_SECRET:?}`; `OPENPORT_MOCK` default `false`.
- `server.ts`: fail-fast se `JWT_SECRET` ausente/default/curto (<32 chars); recusa `OPENPORT_MOCK=true` com `NODE_ENV=production`; warn em UAT.
- Visão Hub: Torre RPA = aplicação web central com todos os RPAs inseridos/configurados. Ver `docs/hub-roadmap.md` (catálogo dinâmico → params por RPA → histórico/agendamento → multi-instância) e `docs/frontend-ux-plan.md` (redesign clean).

## Atualização 2026-09-18 — UX clean + testes

- Frontend clean (Fases 1–3 do plano): tokens `muted/muted-2` definidos, foco visível, `BotCard` + grid responsiva, busca + filtros por status, skeletons/empty-states, header sem sweep, drawer 480px com `aria-live` e stick-to-bottom, `fieldset/legend` no filtro. `bot-row.tsx` mantido como morto para remoção no cleanup.
- Testes: `npm install` (npmmirror) ok; `lint:check` + `typecheck` verdes. E2E backend 10/11 — falha restante `stream SSE` (timeout 5s, spawna RPA Playwright real, ambiental). Fixes de testabilidade: `mkdir -p` do dir SQLite em `db/index.ts`; guard `JWT_SECRET` relaxado sob `VITEST/NODE_ENV=test`.
- `package-lock.json` revertido (npm 11 remove flags `peer:true`, ruído — sem mudança de deps).

## Atualização 2026-09-18 — SEV Intermarítima (carro-chefe, vitrine)

- Contexto: `Automacao_SEV.exe` é produto Windows on-premise no cliente (GUI, PyInstaller ~594MB, builds QAS/PROD v1.0.0). Cliente não acessa a Torre; update via zip; sem agente (GUI-only não permite orquestração remota).
- Modelo: Torre = vitrine + operação interna. `seed.ts` com 2 bots (`sev-intermaritima ★` + `paralisacao`); stub `scripts/sev/run.py` emite JSON-lines no contrato SSE (check Hub, sem .exe); `scripts/sev/versions.json` com versões/manual (binário fora do git, `sha256` a preencher).
- Frontend: banner ★ no dashboard → rota `/sev` (`SevProduct`: versões, manual, aviso release privada). Build ok.
- Validação: lint + typecheck verdes; E2E backend 10/11 (mesmo SSE ambiental). Teste `GET /api/bots → 1 bot` com nome desatualizado (agora 2) — renomear.

## Atualização 2026-09-18 — Guia do usuário + README

- Criado `docs/guia-usuario.md`: linguagem simples para leigos (o que é, como entrar, tela inicial, passo a passo de execução, página SEV, tabela de erros, FAQ, glossário).
- `README.md` (já existia): adicionada chamada para o guia no topo.

## Próximos Passos

1. **Novos RPAs** — Seguir o template `scripts/__template__/run.py`
2. **Histórico** — Página `/historico` de execuções com filtros (dados já no banco)
3. **Integração OpenPort real** — Remover `OPENPORT_MOCK`, apontar para API real
4. **Migrar SQLite → PostgreSQL** — Trocar driver Drizzle, rodar migrations
5. **Agentes de IA** — Evoluir scripts Python com langchain/crewai
6. **Microserviço Python** — Extrair `scripts/` para FastAPI independente