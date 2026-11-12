import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value: string | Date): string {
  return dateFormat.format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormat.format(new Date(value));
}

export function formatRelative(value: string | Date, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - new Date(value).getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['minute', 60],
    ['hour', 3600],
    ['day', 86_400],
    ['week', 604_800],
    ['month', 2_592_000],
  ];
  let unit: Intl.RelativeTimeFormatUnit = 'minute';
  let size = 60;
  for (const [name, span] of units) {
    if (seconds >= span) {
      unit = name;
      size = span;
    }
  }
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-Math.round(seconds / size), unit);
}

export function initials(value: string): string {
  const parts = value
    .replace(/^dr\.?\s+/i, '')
    .split(/[\s@._-]+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

export const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

/** "2026-05-04" -> a short label for chart axes. Parsed as a calendar date, never shifted by timezone. */
export function formatBucketLabel(key: string, period: 'daily' | 'weekly' | 'monthly'): string {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  const opts: Intl.DateTimeFormatOptions =
    period === 'monthly' ? { month: 'short', year: '2-digit', timeZone: 'UTC' } : { day: 'numeric', month: 'short', timeZone: 'UTC' };
  return new Intl.DateTimeFormat('en-GB', opts).format(date);
}
