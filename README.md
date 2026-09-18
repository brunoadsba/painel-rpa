# Torre RPA · CODEBA Ilhéus

Painel web para centralizar, autenticar e executar automações RPA do Porto de Ilhéus.

> **Usuário?** Comece pelo [Guia do Usuário](docs/guia-usuario.md) — linguagem simples, passo a passo.

![stack](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![stack](https://img.shields.io/badge/Fastify-5-000000?logo=fastify)
![stack](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)
![stack](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

---

## Stack

| Frontend | Backend | Scripts |
|---|---|---|
| React 19 + Vite | Fastify 5 + TS | Python 3.12 |
| Tailwind CSS 3 | Zod + JWT | Playwright + httpx |
| TanStack Query | SSE em tempo real | Pydantic |
| Zustand | child_process → Python | .venv isolado |

## Rápido início

```bash
# (Todos os comandos na RAIZ do projeto)

# 1. Instalar dependências Node.js
npm install --registry https://registry.npmmirror.com

# 2. Ativar ambiente virtual Python e instalar dependências
scripts\.venv\Scripts\activate
pip install -r scripts\requirements.txt

# 3. Instalar Playwright (necessário para o RPA de Paralisação)
playwright install chromium

# 4. Configurar credenciais
cp .env.example .env
copy scripts\paralisacao\.env.example scripts\paralisacao\.env
# Editar .env com credenciais reais

# 5. Dev — dois terminais (um para cada)
npm run dev:backend   # Backend :3001
npm run dev:frontend  # Frontend :5173

# 6. Testes
npm run test -w apps/backend   # 9 testes E2E
npm run lint                   # Biome
npm run typecheck              # TypeScript
```

## Estrutura

```
apps/
├── frontend/     React + Vite
└── backend/      Fastify + TS + Vitest
packages/
└── shared/       Tipos compartilhados
scripts/
├── core/                Código Python compartilhado (logger, models, openport_client)
├── __template__/        Template para novos RPAs
└── paralisacao/         ✅ RPA real — registro de paralisações no OpenPort
```

## API

| Rota | Descrição |
|---|---|
| `POST /api/auth/openport` | Autentica no OpenPort (rate: 10/min) |
| `GET /api/bots` | Lista automações (público) |
| `GET /api/bots/:id` | Detalhes de um bot (JWT) |
| `POST /api/bots/:id/stream` | SSE — dispara execução + logs ao vivo (JWT + body credenciais) |
| `GET /api/health` | Health check |

## Fluxo

1. Clique em "Executar" → Modal sempre abre pedindo credenciais OpenPort (token efêmero em memória)
2. `POST /api/auth/openport` → retorna JWT (rate: 10/min)
3. `POST /api/bots/:id/stream` → envia JWT no header e `{ username, password }` no body.
4. O backend valida o JWT e o body, muda o status do bot para `running`, e spawna o script Python injetando as credenciais via `env`.
5. Se o servidor Node.js for reiniciado, bots que estavam com status `running` voltam para `idle` automaticamente no boot.
6. Python executa e emite JSON lines via stdout → SSE → LogDrawer no frontend
7. Logs persistem no SQLite em tempo real
8. Cliente desconecta → processo filho é morto automaticamente

## Segurança

- `JWT_SECRET` obrigatório (sem fallback), algoritmo HS256 explícito
- Rate limiting: 10 req/min na auth, 100 req/min global
- Fetch OpenPort com timeout 15s (AbortController)
- Graceful shutdown: SIGTERM/SIGINT fecha server + DB
- `:id` validado em todas as rotas (rejeita vazio/null)

## Docker

```bash
docker compose -f docker/docker-compose.yml up
```
