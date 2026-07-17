import type { AuthCredentials, Bot } from '@torre-rpa/shared';
import { AuthModal } from '../../components/auth/auth-modal';
import { BotList } from '../../components/dashboard/bot-list';
import { LogDrawer } from '../../components/log/log-drawer';
import { useBots } from '../../hooks/use-bots';
import { useExecutionStream } from '../../hooks/use-execution';
import { useUIStore } from '../../stores/ui-store';

export function Dashboard() {
  const { data: bots, isLoading } = useBots();
  const { startStream } = useExecutionStream();
  const { openModal } = useUIStore();

  // Sempre abrir modal — cada execução requer identificação do operador
  const handleExecute = (bot: Bot) => {
    openModal(bot);
  };

  const handleAuthSuccess = (credentials: AuthCredentials, token: string) => {
    const bot = useUIStore.getState().selectedBot;
    if (!bot) return;
    startStream(bot.id, bot.name, credentials, token);
  };

  return (
    <>
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h2 className="font-display text-[22px] font-bold">Automações disponíveis</h2>
          <p className="font-mono text-[12px] text-muted mt-1 tracking-wide">
            SELECIONE UMA ROTINA PARA AUTENTICAR E EXECUTAR
          </p>
        </div>
        <div className="font-mono text-[12px] text-muted-2">{bots?.length ?? '—'} ROTINAS</div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 font-mono text-muted">Carregando automações…</div>
      ) : (
        <BotList bots={bots ?? []} onExecute={handleExecute} />
      )}

      <AuthModal onSuccess={handleAuthSuccess} />
      <LogDrawer />
    </>
  );
}
