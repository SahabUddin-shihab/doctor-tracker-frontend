import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Brand } from '@/components/layout/brand';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Brand href="/login" />
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-pop sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">Sign in to your workspace</h1>
          <p className="mt-1.5 mb-6 text-sm text-muted-foreground">Administrator access only. Use the account issued to you.</p>
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Accounts are created by a system administrator. There is no public sign-up.
        </p>
      </div>
    </main>
  );
}
