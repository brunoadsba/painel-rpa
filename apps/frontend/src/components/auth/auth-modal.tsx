import type { Bot } from '@torre-rpa/shared';
import { useState } from 'react';
import { authenticate } from '../../services/auth';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';

interface AuthModalProps {
  onSuccess: () => void;
}

export function AuthModal({ onSuccess }: AuthModalProps) {
  const { isModalOpen, selectedBot, closeModal } = useUIStore();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!selectedBot) return null;

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authenticate({ username, password });
      setAuth(res.token, res.expiresAt);
      closeModal();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isModalOpen} onClose={closeModal}>
      <div className="font-mono text-[10px] tracking-widest text-amber uppercase mb-2">
        Autenticação OpenPort
      </div>
      <h3 className="font-display text-lg mb-1">Executar: {selectedBot.name}</h3>
      <p className="font-body text-[12.5px] text-muted mb-5">
        Informe as credenciais compartilhadas do OpenPort para disparar esta automação.
      </p>

      {error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 mb-3 text-red-400 font-mono text-xs">
          {error}
        </div>
      )}

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
        <Button variant="secondary" className="flex-1" onClick={closeModal}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          className="flex-[1.4]"
          onClick={handleSubmit}
          disabled={loading || !username || !password}
        >
          {loading ? 'Autenticando…' : 'Autenticar e Executar'}
        </Button>
      </div>
    </Modal>
  );
}
