# Torre RPA · CODEBA Ilhéus

Painel web para centralizar, autenticar e executar automações RPA do Porto de Ilhéus.

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
npm run test -w apps/backend   # 11 testes E2E
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
| `POST /api/auth/openport` | Autentica no OpenPort |
| `GET /api/bots` | Lista automações |
| `GET /api/bots/:id/stream` | SSE — logs ao vivo da execução |
| `GET /api/health` | Health check |

## Fluxo

1. Clique em "Executar" → modal pede credenciais OpenPort
2. `POST /api/auth/openport` → retorna JWT
3. `GET /api/bots/:id/stream` → Node.js spawna Python
4. Python executa e emite logs via stdout → SSE → LogDrawer no frontend

## Docker

```bash
docker compose -f docker/docker-compose.yml up
```
