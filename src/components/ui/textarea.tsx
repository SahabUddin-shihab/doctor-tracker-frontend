import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-20 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-card transition-colors',
        'placeholder:text-muted-foreground/80',
        'focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-ring/40 focus-visible:outline-offset-0',
        'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60',
        'aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive/30',
        className,
      )}
      {...props}
    />
  );
}
