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
| Roteamento | React Router v7 | SPA (~/dashboard, ~/historico no futuro) |
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
│       ├── src/
│       │   ├── db/            # Schema Drizzle + conexão SQLite
│       │   ├── routes/        # auth, bots, execution
│       │   ├── services/      # openport, executor
│       │   ├── middleware/    # auth
│       │   └── lib/           # jwt
│       ├── data/              # SQLite (dev), gitignored
│       └── ...
├── packages/
│   └── shared/            Tipos compartilhados (Bot, LogEntry, AuthCredentials…)
├── scripts/               RPAs em Python
│   ├── .venv/             Python 3.12.10 isolado
│   ├── core/              Módulo compartilhado (openport_client, logger, models)
│   ├── openport-relatorio/main.py
│   ├── movimentacao-diaria/main.py
│   ├── fechamento-tos/main.py
│   ├── manifesto-carga/main.py
│   ├── consolidacao-atracacao/main.py
│   └── boletim-diretoria/main.py
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
- **Por quê:** Python é necessário para bibliotecas de IA/LLM (langchain, crewai, openai) no futuro. Começar com child_process é mais simples e evolui naturalmente para microserviço.

### Comunicação em tempo real
- SSE (Server-Sent Events) em vez de WebSocket. Mais simples, unidirecional (backend → frontend), nativo no HTTP, suficiente para logs de execução.

### Autenticação
- JWT stateless. Backend autentica no OpenPort, devolve um JWT com a session token. Frontend armazena no localStorage e envia em todas as requisições.

### Assets
- Logo CODEBA salvo como PNG em `apps/frontend/public/codeba-logo.png` (16KB).
- Referenciado via `/codeba-logo.png` no `<img>` do header — sem base64 inline, mais leve e manutenível.
- Container `bg-white rounded-lg px-2.5 py-2` com `h-9` (36px) para exibir o logo completo (AUTORIDADE PORTUÁRIA + CODEBA).

### Banco de Dados
- **SQLite** em desenvolvimento (`data/torre-rpa.db`), **PostgreSQL** em produção.
- Drizzle ORM com schema type-safe. Tabelas: `bots`, `executions`, `logs`.
- Auto-init na inicialização do servidor: cria tabelas + seed com 6 bots.
- Migrações futuras via `drizzle-kit generate` + `drizzle-kit migrate`.
- Persistência de execuções e logs em tempo real (cada log do Python é salvo no banco).

### Monorepo npm workspaces
- `packages/shared` — tipos TypeScript compartilhados entre frontend e backend
- `apps/frontend` e `apps/backend` — cada um com seu `package.json` e `tsconfig.json`

## API REST

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/openport` | Não | Autentica no OpenPort, retorna JWT |
| `GET` | `/api/health` | Não | Health check |
| `GET` | `/api/bots` | Não | Lista automações (público) |
| `GET` | `/api/bots/:id` | Bearer JWT | Detalhes de um bot |
| `POST` | `/api/bots/:id/execute` | Bearer JWT | Dispara execução |
| `GET` | `/api/bots/:id/stream` | Bearer JWT | SSE — logs ao vivo |

## Fluxo de Execução

1. Usuário clica "Executar" no bot
2. Modal pede login/senha do OpenPort
3. `POST /api/auth/openport` — retorna JWT
4. `GET /api/bots/:id/stream` — backend cria registro de execução no banco e spawna `python scripts/<bot>/main.py`
5. Python emite `{"level":"info","message":"..."}` no stdout
6. Node.js captura cada linha, persiste no banco e envia como `data: {…}\n\n` via SSE
7. LogDrawer no frontend renderiza cada entrada em tempo real
8. Ao final, Python encerra com `emit_log("success", "✓ Rotina concluída")`
9. Node.js emite `event: done` e fecha a conexão

## Convenções de Código

- **Tamanho máximo de arquivo:** ~300 linhas. Arquivos maiores devem ser refatorados. Revisado em code review.
- **TypeScript strict mode** habilitado em toda a codebase.
- **Biome** para formatação e lint — sem ESLint ou Prettier.
- **Importação:** módulos npm primeiro, depois internos, ordenados alfabeticamente.
- **Componentes:** funções puras, sem classes. Props explicitamente tipadas com interface.
- **Commits:** mensagens concisas em português, um commit por funcionalidade.

## Como Rodar

```bash
# Desenvolvimento
npm run dev:backend   # Fastify :3001
npm run dev:frontend  # Vite :5173 (proxy /api → :3001)

# Build produção
npm run build
docker compose -f docker/docker-compose.yml up
```

## Python

```bash
scripts/.venv/Scripts/pip install -r scripts/requirements.txt
scripts/.venv/Scripts/python scripts/<bot>/main.py --bot-id x --openport-token y
```

## Próximos Passos (projetados)

1. **Histórico** — Página de histórico de execuções com filtros (dados já estão no banco)
2. **Integração OpenPort real** — Substituir mock `openport.ts` e `openport_client.py` por chamadas reais
3. **Migrar SQLite → PostgreSQL** — Trocar driver Drizzle e rodar migrations
4. **Agentes de IA** — Evoluir scripts Python para agentes com langchain/crewai
5. **Microserviço Python** — Extrair `scripts/` para FastAPI independente
