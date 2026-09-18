import type { AuthCredentials, Bot, BotStatus } from '@torre-rpa/shared';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthModal } from '../../components/auth/auth-modal';
import { BotList } from '../../components/dashboard/bot-list';
import { LogDrawer } from '../../components/log/log-drawer';
import { EmptyState } from '../../components/ui/empty-state';
import { SearchInput } from '../../components/ui/search-input';
import { CardSkeleton } from '../../components/ui/skeleton';
import { useBots } from '../../hooks/use-bots';
import { useExecutionStream } from '../../hooks/use-execution';
import { useUIStore } from '../../stores/ui-store';

export function Dashboard() {
  const { data: bots, isLoading, isError, refetch } = useBots();
  const { startStream } = useExecutionStream();
  const { openModal } = useUIStore();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BotStatus>('all');

  // Sempre abrir modal — cada execução requer identificação do operador
  const handleExecute = (bot: Bot) => {
    openModal(bot);
  };

  const handleAuthSuccess = (credentials: AuthCredentials, token: string) => {
    const bot = useUIStore.getState().selectedBot;
    if (!bot) return;
    startStream(bot.id, bot.name, credentials, token);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (bots ?? []).filter((bot) => {
      if (statusFilter !== 'all' && bot.status !== statusFilter) return false;
      if (!q) return true;
      return bot.name.toLowerCase().includes(q) || bot.description.toLowerCase().includes(q);
    });
  }, [bots, query, statusFilter]);

  const filters: Array<{ id: 'all' | BotStatus; label: string }> = [
    { id: 'all', label: 'Todas' },
    { id: 'idle', label: 'Prontas' },
    { id: 'running', label: 'Executando' },
    { id: 'done', label: 'Concluídas' },
    { id: 'error', label: 'Falhas' },
  ];

  return (
    <>
      {(bots ?? []).some((b) => b.id === 'sev-intermaritima') && (
        <Link
          to="/sev"
          className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-teal/30 bg-gradient-to-r from-teal/15 to-transparent px-5 py-4 transition-colors hover:border-teal/50"
        >
          <div>
            <p className="font-body text-[11px] font-bold tracking-widest text-teal-light">
              ★ CARRO-CHEFE
            </p>
            <p className="font-display text-[16px] font-bold text-white">
              SEV Intermarítima — ver produto, versões e manual
            </p>
          </div>
          <span aria-hidden="true" className="text-xl text-teal-light">
            →
          </span>
        </Link>
      )}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[22px] font-bold text-white">Automações</h2>
          <p className="mt-1 font-body text-[13px] text-muted">
            Selecione uma rotina para autenticar e executar
          </p>
        </div>
        <div className="tabular font-body text-[12px] text-muted-2">
          {filtered.length} de {bots?.length ?? 0} rotinas
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-xs sm:flex-1"
        />
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Filtrar por status</legend>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              aria-pressed={statusFilter === f.id}
              className={`rounded-full border px-3 py-1.5 font-body text-[12px] font-semibold transition-colors ${
                statusFilter === f.id
                  ? 'border-teal/50 bg-teal/15 text-teal-light'
                  : 'border-white/10 bg-white/[0.03] text-muted hover:border-white/20 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </fieldset>
      </div>

      {isLoading ? (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Falha ao carregar automações"
          description="Verifique se o backend está rodando e tente novamente."
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl bg-teal px-4 py-2.5 font-body text-sm font-semibold text-navy-950 hover:brightness-110"
            >
              Tentar novamente
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma automação encontrada"
          description="Ajuste a busca ou o filtro de status para ver mais rotinas."
        />
      ) : (
        <BotList bots={filtered} onExecute={handleExecute} />
      )}

      <AuthModal onSuccess={handleAuthSuccess} />
      <LogDrawer />
    </>
  );
}
