# Torre RPA — Painel de Automações CODEBA Ilhéus

## 1. Propósito

Painel web que centraliza, autentica e executa scripts de automação RPA do Porto de Ilhéus. Cada RPA é disparado com 1 clique via interface web e requer autenticação no sistema OpenPort.

---

## 2. Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + Vite + TypeScript | 19 / 6 / 5.7 |
| Estilização | Tailwind CSS | 3 |
| Estado servidor | TanStack React Query | 5 |
| Estado UI | Zustand | 5 |
| Roteamento | React Router | 7 |
| Backend | Fastify + TypeScript | 5 |
| ORM | Drizzle (SQLite dev, PostgreSQL prod) | 0.38 |
| Validação | Zod | 3 |
| Python | Python 3.12.10 | scripts RPA |
| Container | Docker + Docker Compose | produção |
| Lint/Format | Biome | 1.9 |

---

## 3. Estrutura de Diretórios (completa)

```
C:/Users/bruno.santos/Downloads/Projetos/Painel RPA/
├── package.json                          # Monorepo root (npm workspaces)
├── tsconfig.base.json                    # TS config compartilhada
├── biome.json                            # Linter/formatter config
├── .gitignore
├── .env.example                          # BACKEND_PORT, DATABASE_URL, JWT_SECRET, OPENPORT_API_URL
├── torre-rpa.html                        # Mockup original (legado, 386 linhas)
├── painel.md                             # Este arquivo
│
├── apps/
│   ├── frontend/                         # React 19 + Vite + TS + Tailwind
│   │   ├── package.json
│   │   ├── vite.config.ts                # Porta 5173, proxy /api → :3001
│   │   ├── tailwind.config.js            # Paleta navy/teal
│   │   ├── public/
│   │   │   └── codeba-logo.png           # Logo CODEBA (16KB)
│   │   └── src/
│   │       ├── main.tsx                  # Entry point
│   │       ├── app/
│   │       │   ├── index.tsx             # Providers (QueryClient, BrowserRouter)
│   │       │   └── router.tsx            # Rotas (Layout → Dashboard)
│   │       ├── components/
│   │       │   ├── ui/
│   │       │   │   ├── button.tsx
│   │       │   │   ├── input.tsx
│   │       │   │   ├── modal.tsx         # <dialog> element
│   │       │   │   ├── badge.tsx         # Status badge
│   │       │   │   └── beacon.tsx        # Status indicator dot
│   │       │   ├── layout/
│   │       │   │   ├── header.tsx        # Logo, relógio, "OPENPORT ONLINE"
│   │       │   │   └── layout.tsx        # Header + footer wrapper
│   │       │   ├── dashboard/
│   │       │   │   ├── bot-list.tsx      # Tabela de bots
│   │       │   │   └── bot-row.tsx       # Linha individual
│   │       │   ├── auth/
│   │       │   │   └── auth-modal.tsx    # Modal de login OpenPort
│   │       │   └── log/
│   │       │       └── log-drawer.tsx    # Painel SSE de logs
│   │       ├── features/
│   │       │   └── dashboard/
│   │       │       └── dashboard.tsx     # Página principal
│   │       ├── hooks/
│   │       │   ├── use-bots.ts           # React Query (fetchBots, useExecuteBot)
│   │       │   └── use-execution.ts      # SSE stream hook
│   │       ├── services/
│   │       │   ├── api.ts               # Fetch wrapper com JWT
│   │       │   ├── auth.ts              # Chamadas de autenticação
│   │       │   └── bots.ts              # Chamadas de bots
│   │       ├── stores/
│   │       │   ├── auth-store.ts        # Zustand (JWT no localStorage)
│   │       │   └── ui-store.ts          # Zustand (modal, drawer, logs)
│   │       ├── lib/
│   │       │   └── auth-token.ts        # Token helper
│   │       └── styles/
│   │           └── globals.css           # Tailwind directives
│   │
│   └── backend/                          # Fastify 5 + TypeScript
│       ├── package.json
│       ├── tsconfig.json
│       ├── drizzle.config.ts             # Config Drizzle Kit (SQLite)
│       ├── data/
│       │   └── torre-rpa.db              # SQLite database (gitignored)
│       └── src/
│           ├── server.ts                 # Bootstrap: CORS, routes, health, initDatabase()
│           ├── db/
│           │   ├── index.ts              # Conexão SQLite + auto-init (tabelas)
│   │   ├── seed.ts               # Seed data (1 bot)
│           │   └── schema.ts             # Schema Drizzle (bots, executions, logs)
│           ├── routes/
│           │   ├── auth.routes.ts        # POST /api/auth/openport
│           │   ├── bots.routes.ts        # GET /api/bots, GET /api/bots/:id
│           │   └── execution.routes.ts   # POST execute, GET stream (SSE)
│           ├── services/
│           │   ├── openport.ts           # Mock autenticação OpenPort
│           │   └── executor.ts           # spawn Python, parse stdout, persiste logs
│           ├── middleware/
│           │   └── auth.ts               # JWT verify middleware
│           └── lib/
│               └── jwt.ts                # JWT sign/verify
│
├── packages/
│   └── shared/                           # Tipos TypeScript compartilhados
│       ├── package.json
│       └── src/
│           ├── types.ts                  # Bot, Execution, LogEntry, AuthCredentials, AuthResponse, ApiResponse
│           └── constants.ts              # STATUS_LABEL, STATUS_COLOR
│
├── scripts/                              # RPAs em Python
│   ├── requirements.txt                  # httpx, pydantic, loguru, python-dotenv
│   ├── .venv/                            # Python 3.12.10 virtualenv
│   ├── __template__/                     # Template para novos RPAs
│   │   └── run.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── models.py                    # Pydantic models
│   │   ├── logger.py                    # emit_log() → JSON stdout
│   │   └── openport_client.py           # Async httpx client (placeholder)
│   └── paralisacao/                     # RPA real (Playwright)
│       └── run.py
│
├── docker/
│   ├── docker-compose.yml               # postgres + backend + frontend
│   ├── Dockerfile.backend               # Multi-stage Node.js build
│   └── Dockerfile.frontend              # Multi-stage + nginx
│
└── .github/workflows/
    └── ci.yml                           # Lint + typecheck + test
```

