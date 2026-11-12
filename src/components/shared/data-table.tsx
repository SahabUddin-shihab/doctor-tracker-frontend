'use client';

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Sort field understood by the API; makes the header a sort button. */
  sortKey?: string;
  /** Hide the column below this breakpoint (the mobile card view still shows everything). */
  showFrom?: 'lg' | 'xl';
  className?: string;
}

export interface SortState {
  by: string;
  order: 'asc' | 'desc';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Rendered instead of the table on screens narrower than `md`. */
  renderMobileCard: (row: T) => ReactNode;
  isLoading?: boolean;
  /** True while a background refetch (page change / filter change) is running. */
  isFetching?: boolean;
  skeletonRows?: number;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  label: string;
}

const showFromClass = { lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' } as const;

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  renderMobileCard,
  isLoading = false,
  isFetching = false,
  skeletonRows = 8,
  sort,
  onSortChange,
  label,
}: DataTableProps<T>) {
  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    onSortChange(sort?.by === key ? { by: key, order: sort.order === 'asc' ? 'desc' : 'asc' } : { by: key, order: 'asc' });
  };

  return (
    <div aria-busy={isLoading || isFetching} className={cn('transition-opacity', isFetching && !isLoading && 'opacity-60')}>
      {/* Desktop / tablet: a real table. */}
      <div className="hidden md:block">
        <Table aria-label={label}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((column) => {
                const sorted = sort?.by === column.sortKey;
                const SortIcon = !sorted ? ChevronsUpDown : sort?.order === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <TableHead
                    key={column.id}
                    aria-sort={sorted ? (sort?.order === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(column.showFrom && showFromClass[column.showFrom], column.className)}
                  >
                    {column.sortKey && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.sortKey!)}
                        className="-mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {column.header}
                        <SortIcon className={cn('size-3.5', !sorted && 'opacity-50')} aria-hidden />
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: skeletonRows }, (_, rowIndex) => (
                  <TableRow key={rowIndex} className="hover:bg-transparent">
                    {columns.map((column) => (
                      <TableCell key={column.id} className={cn(column.showFrom && showFromClass[column.showFrom])}>
                        <Skeleton className="h-4 w-full max-w-[9rem]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : rows.map((row) => (
                  <TableRow key={getRowId(row)}>
                    {columns.map((column) => (
                      <TableCell key={column.id} className={cn(column.showFrom && showFromClass[column.showFrom], column.className)}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: one card per record instead of a squeezed table. */}
      <ul className="divide-y md:hidden" aria-label={label}>
        {isLoading
          ? Array.from({ length: Math.min(skeletonRows, 5) }, (_, index) => (
              <li key={index} className="space-y-2.5 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3.5 w-3/4" />
              </li>
            ))
          : rows.map((row) => (
              <li key={getRowId(row)} className="p-4">
                {renderMobileCard(row)}
              </li>
            ))}
      </ul>
    </div>
  );
}
