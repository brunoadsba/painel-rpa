# Contexto — Torre RPA

Este arquivo documenta o **projeto completo** para que outro modelo de IA
entenda o ecossistema, a arquitetura e as regras de negócio sem precisar
explorar todo o repositório.

---

## 1. Visão Geral

**Torre RPA** é um painel web que centraliza automações (RPAs) do Porto
Organizado de Ilhéus (CODEBA). Cada RPA é um script Python que automatiza
uma tarefa operacional — como registrar paralisações de navio, gerar
relatórios de movimentação ou consolidar dados de atracação.

### 1.1. Por quê?

Antes da Torre RPA, cada automação era um script avulso que o operador
precisava rodar manualmente no terminal. Agora o operador abre o painel,
clica em "Executar" e acompanha os logs em tempo real.

### 1.2. Estado do projeto

| Status | O quê |
|--------|-------|
| ✅ Pronto | RPA de Paralisação (real, com Playwright) |
| 🔧 Arquitetura | Monorepo Node.js + Python híbrido |
| 🚀 Próximo | Adicionar novos RPAs seguindo template `__template__/run.py` |

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
| ORM | Drizzle | 0.38 |
| Banco | SQLite (dev) / PostgreSQL (prod) |
| Validação | Zod | 3 |
| Python | Python 3.12.10 | Scripts RPA |
| Lint/Format | Biome | 1.9 |
| Container | Docker + Docker Compose |

---

## 3. Estrutura do Monorepo

```
Painel RPA/
├── apps/
│   ├── frontend/               React 19 + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── app/            Providers, router
│   │   │   ├── components/     ui/, layout/, dashboard/, auth/, log/
│   │   │   ├── features/       Dashboard (página principal)
│   │   │   ├── hooks/          use-bots, use-execution
│   │   │   ├── services/       api, auth, bots
│   │   │   ├── stores/         auth-store, ui-store (Zustand)
│   │   │   └── styles/         globals.css (Tailwind)
│   │   └── vite.config.ts      Porta 5173, proxy /api → :3001
│   │
│   └── backend/                Fastify + Drizzle
│       ├── src/
│       │   ├── db/             Schema (bots, executions, logs) + seed (1 bot)
│       │   ├── routes/         auth, bots, execution
│       │   ├── services/       openport (híbrido mock/real), executor (spawn Python)
│       │   ├── middleware/     JWT verify
│       ├── __tests__/          Testes E2E (11 testes, Vitest)
│       ├── vitest.config.ts    Config Vitest
│       │   └── lib/            JWT sign/verify
│       └── data/               SQLite (gitignored)
│
├── packages/
│   └── shared/                 Tipos TS: Bot, Execution, LogEntry, AuthCredentials
│       └── src/types.ts
│
├── scripts/                    RPAs em Python
│   ├── requirements.txt        Dependências compartilhadas
│   ├── .venv/                  Virtualenv (gitignored)
│   ├── core/
│   │   ├── logger.py           emit_log() → JSON stdout
│   │   ├── models.py           Pydantic: BotConfig, LogEntry, ExecutionResult
│   │   └── openport_client.py  Client HTTP funcional (lê OPENPORT_API_URL do env)
│   ├── paralisacao/            ✅ RPA REAL (Playwright)
│   │   ├── run.py              Entry point headless para backend
│   │   ├── src/paralisacao/    14 módulos
│   │   ├── tests/              30 testes (pytest, 83% coverage)
│   │   ├── data/               Planilha, lookup de motivos
│   │   └── docs/               Guia operacional
│   └── __template__/           Template para novos RPAs
│
├── docker/
│   ├── docker-compose.yml      postgres + backend + frontend
│   ├── Dockerfile.backend      Multi-stage Node.js
│   └── Dockerfile.frontend     Multi-stage + nginx
│
├── docs/
│   ├── contexto.md             ← Este arquivo
│   ├── memory.md               Memória técnica do projeto
│   └── guia-operacional.md     Guia do RPA de paralisação
│
├── .env.example                Template de variáveis de ambiente
├── .gitignore
├── biome.json                  Config do linter
├── package.json                npm workspaces root
├── painel.md                   Documentação completa do monorepo (487 linhas)
└── torre-rpa.html              Mockup original (legado)
```

---

## 4. Frontend

### 4.1. Arquitetura

