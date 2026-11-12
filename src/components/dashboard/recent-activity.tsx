'use client';

import { History, Pencil, Stethoscope, Trash2, UserMinus, UserPlus, type LucideIcon } from 'lucide-react';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentActivity } from '@/features/dashboard/api';
import { formatDateTime, formatRelative } from '@/lib/utils';
import type { ActivityItem } from '@/types';

const ICONS: Record<ActivityItem['type'], { icon: LucideIcon; tone: string }> = {
  'doctor.created': { icon: Stethoscope, tone: 'bg-accent text-accent-foreground' },
  'patient.created': { icon: UserPlus, tone: 'bg-accent text-accent-foreground' },
  'patient.updated': { icon: Pencil, tone: 'bg-secondary text-secondary-foreground' },
  'patient.unassigned': { icon: UserMinus, tone: 'bg-warning/10 text-warning' },
  'patient.deleted': { icon: Trash2, tone: 'bg-destructive/10 text-destructive' },
};

export function RecentActivity() {
  const { data, isPending, isError, error, refetch } = useRecentActivity();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest changes to doctors and patients</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState title="Could not load activity" error={error} onRetry={() => void refetch()} className="py-8" />
        ) : data.length === 0 ? (
          <EmptyState icon={History} title="No activity yet" description="Changes you make to doctors and patients will be listed here." className="py-8" />
        ) : (
          <ol className="space-y-4">
            {data.map((item) => {
              const { icon: Icon, tone } = ICONS[item.type];
              return (
                <li key={item.id} className="flex items-start gap-3">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tone}`} aria-hidden>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{item.summary}</p>
                    <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)} className="text-xs text-muted-foreground">
                      {formatRelative(item.createdAt)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
