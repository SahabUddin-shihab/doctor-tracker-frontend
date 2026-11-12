'use client';

import { ChevronDown, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { initials } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { SidebarContent } from './sidebar';

const todayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export function Header() {
  const { admin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/70 sm:px-6">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
          <SidebarContent onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <p className="hidden text-sm text-muted-foreground sm:block" suppressHydrationWarning>
        {todayFormat.format(new Date())}
      </p>

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2" aria-label="Account menu">
              <span
                aria-hidden
                className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              >
                {initials(admin?.email ?? '')}
              </span>
              <span className="hidden max-w-40 truncate text-sm sm:block">{admin?.email}</span>
              <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              Signed in as
              <span className="block truncate text-sm font-medium text-foreground">{admin?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                await logout();
                toast.success('Signed out');
              }}
            >
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