```
src/
├── app/
│   ├── index.tsx        QueryClientProvider + BrowserRouter
│   └── router.tsx       Rota única: / → Layout → Dashboard
├── components/
│   ├── ui/              button, input, modal, badge, beacon
│   ├── layout/          header (logo, relógio, status), layout (header+footer)
│   ├── dashboard/       bot-list (tabela), bot-row (linha com ação)
│   ├── auth/            auth-modal (login OpenPort)
│   └── log/             log-drawer (painel SSE)
├── features/
│   └── dashboard/       dashboard.tsx (página principal)
├── hooks/
│   ├── use-bots.ts      React Query: fetchBots, useExecuteBot
│   └── use-execution.ts SSE: connect, onLog, onDone, onError
├── services/
│   ├── api.ts           Fetch helper com JWT
│   ├── auth.ts          Chamadas de login
│   └── bots.ts          Chamadas de bots
├── stores/
│   ├── auth-store.ts    Zustand: JWT, isAuthenticated
│   └── ui-store.ts      Zustand: modal aberto, drawer, logs
└── styles/
    └── globals.css      Tailwind directives
```

### 4.2. Fluxo da tela principal

1. Ao carregar, `use-bots` busca `GET /api/bots` → tabela com bots cadastrados
2. Usuário clica "Executar" → `auth-modal` abre pedindo login/senha
3. Usuário preenche → `POST /api/auth/openport` → recebe JWT
4. Frontend conecta SSE em `GET /api/bots/:id/stream` com JWT
5. `log-drawer` renderiza cada log em tempo real
6. Ao final, recebe `event: done` e atualiza status do bot

### 4.3. Hooks principais

| Hook | Função | Tecnologia |
|------|--------|-----------|
| `use-bots.ts` | Listar bots + executar | React Query |
| `use-execution.ts` | Conectar SSE + tratar eventos | EventSource nativo |

---

## 5. Backend

### 5.1. Rotas

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/health` | ❌ | Health check |
| `POST` | `/api/auth/openport` | ❌ | Autentica no OpenPort → retorna JWT |
| `GET` | `/api/bots` | ❌ | Lista bots (público, sem auth) |
| `GET` | `/api/bots/:id` | ✅ JWT | Detalhes de um bot |
| `POST` | `/api/bots/:id/execute` | ✅ JWT | Dispara execução |
| `GET` | `/api/bots/:id/stream` | ✅ JWT | SSE — logs ao vivo |

### 5.2. Fluxo de autenticação

```
POST /api/auth/openport { username, password }
  → openport.ts (MOCK: aceita qualquer credencial)
  → Retorna { token: JWT, expiresAt }
  → Frontend salva JWT no localStorage (Zustand)

JWT payload: { sub: username, session: 'mock-openport-session-token', iat, exp }
JWT secret: process.env.JWT_SECRET (padrão: 'change-me-in-production')
```

**⚠️ O `openport.ts` é um mock.** Aceita qualquer login/senha. No futuro,
deve ser substituído por chamada HTTP real à API do OpenPort.

### 5.3. Executor (spawn Python)

`apps/backend/src/services/executor.ts`:

```
spawn(python, [scripts/<bot>/run.py, --bot-id, <uuid>, --openport-token, <token>, --triggered-by, <user>])
  ↓
Cada linha do stdout é um JSON → persiste no SQLite + envia via SSE
  ↓