---

## 4. Database Schema (Drizzle ORM)

### `bots` — Catálogo de automações

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT PK | Slug único (ex: `paralisacao`) |
| `name` | TEXT | Nome legível |
| `description` | TEXT | Descrição funcional |
| `status` | TEXT | `idle` / `running` / `done` / `error` |
| `lastRun` | TEXT (ISO) | Timestamp da última execução |
| `scriptPath` | TEXT | Caminho relativo em `scripts/` |

### `executions` — Histórico de execuções

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT PK | UUID |
| `botId` | TEXT FK → bots.id | Bot executado |
| `botName` | TEXT | Denormalizado para queries |
| `status` | TEXT | `idle` / `running` / `done` / `error` |
| `startedAt` | TEXT (ISO) | Início |
| `finishedAt` | TEXT (ISO) | Fim (nullable) |
| `triggeredBy` | TEXT | Username que disparou |
| `result` | TEXT | Mensagem de resultado |

### `logs` — Logs em tempo real

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT PK | UUID |
| `executionId` | TEXT FK → executions.id | Execução vinculada |
| `level` | TEXT | `info` / `success` / `warn` / `error` |
| `message` | TEXT | Texto do log |
| `timestamp` | TEXT (ISO) | Momento do evento |

---

## 5. API REST

### Endpoints

| Método | Rota | Auth | Descrição | Arquivo |
|--------|------|------|-----------|---------|
| `GET` | `/api/health` | Não | `{"status":"ok","timestamp":"..."}` | server.ts:16 |
| `POST` | `/api/auth/openport` | Não | Autentica no OpenPort, retorna JWT | auth.routes.ts |
| `GET` | `/api/bots` | Não | Lista todos os bots (público) | bots.routes.ts:10 |
| `GET` | `/api/bots/:id` | JWT | Detalhes de um bot | bots.routes.ts:15 |
| `POST` | `/api/bots/:id/execute` | JWT | Dispara execução (cria registro) | execution.routes.ts:9 |
| `GET` | `/api/bots/:id/stream` | JWT | SSE com logs ao vivo | execution.routes.ts:22 |

### Formato de resposta padrão

```typescript
// Sucesso
{ "success": true, "data": T }

// Erro
{ "success": false, "error": string }
```

