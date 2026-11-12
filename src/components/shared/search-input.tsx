'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface SearchInputProps {
  /** The committed search term (from the URL). */
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  label: string;
  delayMs?: number;
}

/**
 * Debounced search box. Typing updates local state immediately (so the field feels instant)
 * but only commits to `onSearch` — and therefore to an API request — after the user pauses.
 */
export function SearchInput({ value, onSearch, placeholder = 'Search…', label, delayMs = 350 }: SearchInputProps) {
  const [text, setText] = useState(value);
  const debounced = useDebouncedValue(text, delayMs);
  const committed = useRef(value);

  // Reflect external changes (e.g. "Clear filters", back button) in the field.
  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    const next = debounced.trim();
    if (next !== committed.current) {
      committed.current = next;
      onSearch(next);
    }
  }, [debounced, onSearch]);

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        role="searchbox"
        aria-label={label}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={placeholder}
        maxLength={100}
        className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {text ? (
        <button
          type="button"
          onClick={() => setText('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
