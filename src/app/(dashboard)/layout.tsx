import { Suspense, type ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // AuthGuard reads the URL (useSearchParams), which requires a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
