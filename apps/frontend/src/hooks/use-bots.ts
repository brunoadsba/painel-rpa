import { useQuery } from '@tanstack/react-query';
import { fetchBots } from '../services/bots';

export function useBots() {
  return useQuery({
    queryKey: ['bots'],
    queryFn: fetchBots,
    refetchInterval: (query) =>
      query.state.data?.some((b) => b.status === 'running') ? 2000 : false,
  });
}
