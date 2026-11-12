'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaginationMeta } from '@/types';

export const PAGE_SIZES = [10, 20, 50] as const;

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  itemLabel?: string;
}

export function Pagination({ meta, onPageChange, onLimitChange, itemLabel = 'records' }: PaginationProps) {
  const { page, limit, total, totalPages } = meta;
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="tabular text-muted-foreground" aria-live="polite">
        {total === 0 ? (
          `No ${itemLabel}`
        ) : (
          <>
            Showing <span className="font-medium text-foreground">{first}–{last}</span> of{' '}
            <span className="font-medium text-foreground">{total}</span> {itemLabel}
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground" id="page-size-label">
            Rows per page
          </span>
          <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
            <SelectTrigger className="h-9 w-[4.5rem]" aria-labelledby="page-size-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="tabular text-muted-foreground">
            Page {totalPages === 0 ? 0 : page} of {totalPages}
          </span>
          <Button variant="outline" size="icon" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </nav>
  );
}
