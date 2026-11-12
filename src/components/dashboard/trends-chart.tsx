'use client';

import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ErrorState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrends } from '@/features/dashboard/api';
import { cn, formatBucketLabel } from '@/lib/utils';
import type { TrendPeriod } from '@/types';
import { AXIS_TICK, CHART_COLORS, ChartCard, ChartDataTable, TooltipCard } from './chart-parts';

const PERIODS: Array<{ value: TrendPeriod; label: string; unit: string }> = [
  { value: 'daily', label: 'Daily', unit: 'day' },
  { value: 'weekly', label: 'Weekly', unit: 'week starting' },
  { value: 'monthly', label: 'Monthly', unit: 'month' },
];

interface SeriesProps {
  title: string;
  total: number;
  dataKey: 'doctors' | 'patients';
  color: string;
  height: number;
  data: Array<{ date: string; doctors: number; patients: number }>;
  period: TrendPeriod;
  noun: string;
}

function SeriesChart({ title, total, dataKey, color, height, data, period, noun }: SeriesProps) {
  const unit = PERIODS.find((p) => p.value === period)?.unit ?? 'day';
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <span className="size-2.5 rounded-sm" style={{ background: color }} aria-hidden />
          {title}
        </h3>
        <p className="tabular text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{total}</span> in range
        </p>
      </div>
      <div role="img" aria-label={`${title} per ${period.replace('ly', '')}: ${total} in total`} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: -18 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="date"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              minTickGap={22}
              tickFormatter={(value: string) => formatBucketLabel(value, period)}
            />
            <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              cursor={{ fill: 'var(--muted)' }}
              content={({ active, payload }) => {
                const row = active ? payload?.[0]?.payload : undefined;
                if (!row) return null;
                return <TooltipCard title={`${unit === 'week starting' ? 'Week starting ' : ''}${formatBucketLabel(row.date, period)}`} rows={[{ label: noun, value: row[dataKey], color }]} />;
              }}
            />
            <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function TrendsChart() {
  const [period, setPeriod] = useState<TrendPeriod>('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const invalidRange = Boolean(from && to && from > to);

  const { data, isPending, isError, error, refetch, isFetching } = useTrends(period, invalidRange ? '' : from, invalidRange ? '' : to);

  return (
    <ChartCard
      title="Growth over time"
      description={data ? `New doctors and registered patients · ${formatBucketLabel(data.from, 'daily')} to ${formatBucketLabel(data.to, 'daily')} (${data.timezone})` : 'New doctors and registered patients'}
      actions={
        <div role="group" aria-label="Trend period" className="inline-flex shrink-0 rounded-lg border bg-muted/50 p-0.5">
          {PERIODS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={period === option.value}
              onClick={() => setPeriod(option.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                period === option.value ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="trend-from" className="text-xs">
            From
          </Label>
          <Input id="trend-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="trend-to" className="text-xs">
            To
          </Label>
          <Input id="trend-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" aria-invalid={invalidRange || undefined} />
        </div>
        {from || to ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFrom('');
              setTo('');
            }}
          >
            <RotateCcw /> Reset range
          </Button>
        ) : (
          <p className="pb-2 text-xs text-muted-foreground">Showing the most recent {period === 'daily' ? '30 days' : period === 'weekly' ? '12 weeks' : '12 months'}</p>
        )}
        {invalidRange ? (
          <p role="alert" className="pb-2 text-xs font-medium text-destructive">
            “From” must not be after “To”.
          </p>
        ) : null}
      </div>

      {isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-52 w-full" />
        </div>
      ) : isError ? (
        <ErrorState title="Could not load trends" error={error} onRetry={() => void refetch()} className="py-8" />
      ) : (
        <div className={cn('space-y-5 transition-opacity', isFetching && 'opacity-60')}>
          <SeriesChart title="Patients registered" noun="Patients" dataKey="patients" color={CHART_COLORS.patients} height={210} data={data.series} period={period} total={data.totals.patients} />
          <SeriesChart title="Doctors added" noun="Doctors" dataKey="doctors" color={CHART_COLORS.doctors} height={150} data={data.series} period={period} total={data.totals.doctors} />
          <ChartDataTable
            caption="Doctors and patients over time"
            headers={['Period starting', 'Patients', 'Doctors']}
            rows={data.series.map((p) => [formatBucketLabel(p.date, period), p.patients, p.doctors])}
          />
        </div>
      )}
    </ChartCard>
  );
}
