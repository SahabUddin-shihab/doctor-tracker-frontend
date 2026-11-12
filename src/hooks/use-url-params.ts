'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

type ParamValue = string | number | null | undefined;

/**
 * Keeps list state (search, filters, sort, page) in the URL query string.
 * That makes filters survive pagination, reloads and the back button, and lets a view be shared as a link.
 * Any change other than `page` itself resets the page to 1.
 */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serialized = searchParams.toString();

  const params = useMemo(() => Object.fromEntries(new URLSearchParams(serialized)) as Record<string, string>, [serialized]);

  const update = useCallback(
    (patch: Record<string, ParamValue>) => {
      const next = new URLSearchParams(serialized);
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === '') next.delete(key);
        else next.set(key, String(value));
      }
      if (!('page' in patch)) next.delete('page');
      const query = next.toString();
      if (query === serialized) return;
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, serialized],
  );

  const clear = useCallback(
    (keys: string[]) => update(Object.fromEntries(keys.map((key) => [key, null]))),
    [update],
  );

  return { params, update, clear };
}

export const toInt = (value: string | undefined, fallback: number, min = 1, max = Number.MAX_SAFE_INTEGER): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
};
