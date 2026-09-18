# Plano de Implementação — Frontend UX/UI Clean (Hub)

Branch: `feat/hub-ux-clean` | Stack: React 19 + Vite + Tailwind 3 + TanStack Query + Zustand. Sem mudar API/backend.

## Objetivo
Transformar o console dark atual em Hub clean estilo Linear/Vercel: scan rápido de RPAs, execução 1-clique, logs como timeline, responsivo e acessível.

## Fase 1 — Fundação visual (0.5 dia)
- `tailwind.config.js`: adicionar superfícies (`surface`, `border-subtle`), radius 16, sombras suaves; manter navy/teal.
- `styles/globals.css`: foco visível (`:focus-visible ring`), scrollbar discreta, `tabular-nums` para relógio/timestamps, reduzir uppercase (só labels 10px).
- `components/ui/`: estender `button.tsx` (primary/subtle, loading spinner), `badge.tsx` (pill com dot), novo `skeleton.tsx`, `empty-state.tsx`, `search-input.tsx`.
- DoD: `lint + typecheck` verdes, nenhum pixel quebrado no dashboard atual.

## Fase 2 — Catálogo em cards + busca (1 dia)
- Novo `components/dashboard/bot-card.tsx` (extrair de `bot-row.tsx`): ícone, nome, descrição 2 linhas (line-clamp), pill status, última execução relativa, botão Executar 40px.
- `bot-list.tsx`: trocar grid fixa por `grid repeat(auto-fill,minmax(300px,1fr)) gap-4`; manter `BotRow` como fallback removível após QA.
- `dashboard.tsx`: search (nome/descrição) + filtro status (todos/idle/running/done/error) via `useMemo` sobre `useBots()`; skeleton cards no `isLoading`; empty-state (“Nenhuma automação encontrada”); contador real.
- `header.tsx`: remover `animate-sweep`, badge vira dot + texto, relógio `tabular-nums`.
- DoD: com 1 bot e com 12 bots mockados o grid escaneia bem em 1280px e 390px.

## Fase 3 — Execução como timeline (1 dia)
- `log-drawer.tsx`: widen 480px, altura 60vh, header com `job_id` curto + elapsed + status + botões cancelar/fechar (`aria-label`); lista com `aria-live=polite`; auto-scroll só se usuário está no fim ( IntersectionObserver no `bottomRef` ); botão “copiar logs”.
- `hooks/use-execution.ts`: expor `elapsedMs`, `isAtBottom` opcional; cancelar mata stream (backend já mata filho no disconnect).
- `auth-modal.tsx`: foco automático no login, Enter envia, erro inline, desabilita duplo submit.
- DoD: executar → ver timeline crescendo, fechar drawer não mata execução, reabrir mostra histórico da sessão.

## Fase 4 — Histórico (pós, ligado ao hub-roadmap Fase C)
- Nova rota `/historico` + `hooks/use-executions.ts` (quando API existir); tabela com filtros bot/status/período + download artefato.
- DoD fora deste plano (requer API); deixar rota com empty-state preparada.

## Anti-escopo
Sem mudar `executor.ts`, rotas, JWT, SSE, Python, Docker. Sem novas deps pesadas (só `clsx` se já não houver — senão template string). Sem commit parcial quebrado.

## QA
1. `npm run lint:check`, `npm run typecheck -w apps/frontend`, `npm run build -w apps/frontend`.
2. Manual: 1280px + 390px, teclado só (Tab/Enter/Escape), `prefers-reduced-motion`, contraste texto secundário ≥4.5:1.
3. Mock: 0 bots, 1 bot running, erro de rede na lista.

## Ordem
Fase 1 → 2 → 3. Fase 4 só após API de histórico.
