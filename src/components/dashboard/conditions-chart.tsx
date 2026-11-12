'use client';

import { Stethoscope } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Skeleton } from '@/components/ui/skeleton';
import { useConditionDistribution } from '@/features/dashboard/api';
import { CHART_COLORS, ChartCard, TooltipCard } from './chart-parts';

export default function ConditionsChart() {
  const { data, isPending, isError, error, refetch } = useConditionDistribution();
  const rows = (data?.data ?? []).map((row, index) => ({
    ...row,
    color: row.key === '__other' ? CHART_COLORS.other : CHART_COLORS.categorical[index % CHART_COLORS.categorical.length]!,
    percent: data && data.total > 0 ? Math.round((row.count / data.total) * 100) : 0,
  }));

  return (
    <ChartCard title="Medical conditions" description="Share of patients by condition">
      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState title="Could not load this chart" error={error} onRetry={() => void refetch()} className="py-8" />
      ) : rows.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No patients yet" description="Conditions will appear here once patients are registered." className="py-8" />
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row">
          <div
            role="img"
            aria-label={`Donut chart of patient conditions. ${rows.map((r) => `${r.condition}: ${r.count} (${r.percent}%)`).join('; ')}`}
            className="relative size-44 shrink-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rows} dataKey="count" nameKey="condition" innerRadius="64%" outerRadius="100%" paddingAngle={2} stroke="var(--card)" strokeWidth={2} startAngle={90} endAngle={-270}>
                  {rows.map((row) => (
                    <Cell key={row.key} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    const row = active ? payload?.[0]?.payload : undefined;
                    if (!row) return null;
                    return <TooltipCard title={row.condition} rows={[{ label: 'Patients', value: row.count, color: row.color }, { label: 'Share', value: `${row.percent}%` }]} />;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="tabular text-2xl leading-none font-semibold">{data?.total}</span>
              <span className="mt-1 text-xs text-muted-foreground">patients</span>
            </div>
          </div>

          {/* The legend doubles as the data table: every value is readable without colour or hover. */}
          <ul className="w-full min-w-0 flex-1 space-y-1.5 text-sm" aria-label="Condition breakdown">
            {rows.map((row) => (
              <li key={row.key} className="flex items-center gap-2.5">
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: row.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate" title={row.condition}>
                  {row.condition}
                </span>
                <span className="tabular text-muted-foreground">{row.percent}%</span>
                <span className="tabular w-8 text-right font-medium">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
