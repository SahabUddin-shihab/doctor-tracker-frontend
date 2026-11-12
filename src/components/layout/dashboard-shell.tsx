import type { ReactNode } from 'react';
import { AuthGuard } from './auth-guard';
import { Header } from './header';
import { Sidebar } from './sidebar';

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