### Auth Flow

```
POST /api/auth/openport
Body: { "username": string, "password": string }
→ { "success": true, "data": { "token": "jwt...", "expiresAt": "ISO" } }

JWT payload: { sub: username, session: openport-session-token, iat, exp }
JWT secret: process.env.JWT_SECRET (padrão: 'change-me-in-production')
```

---

## 6. Fluxo de Execução (detalhado)

```
[Usuário]                    [Frontend]                    [Backend Node.js]                [Python Script]
    │                            │                              │                              │
    │  clica "Executar"          │                              │                              │
    │ ─────────────────────────► │                              │                              │
    │                            │                              │                              │
    │                            │  abre AuthModal              │                              │
    │                            │◄─────────────────────────────│                              │
    │                            │                              │                              │
    │  digita login/senha        │                              │                              │
    │ ─────────────────────────► │                              │                              │
    │                            │  POST /api/auth/openport     │                              │
    │                            │ ────────────────────────────►│                              │
    │                            │                              │  authenticateOpenPort()       │
    │                            │                              │  (MOCK: aceita qualquer       │
    │                            │                              │   credencial, retorna         │
    │                            │                              │   'mock-openport-session')    │
    │                            │                              │                              │
    │                            │  { token: JWT }              │                              │
    │                            │◄─────────────────────────────│                              │
    │                            │                              │                              │
│                            │  GET /api/bots/:id/stream    │                              │
│                            │  (Authorization: Bearer JWT) │                              │
│                            │ ────────────────────────────►│                              │
│                            │                              │  verifica runningBots set    │
│                            │                              │  (409 se já estiver rodando) │
│                            │                              │  cria execution no banco     │
│                            │                              │  (status: running)           │
│                            │                              │                              │
│                            │  SSE: data: {...}            │  spawn (python run.py)       │
    │                            │◄─────────────────────────────│ ────────────────────────────►│
    │                            │                              │                              │
    │                            │  renderiza logs no LogDrawer │  stdout JSON lines:          │
    │                            │◄─────────────────────────────│◄─────────────────────────────│
    │                            │                              │  cada linha → persiste logs  │
    │                            │                              │  + envia SSE                 │
    │                            │                              │                              │
    │                            │                              │                              │  script termina
    │                            │                              │                              │ ──────────────────►
    │                            │                              │  update execution            │
    │                            │                              │  (status: done/error)        │
    │                            │                              │                              │
    │                            │  event: done / event: error  │                              │
    │                            │◄─────────────────────────────│                              │
    │                            │                              │                              │
    │                            │  fecha SSE, atualiza UI      │                              │
    │                            │◄─────────────────────────────│                              │
```

---

## 7. Pontos de Integração (para outro modelo de IA)

### 7.1. Scripts Python (RPA)

Cada script em `scripts/<nome>/run.py` segue este padrão:

```python
import argparse
from core.logger import emit_log

parser = argparse.ArgumentParser()
parser.add_argument("--bot-id", required=True)
parser.add_argument("--openport-token", required=True)  # NUNCA usado atualmente
args = parser.parse_args()

emit_log("info", "Autenticando no OpenPort...", args.bot_id)
# TODO: chamar openport_client.authenticate() com args.openport_token
```

**Estado atual:** Apenas `paralisacao/` tem lógica real (Playwright). Novos RPAs seguem o template `scripts/__template__/run.py`.

**Arquitetura de transição prevista:**
```
Fase 1 (atual): Node.js spawn(python script.py)
Fase 2 (futura): Python vira microserviço FastAPI independente
                 Node.js vira API gateway
```

### 7.2. OpenPort Client (placeholder)

`scripts/core/openport_client.py`:

```python
BASE_URL = "https://api.openport.example.com"  # ← SUBSTITUIR
```

Estrutura correta (async httpx) mas URL é placeholder. Nenhum script a importa.

### 7.3. OpenPort Auth (híbrido mock/real)

`apps/backend/src/services/openport.ts`:

```typescript
const API_URL = process.env.OPENPORT_API_URL;  // Se configurado, usa HTTP real
```

Comportamento atual:
- Se `OPENPORT_API_URL` estiver definida e não contiver `example.com` → faz chamada HTTP real
- Caso contrário → mantém mock (aceita qualquer credencial, retorna `'mock-openport-session-token'`)