Script encerra → update execution (status: done/error)
```

**⚠️ Guardião de concorrência:** um `Set<string>` (`runningBots`) impede que o mesmo bot seja executado duas vezes simultaneamente. A rota `POST /api/bots/:id/execute` retorna HTTP 409 se o bot já estiver rodando.

**⚠️ Proteções adicionais:** Timeout configurável (`EXECUTION_TIMEOUT_MS`, padrão 30min); cliente SSE desconectado mata o processo filho; valida `scriptPath` antes de registrar execução.

### 5.4. Error handler global

`server.ts` registra `setErrorHandler` no Fastify que captura qualquer exceção não tratada e retorna `{ success: false, error: "mensagem" }` com o código HTTP apropriado.

### 5.5. OpenPort híbrido (mock/real)

`services/openport.ts` lê `OPENPORT_API_URL` do ambiente:
- Se configurada com URL real (diferente de `example.com`): faz chamada HTTP
- Caso contrário: mantém o mock (aceita qualquer credencial)

### 5.4. Middleware

- `auth.ts`: verifica JWT no header `Authorization: Bearer <token>`
- Usado nas rotas protegidas (`/api/bots/:id`, `/api/bots/:id/stream`)

---

## 6. Banco de Dados

### 6.1. Tabelas (Drizzle ORM, SQLite dev / PostgreSQL prod)

**bots** — Catálogo de automações

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT PK | Slug (ex: `paralisacao`) |
| `name` | TEXT | Nome legível |
| `description` | TEXT | O que faz |
| `status` | TEXT | `idle` / `running` / `done` / `error` |
| `lastRun` | TEXT (ISO) | Última execução |
| `scriptPath` | TEXT | Caminho relativo em `scripts/` |

**executions** — Histórico de execuções

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT PK | UUID |
| `botId` | TEXT FK → bots.id | Bot executado |
| `botName` | TEXT | Desnormalizado |
| `status` | TEXT | `running` / `done` / `error` |
| `startedAt` / `finishedAt` | TEXT (ISO) | Timestamps |
| `triggeredBy` | TEXT | Username |
| `result` | TEXT | Mensagem final |

**logs** — Logs em tempo real

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | TEXT PK | UUID |
| `executionId` | TEXT FK | Execução vinculada |
| `level` | TEXT | `info` / `success` / `warn` / `error` |
| `message` | TEXT | Texto do log |
| `timestamp` | TEXT (ISO) | Momento do evento |

### 6.2. Seed (inicialização automática)

Ao iniciar o backend, se a tabela `bots` estiver vazia, insere 1 bot:

| id | Nome | Status | Real? |
|----|------|--------|-------|
| `paralisacao` | Paralisação | `idle` | ✅ Real |

> **Nota:** Novos RPAs devem ser adicionados no array `SEED_BOTS` em `apps/backend/src/db/seed.ts`.

---

## 7. API — Exemplos

### POST /api/auth/openport
```json
// Request
{ "username": "operador", "password": "123" }

// Response
{ "success": true, "data": { "token": "jwt...", "expiresAt": "2026-07-17T..." } }
```

### GET /api/bots
```json
// Response
{ "success": true, "data": [
  { "id": "paralisacao", "name": "Paralisação", "status": "idle", ... }
]}
```

### GET /api/bots/:id/stream (SSE)
```
data: {"executionId":"uuid","level":"info","message":"Acessando OpenPort...","timestamp":"..."}
data: {"executionId":"uuid","level":"success","message":"Login efetuado.","timestamp":"..."}
event: done
data: {"executionId":"uuid"}
```

---

## 8. Shared Package

`packages/shared/src/types.ts` contém os tipos TypeScript compartilhados:

```typescript
type BotStatus = 'idle' | 'running' | 'done' | 'error';

