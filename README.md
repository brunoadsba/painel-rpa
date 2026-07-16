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
| Tailwind CSS 3 | Zod + JWT | httpx + loguru · Playwright |
| TanStack Query | SSE em tempo real | Pydantic |
| Zustand | child_process → Python | .venv isolado |

## Rápido início

```bash
# (Todos os comandos devem ser executados na RAIZ do projeto)

# 1. Instalar dependências Node.js
npm install --registry https://registry.npmmirror.com

# 2. Ativar ambiente virtual Python e instalar dependências
scripts\.venv\Scripts\activate
pip install -r scripts\requirements.txt

# 3. Instalar Playwright (necessário para o RPA de Paralisação)
playwright install chromium

# 4. Configurar credenciais
cp .env.example .env
cp scripts\paralisacao\.env.example scripts\paralisacao\.env

# 5. Dev — dois terminais (um para cada)
npm run dev:backend   # Backend :3001
npm run dev:frontend  # Frontend :5173
```

## Estrutura

```
apps/
├── frontend/     React + Vite
└── backend/      Fastify + TS
packages/
└── shared/       Tipos compartilhados
scripts/
├── core/                Código Python compartilhado (logger, models)
├── paralisacao/         ✅ RPA real — registro de paralisações no OpenPort
├── openport-relatorio/  ⏳ Mock
├── movimentacao-diaria/ ⏳ Mock
└── ...                  (6 automações no total)
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
