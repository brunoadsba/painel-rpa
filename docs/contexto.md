# Contexto — Torre RPA

Este arquivo documenta o ecossistema para que outro modelo de IA entenda o
projeto rapidamente e consiga contribuir sem precisar ler todo o código.

---

## 1. O que é

**Torre RPA** é um painel web que centraliza automações (RPAs) do Porto de
Ilhéus. Cada automação é um script Python que o painel dispara com 1 clique,
exibe logs em tempo real e salva histórico.

## 2. Estrutura do monorepo

```
Painel RPA/
├── apps/
│   ├── frontend/          React 19 + Vite + TS + Tailwind
│   └── backend/           Fastify + Drizzle + SQLite
├── packages/
│   └── shared/            Tipos TypeScript (Bot, LogEntry, Execution)
├── scripts/               RPAs em Python
│   ├── core/              Código compartilhado (logger, models)
│   ├── paralisacao/       ✅ Único RPA real (Playwright)
│   ├── openport-relatorio/  ⏳ Mock (time.sleep + emit_log)
│   ├── movimentacao-diaria/ ⏳ Mock
│   ├── fechamento-tos/      ⏳ Mock
│   ├── manifesto-carga/     ⏳ Mock
│   ├── consolidacao-atracacao/ ⏳ Mock
│   └── boletim-diretoria/   ⏳ Mock
├── docker/
├── docs/
├── .env.example
└── package.json
```

## 3. Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19, Vite 6, TypeScript 5.7, Tailwind 3 |
| Estado servidor | TanStack React Query 5 |
| Estado UI | Zustand 5 |
| Roteamento | React Router 7 |
| Backend | Fastify 5, TypeScript, Drizzle ORM |
| Banco | SQLite (dev), PostgreSQL (prod) |
| Validação | Zod 3 |
| RPAs | Python 3.12.10, Playwright, httpx, loguru |
| Lint/Format | Biome 1.9 |
| Container | Docker + Docker Compose |

## 4. Como os RPAs funcionam

```
Frontend → API → Backend Node.js → spawn() → Python script
                                                ↓
                                           stdout JSON lines
                                                ↓
                                          Backend lê linha a linha
                                                ↓
                                    Persiste no SQLite + envia SSE
                                                ↓
                                          Frontend renderiza logs
```

### 4.1. Padrão de script Python

```python
import argparse
from core.logger import emit_log

parser = argparse.ArgumentParser()
parser.add_argument("--bot-id", required=True)
parser.add_argument("--openport-token", required=True)
args = parser.parse_args()

emit_log("info", "mensagem", args.bot_id)
```

### 4.2. Entry point alternativo (paralisacao)

O RPA de paralisação é complexo (14 módulos, Playwright). Em vez de um
`main.py` simples, ele usa um entry point adaptado:

```python
# scripts/paralisacao/run.py
# - Parseia --bot-id e --openport-token
# - Configura logging JSON para stdout (SSE)
# - Força HEADLESS=true para execução via backend
# - Define PARALISACAO_ROOT para resolver paths
# - Delega para executar() em src/paralisacao/main.py
```

## 5. RPA de Paralisação (o único real)

### 5.1. O que faz

Lê uma planilha Excel (.xlsx) com paralisações de navio, abre o sistema
OpenPort CODEBA via Playwright, busca ou cria a capa correta e registra cada
paralisação (motivo, horário, observações) com checagem anti-duplicata.

### 5.2. Estrutura

```
scripts/paralisacao/
├── run.py                    Entry point (chamado pelo backend)
├── pyproject.toml            Tool config (ruff, pytest, coverage)
├── .env.example              Template de variáveis
├── src/paralisacao/          Código fonte (14 módulos)
│   ├── main.py               Orquestrador da automação
│   ├── config.py             Dataclass Config + seletores CSS
│   ├── planilha.py           Leitura e validação do .xlsx
│   ├── mapeamento.py         Tradução motivos/turnos
│   ├── navegacao.py          Login e navegação no OpenPort
│   ├── capa.py               Busca e criação de capas
│   ├── popup.py              Preenchimento do modal de paralisação
│   ├── status.py             Cache local anti-duplicata
│   ├── retry.py              Decorator @com_retry
│   ├── relatorio.py          Geração de relatórios Markdown
│   ├── browser.py            Helpers do Playwright
│   └── exceptions.py         Exceções customizadas
├── tests/                    30 testes (pytest, 83% coverage)
├── data/                     Planilha, lookup de motivos
└── docs/                     Guia operacional
```

