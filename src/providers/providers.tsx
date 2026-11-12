'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { getErrorStatus } from '@/lib/api/client';
import { AuthProvider } from './auth-provider';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        // Retry transient failures only; 4xx responses will not get better by asking again.
        retry: (failureCount, error) => {
          const status = getErrorStatus(error);
          return (status === undefined || status >= 500) && failureCount < 2;
        },
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster position="top-right" richColors closeButton toastOptions={{ classNames: { toast: 'font-sans' } }} />
    </QueryClientProvider>
  );
}
