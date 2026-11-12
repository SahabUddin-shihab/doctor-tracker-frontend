'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cn } from '@/lib/utils';

const ALL = '__all__'; // Radix Select forbids an empty-string item value

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  allLabel: string;
  disabled?: boolean;
}

export function FilterSelect({ id, label, value, onChange, options, allLabel, disabled }: FilterSelectProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value || ALL} onValueChange={(next) => onChange(next === ALL ? '' : next)} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface DateRangeFilterProps {
  idPrefix: string;
  from: string;
  to: string;
  onChange: (patch: { createdFrom?: string; createdTo?: string }) => void;
}

export function DateRangeFilter({ idPrefix, from, to, onChange }: DateRangeFilterProps) {
  const invalid = Boolean(from && to && from > to);
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-from`}>Created from</Label>
        <Input id={`${idPrefix}-from`} type="date" value={from} max={to || undefined} onChange={(e) => onChange({ createdFrom: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-to`}>Created to</Label>
        <Input
          id={`${idPrefix}-to`}
          type="date"
          value={to}
          min={from || undefined}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange({ createdTo: e.target.value })}
        />
      </div>
    </>
  );
}

interface DebouncedInputProps {
  id: string;
  label: string;
  value: string;
  onCommit: (value: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
  min?: number;
  max?: number;
}

/** Text/number input that commits to the URL (and therefore the API) only after the user pauses typing. */
export function DebouncedInput({ id, label, value, onCommit, type = 'text', placeholder, min, max }: DebouncedInputProps) {
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text, 500);
  const committed = useRef(value);

  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    if (debounced !== committed.current) {
      committed.current = debounced;
      onCommit(debounced);
    }
  }, [debounced, onCommit]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} inputMode={type === 'number' ? 'numeric' : undefined} value={text} placeholder={placeholder} min={min} max={max} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}

interface FilterToggleProps {
  open: boolean;
  onToggle: () => void;
  activeCount: number;
  controlsId: string;
}

export function FilterToggle({ open, onToggle, activeCount, controlsId }: FilterToggleProps) {
  return (
    <Button variant="outline" onClick={onToggle} aria-expanded={open} aria-controls={controlsId} className="shrink-0">
      <SlidersHorizontal />
      Filters
      {activeCount > 0 ? (
        <span className="tabular flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {activeCount}
        </span>
      ) : null}
    </Button>
  );
}

interface FilterPanelProps {
  id: string;
  open: boolean;
  activeCount: number;
  onClear: () => void;
  children: React.ReactNode;
  className?: string;
}

export function FilterPanel({ id, open, activeCount, onClear, children, className }: FilterPanelProps) {
  if (!open) return null;
  return (
    <div id={id} className="border-b bg-muted/30 px-4 py-4">
      <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>{children}</div>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClear} disabled={activeCount === 0}>
          <X /> Clear all filters
        </Button>
      </div>
    </div>
  );
}