### 5.3. Pontos de atenção

- Usa **Playwright** — depende de `playwright install chromium`
- `config.py` resolve `project_root` via env var `PARALISACAO_ROOT`
- O logging Python padrão (`logger.info/warning/error`) é capturado por um
  `JsonLogHandler` e enviado como JSON lines no stdout para o backend
- `run.py` força `HEADLESS=true` e `PRIMEIRO_PLANO=false` — mas o `.env`
  local pode sobrescrever para depuração visual

## 6. Banco de Dados

3 tabelas em `apps/backend/src/db/schema.ts`:

| Tabela | Função |
|--------|--------|
| `bots` | Catálogo de automações (id, name, scriptPath, status, lastRun) |
| `executions` | Histórico de execuções (botId, status, timestamps, triggeredBy) |
| `logs` | Logs em tempo real (executionId, level, message, timestamp) |

O banco é inicializado automaticamente com seed de 7 bots (6 mocks + paralisação).

**Seed:** `apps/backend/src/db/index.ts` → `SEED_BOTS` array.

## 7. Para adicionar um novo RPA

### 7.1. Script Python

1. Criar `scripts/novo-rpa/run.py` seguindo o padrão:
   - Parsear `--bot-id` e `--openport-token`
   - Usar `from core.logger import emit_log`
   - Chamar `emit_log("info", msg, execution_id)` para cada passo
   - Sair com `sys.exit(0)` em sucesso, `sys.exit(1)` em erro

2. Adicionar dependências em `scripts/requirements.txt`

### 7.2. Registrar no banco

Adicionar entrada no array `SEED_BOTS` em `apps/backend/src/db/index.ts`:

```typescript
{
  id: 'novo-rpa',
  name: 'Novo RPA',
  description: 'Descrição do que faz',
  status: 'idle' as const,
  lastRun: null,
  scriptPath: 'novo-rpa/run.py',
}
```

### 7.3. Frontend

O bot aparece automaticamente via `GET /api/bots`.

## 8. Dependências

```bash
# Node.js (npm mirror necessário nesta máquina)
npm install --registry https://registry.npmmirror.com

# Python
pip install -r scripts/requirements.txt
playwright install chromium   # necessário para o RPA de paralisação
```

## 9. Ambiente de desenvolvimento

```bash
# Terminal 1 — Backend (:3001)
npm run dev:backend

# Terminal 2 — Frontend (:5173)
npm run dev:frontend

# Testes do RPA de paralisação
cd scripts/paralisacao
$env:PYTHONPATH="src"; pytest

# Lint
npm run lint
```

## 10. Convenções

- Commits em português
- ~300 linhas máximo por arquivo
- Biome para lint/format (sem ESLint/Prettier)
- TypeScript strict mode
- Componentes React: função pura, props com interface

## 11. Arquivos de referência

| Arquivo | Conteúdo |
|---------|----------|
| `painel.md` | Documentação completa do monorepo (~490 linhas) |
| `docs/memory.md` | Memória técnica do projeto |
| `docs/guia-operacional.md` | Guia do RPA de paralisação (dentro de `scripts/paralisacao/docs/`) |
| `scripts/paralisacao/run.py` | Entry point da paralisação para o backend |
| `apps/backend/src/services/executor.ts` | Lógica de spawn do Python |
| `apps/backend/src/db/index.ts` | Schema + seed do banco |
| `packages/shared/src/types.ts` | Tipos TypeScript compartilhados |
| `scripts/core/logger.py` | Logger Python (emit_log → JSON stdout) |
