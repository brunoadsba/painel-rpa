import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { executeBot as executeBotApi, fetchBots } from '../services/bots';

export function useBots() {
  return useQuery({
    queryKey: ['bots'],
    queryFn: fetchBots,
  });
}

export function useExecuteBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: executeBotApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });
}
