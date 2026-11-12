'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn, initials } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { Brand } from './brand';
import { NAV_ITEMS } from './nav-items';

/** Shared by the fixed desktop sidebar and the mobile drawer. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      toast.success('Signed out');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Brand />
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {active ? <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden /> : null}
              <item.icon className="size-[1.15rem]" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
          >
            {initials(admin?.email ?? '')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" title={admin?.email}>
              {admin?.email ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button variant="ghost" className="mt-1 w-full justify-start text-muted-foreground" onClick={signOut} loading={signingOut}>
          {!signingOut ? <LogOut /> : null}
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">
      <SidebarContent />
    </aside>
  );
}
