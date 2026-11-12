import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
  loading?: boolean;
}

export function StatCard({ label, value, hint, icon: Icon, loading }: StatCardProps) {
  return (
    <Card className="flex items-start gap-4 p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading ? (
          <>
            <Skeleton className="mt-2 h-7 w-16" />
            <Skeleton className="mt-2 h-3.5 w-28" />
          </>
        ) : (
          <>
            <p className="tabular mt-1 text-2xl leading-none font-semibold tracking-tight">{value}</p>
            {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
          </>
        )}
      </div>
    </Card>
  );
}
