'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/shared/states';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <ErrorState title="This page hit an unexpected error" error={error} onRetry={reset} />
    </main>
  );
}