### 7.4. Token fallback

`apps/backend/src/services/executor.ts:33`:

```typescript
token ?? 'mock-token',
```

Se nenhum token for passado, envia `'mock-token'` para o Python. Remover quando integração real estiver pronta.

### 7.5. Configuração ausente

| Variável | Onde | Status |
|----------|------|--------|
| `OPENPORT_API_URL` | `.env.example` | Lido por `openport.ts` — se real, faz chamada HTTP; se não, mock |
| `JWT_SECRET` | `.env.example` | Lido em `lib/jwt.ts` |
| `DATABASE_URL` | `.env.example` | PostgreSQL (não usado — SQLite atual) |
| `.env` | Raiz | NÃO EXISTE (copiar de `.env.example`) |

---

## 8. Comunicação entre camadas

```
Frontend (Vite :5173)
    │
    │ proxy Vite (/api → :3001)
    │
    ▼
Backend Node.js (Fastify :3001)
    │
    │ child_process.spawn()
    │ stdout: JSON lines
    │
    ▼
Python Script (scripts/<bot>/run.py)
    │
    │ httpx (futuro)
    │
    ▼
OpenPort API (externa)
```

**Comunicação em tempo real:** SSE (Server-Sent Events) — unidirecional, nativo HTTP. Cada `data: {...}\n\n` é um log.

---

## 9. Ambiente de Desenvolvimento

```bash
# Backend (porta 3001)
npm run dev:backend          # tsx watch src/server.ts

# Frontend (porta 5173, proxy /api → :3001)
npm run dev:frontend         # vite

# Lint e typecheck
npm run lint                 # biome check --write .
npm run typecheck            # tsc --noEmit em todos workspaces

# Python
scripts/.venv/Scripts/pip install -r scripts/requirements.txt
scripts/.venv/Scripts/python scripts/<bot>/run.py --bot-id x --openport-token y
```

**Nota sobre npm registry:** O registry `https://registry.npmjs.org` retorna 403 nesta máquina. Usar `--registry https://registry.npmmirror.com` para instalar pacotes.

---

## 10. Docker (Produção)

`docker/docker-compose.yml` define 3 serviços:

| Serviço | Imagem | Porta |
|---------|--------|-------|
| postgres | postgres:16-alpine | 5432 |
| backend | Dockerfile.backend | 3001 |
| frontend | Dockerfile.frontend (nginx) | 80 |

```bash
docker compose -f docker/docker-compose.yml up
```

---

## 11. Próximos Passos (roteiro)

1. **Novos RPAs reais:** Adicionar automações seguindo `scripts/__template__/run.py`
2. **Navegação:** Adicionar rota `/historico` com tabela de execuções passadas (dados já no banco)
3. **OpenPort real:** Substituir mock `openport.ts` por chamada HTTP real + conectar `openport_client.py` nos scripts Python
4. **PostgreSQL:** Trocar driver Drizzle (SQLite → pg), rodar migrations
5. **Agentes IA:** Evoluir scripts Python com langchain/crewai
6. **Microserviço Python:** Extrair scripts para FastAPI independente

---

## 12. Contratos (Shared Types)

`packages/shared/src/types.ts`:

```typescript
type BotStatus = 'idle' | 'running' | 'done' | 'error';

interface Bot {
  id: string;
  name: string;
  description: string;
  lastRun: string | null;
  status: BotStatus;
}

interface Execution {
  id: string;
  botId: string;
  botName: string;
  status: BotStatus;
  startedAt: string;
  finishedAt: string | null;
  triggeredBy: string;
  result: string | null;
}

interface LogEntry {
  id: string;
  executionId: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

interface AuthCredentials {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  expiresAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

## 13. Convenções

- ~300 linhas máximo por arquivo (code review)
- TypeScript strict mode
- Biome para tudo (sem ESLint/Prettier)
- Imports: npm → internos, ordenados
- Componentes React: função pura, props com interface, sem classes
- Commits em português

---

## 14. Comandos Úteis

```bash
# Instalar dependências (registry alternativo)
npm install --registry https://registry.npmmirror.com

# Rodar tudo
npm run dev:backend   # terminal 1
npm run dev:frontend  # terminal 2
```
