'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { fetchMe, login as loginRequest, logout as logoutRequest } from '@/features/auth/api';
import { getErrorStatus, setSessionExpiredHandler } from '@/lib/api/client';
import { queryKeys } from '@/lib/query-keys';
import type { LoginValues } from '@/lib/validations/auth';
import type { Admin } from '@/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthContextValue {
  admin: Admin | null;
  status: AuthStatus;
  login: (values: LoginValues) => Promise<Admin>;
  logout: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const me = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (admin) => client.setQueryData(queryKeys.auth.me, admin),
  });

  const endSession = useCallback(() => {
    client.clear(); // never leave one administrator's cached data in memory after sign-out
    client.setQueryData(queryKeys.auth.me, null);
  }, [client]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      endSession();
      router.replace('/login');
    }
  }, [endSession, router]);

  // The axios interceptor calls this when a token refresh is definitively rejected.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      // "Expired" only makes sense if this tab had a signed-in admin. On first load, or after an
      // intentional sign-out, there was no session to expire: the route guard sends a plain redirect.
      if (!client.getQueryData(queryKeys.auth.me)) return;
      endSession();
      router.replace(`/login?reason=expired&next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    });
    return () => setSessionExpiredHandler(null);
  }, [client, endSession, router]);

  const status: AuthStatus = useMemo(() => {
    if (me.isPending) return 'loading';
    if (me.data) return 'authenticated';
    if (me.isError && getErrorStatus(me.error) !== 401) return 'error'; // network/server problem, not "signed out"
    return 'unauthenticated';
  }, [me.isPending, me.data, me.isError, me.error]);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin: me.data ?? null,
      status,
      login: loginMutation.mutateAsync,
      logout,
      retry: () => void me.refetch(),
    }),
    [me, status, loginMutation.mutateAsync, logout],
  );

  // keep pathname referenced so consumers re-render on navigation if they need to
  void pathname;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
