import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const CHART_COLORS = {
  patients: 'var(--chart-1)',
  doctors: 'var(--chart-2)',
  grid: 'var(--chart-grid)',
  axis: 'var(--muted-foreground)',
  other: 'var(--chart-other)',
  categorical: ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)'],
} as const;

export const AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 12 } as const;

interface ChartCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, actions, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface TooltipRow {
  label: string;
  value: number | string;
  color?: string;
}

/** Shared hover card so every chart's tooltip looks and reads the same. */
export function TooltipCard({ title, rows }: { title?: string; rows: TooltipRow[] }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-pop">
      {title ? <p className="mb-1 font-medium text-foreground">{title}</p> : null}
      <ul className="space-y-0.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-muted-foreground">
            {row.color ? <span className="size-2 rounded-full" style={{ background: row.color }} aria-hidden /> : null}
            <span>{row.label}</span>
            <span className="tabular ml-auto pl-4 font-medium text-foreground">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Accessible alternative to the graphic: the same numbers as a table, one click away. */
export function ChartDataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <details className="group mt-3 text-sm">
      <summary className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1 py-0.5 text-xs text-muted-foreground select-none hover:text-foreground">
        View data as a table
      </summary>
      <div className="mt-2 max-h-56 overflow-auto rounded-lg border">
        <table className="w-full text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-muted text-left text-muted-foreground">
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="px-3 py-1.5 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={cellIndex === 0 ? 'px-3 py-1.5' : 'tabular px-3 py-1.5'}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
