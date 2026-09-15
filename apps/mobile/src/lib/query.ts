import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export const keys = {
  wallet: ['wallet'] as const,
  recent: ['recent'] as const,
  transactions: (f: unknown) => ['transactions', f] as const,
  transaction: (id: string) => ['transaction', id] as const,
  profile: ['profile'] as const,
  bankAccounts: ['bankAccounts'] as const,
  notices: ['notices'] as const,
  faqs: ['faqs'] as const,
  terms: ['terms'] as const,
  merchants: ['merchants'] as const,
};

/** 돈이 움직인 뒤 한 번에 갱신할 것들 */
export function invalidateMoney() {
  queryClient.invalidateQueries({ queryKey: keys.wallet });
  queryClient.invalidateQueries({ queryKey: keys.recent });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['transaction'] });
}
