import type { AuthCredentials } from '@torre-rpa/shared';
import { useState } from 'react';
import { authenticate } from '../../services/auth';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';

interface AuthModalProps {
  onSuccess: (credentials: AuthCredentials, token: string) => void;
}

export function AuthModal({ onSuccess }: AuthModalProps) {
  const { isModalOpen, selectedBot, closeModal } = useUIStore();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!selectedBot) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authenticate({ username, password });
      setAuth(res.token, res.expiresAt);
      const credentials: AuthCredentials = { username, password };
      const token = res.token;
      // Limpar senha do estado React imediatamente após capturar
      setPassword('');
      closeModal();
      onSuccess(credentials, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    closeModal();
  };

  return (
    <Modal open={isModalOpen} onClose={handleClose}>
      <p className="font-body text-[11px] font-semibold tracking-wide text-amber uppercase mb-2">
        Autenticação OpenPort
      </p>
      <h3 className="font-display text-lg text-white mb-1">Executar: {selectedBot.name}</h3>
      <p className="font-body text-[12.5px] text-muted mb-5">
        Informe as credenciais compartilhadas do OpenPort para disparar esta automação.
      </p>

      {error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 mb-3 text-red-400 font-mono text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input
          label="Usuário"
          type="text"
          placeholder="usuario.openport"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-2.5 mt-5">
          <Button variant="secondary" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="flex-[1.4]"
            type="submit"
            disabled={loading || !username || !password}
          >
            {loading ? 'Autenticando…' : 'Autenticar e Executar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
