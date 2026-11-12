'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { ErrorState } from '@/components/shared/states';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';

/**
 * Client-side route guard: sends signed-out visitors to /login and remembers where they were going.
 * This is a UX convenience only. Every API route independently requires a valid session, so skipping or
 * tampering with this component exposes no data.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status, retry } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const next = encodeURIComponent(search ? `${pathname}?${search}` : pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [status, router, pathname, search]);

  if (status === 'error') {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <ErrorState title="Can’t reach the server" error={new Error('We could not verify your session. Check your connection and try again.')} onRetry={retry} />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-dvh" role="status" aria-label="Checking your session">
        <div className="hidden w-64 border-r bg-card p-5 lg:block">
          <Skeleton className="h-9 w-40" />
          <div className="mt-8 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-6 h-64 w-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