interface Bot { id, name, description, lastRun, status }
interface Execution { id, botId, botName, status, startedAt, finishedAt, triggeredBy, result }
interface LogEntry { id, executionId, timestamp, level: 'info'|'success'|'warn'|'error', message }
interface AuthCredentials { username, password }
interface AuthResponse { token, expiresAt }
interface ApiResponse<T> { success, data?, error? }
```

---

## 9. RPAs em Python

### 9.1. Core compartilhado (`scripts/core/`)

| Arquivo | O que faz |
|---------|-----------|
| `logger.py` | `emit_log(level, message, execution_id)` → imprime JSON no stdout |
| `models.py` | `BotConfig`, `LogEntry`, `ExecutionResult` (Pydantic) |
| `openport_client.py` | Client HTTP funcional (lê `OPENPORT_API_URL` do env, fallback mock, error handling) |

### 9.2. Único RPA atual: Paralisação

**Real** (`scripts/paralisacao/`):
Usa Playwright para abrir o navegador, logar no OpenPort, navegar pelas
telas e registrar paralisações automaticamente. 14 módulos, 30 testes.

> **Nota:** Novos RPAs seguem o template em `scripts/__template__/run.py` e são registrados no seed.

### 9.3. Como a paralisação funciona (domínio)

No porto, quando um navio está atracado carregando/descarregando, a operação
pode ser **interrompida temporariamente** por motivos como:

- **Segurança:** DDS (Diálogo Diário de Segurança) — briefings obrigatórios
- **Clima:** Chuva forte que impede a operação
- **Mecânico:** Defeito em equipamento (esteira, guindaste)
- **Operacional:** Troca de turno, descanso, aguardando caminhão
- **Burocrático:** Visita da ANVISA, documentação, vistoria

Cada interrupção é uma **paralisação** — período com hora de início e fim
que precisa ser registrado no sistema OpenPort para controle de estadia do
navio, produtividade e faturamento.

**O RPA automatiza isso:** lê uma planilha Excel com as paralisações do dia,
abre o OpenPort via Playwright, busca a capa do navio (ou cria se não
existir) e registra cada paralisação com checagem anti-duplicata.

### 9.4. Entry point `run.py`

Quando o backend spawna o script, ele chama `run.py` que:

1. Parseia `--bot-id` e `--openport-token`
2. Configura logging JSON no stdout (para SSE)
3. Força `HEADLESS=true` e `PRIMEIRO_PLANO=false`
4. Define `PARALISACAO_ROOT` para resolver paths
5. Carrega `.env`, planilha, status
6. Chama `executar()` do módulo principal

```python
# Exemplo de chamada:
python scripts/paralisacao/run.py --bot-id uuid --openport-token mock-token
```

---

## 10. Docker

`docker/docker-compose.yml` — 3 serviços:

| Serviço | Porta | Base |
|---------|-------|------|
| postgres | 5432 | `postgres:16-alpine` |
| backend | 3001 | `Dockerfile.backend` (Node.js) |
| frontend | 80 | `Dockerfile.frontend` (nginx) |

```bash
docker compose -f docker/docker-compose.yml up
```

---

## 11. CI (GitHub Actions)

`.github/workflows/ci.yml` — executa em todo push:

- `biome check` — lint + formatação
- `tsc --noEmit` — typecheck em todos workspaces
- `vitest run` — 11 testes E2E (apps/backend)

---

## 12. Como adicionar um novo RPA

### 12.1. Script Python

Criar `scripts/novo-rpa/run.py`:

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import argparse
from core.logger import emit_log
from core.models import BotConfig

parser = argparse.ArgumentParser()
parser.add_argument("--bot-id", required=True)
parser.add_argument("--openport-token", required=True)
args = parser.parse_args()

config = BotConfig(bot_id=args.bot_id, name="Novo RPA", openport_token=args.openport_token)
emit_log("info", "Iniciando...", config.bot_id)
# ... lógica real ...
emit_log("success", "Concluído!", config.bot_id)
```

### 12.2. Registrar no banco

Adicionar no array `SEED_BOTS` em `apps/backend/src/db/seed.ts`:

```typescript
{
  id: 'novo-rpa',
  name: 'Novo RPA',
  description: 'Descrição',
  status: 'idle' as const,
  lastRun: null,
  scriptPath: 'novo-rpa/run.py',
}
```

### 12.3. Frontend

O bot aparece automaticamente na lista via `GET /api/bots`.

---

## 13. Setup para Desenvolvimento

```bash
# 1. Clonar
git clone https://github.com/brunoadsba/painel-rpa.git
cd painel-rpa

# 2. Node.js (npm mirror necessário nesta máquina)
npm install --registry https://registry.npmmirror.com

# 3. Python
python -m venv scripts/.venv
scripts\.venv\Scripts\activate
pip install -r scripts/requirements.txt
playwright install chromium

# 4. Configurar ambiente
cp .env.example .env
cp scripts\paralisacao\.env.example scripts\paralisacao\.env
# Editar .env com credenciais reais

# 5. Rodar (dois terminais)
npm run dev:backend   # Fastify :3001
npm run dev:frontend  # Vite :5173
```

### Testes

```bash
# Backend (11 testes E2E)
npm run test -w apps/backend

# Python (paralisacao)
cd scripts/paralisacao
$env:PYTHONPATH="src"; pytest

# Lint geral
npm run lint
npm run typecheck
```

---

## 14. Convenções

- Commits em português
- ~300 linhas máximo por arquivo (code review)
- TypeScript strict mode
- Biome para tudo (sem ESLint/Prettier)
- Componentes React: função pura, props com interface
- Imports: npm primeiro, depois internos, ordenados

---

## 15. Arquivos de Referência

| Arquivo | Conteúdo |
|---------|----------|
| `painel.md` | Documentação completa original (489 linhas) |
| `docs/memory.md` | Memória técnica resumida |
| `docs/guia-operacional.md` | Guia detalhado do RPA de paralisação |
| `scripts/paralisacao/run.py` | Entry point da paralisação |
| `apps/backend/src/services/executor.ts` | Spawn do Python + SSE |
| `apps/backend/src/db/seed.ts` | Seed data (1 bot) |
| `apps/backend/src/db/index.ts` | Conexão SQLite + init |
| `packages/shared/src/types.ts` | Tipos TypeScript |
| `scripts/core/logger.py` | Logger Python |
