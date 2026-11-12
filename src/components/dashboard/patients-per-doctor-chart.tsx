'use client';

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatientsPerDoctor } from '@/features/dashboard/api';
import { Users } from 'lucide-react';
import { AXIS_TICK, CHART_COLORS, ChartCard, ChartDataTable, TooltipCard } from './chart-parts';

const truncate = (value: string, max = 18) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

export default function PatientsPerDoctorChart() {
  const { data, isPending, isError, error, refetch } = usePatientsPerDoctor();
  const rows = data?.data ?? [];
  const height = Math.max(220, rows.length * 38 + 40);

  return (
    <ChartCard
      title="Patients per doctor"
      description={data && data.totalDoctors > data.shown ? `Top ${data.shown} of ${data.totalDoctors} doctors by patient count` : 'Number of patients assigned to each doctor'}
    >
      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState title="Could not load this chart" error={error} onRetry={() => void refetch()} className="py-8" />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No doctors yet" description="Add doctors and assign patients to see the distribution." className="py-8" />
      ) : (
        <>
          <div role="img" aria-label={`Bar chart of patients per doctor. ${rows.map((r) => `${r.name}: ${r.count}`).join('; ')}`} style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 0 }} barCategoryGap={8}>
                <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
                <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={128}
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: string) => truncate(value.replace(/^Dr\.?\s+/i, ''))}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)' }}
                  content={({ active, payload }) => {
                    const row = active ? payload?.[0]?.payload : undefined;
                    if (!row) return null;
                    return <TooltipCard title={row.name} rows={[{ label: row.specialization, value: '' }, { label: 'Patients', value: row.count, color: CHART_COLORS.patients }]} />;
                  }}
                />
                <Bar dataKey="count" fill={CHART_COLORS.patients} radius={[0, 4, 4, 0]} maxBarSize={22} minPointSize={2}>
                  <LabelList dataKey="count" position="right" className="tabular" style={{ fill: 'var(--foreground)', fontSize: 12 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartDataTable caption="Patients per doctor" headers={['Doctor', 'Specialization', 'Patients']} rows={rows.map((r) => [r.name, r.specialization, r.count])} />
        </>
      )}
    </ChartCard>
  );
}
