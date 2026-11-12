'use client';

import { useMemo } from 'react';
import { toInt, useUrlParams } from '@/hooks/use-url-params';
import type { DoctorListParams } from './api';

export const DOCTOR_FILTER_KEYS = ['specialization', 'hospital', 'createdFrom', 'createdTo'] as const;

export function useDoctorListState() {
  const { params, update, clear } = useUrlParams();

  const query = useMemo<DoctorListParams>(
    () => ({
      page: toInt(params.page, 1),
      limit: toInt(params.limit, 10, 1, 100),
      search: params.search ?? '',
      specialization: params.specialization ?? '',
      hospital: params.hospital ?? '',
      createdFrom: params.createdFrom ?? '',
      createdTo: params.createdTo ?? '',
      sortBy: params.sortBy === 'name' ? 'name' : 'createdAt',
      sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc',
    }),
    [params],
  );

  const activeFilterCount = DOCTOR_FILTER_KEYS.filter((key) => Boolean(query[key])).length;
  const hasAnyCriteria = activeFilterCount > 0 || Boolean(query.search);

  return {
    query,
    update,
    activeFilterCount,
    hasAnyCriteria,
    clearFilters: () => clear([...DOCTOR_FILTER_KEYS]),
    clearAll: () => clear([...DOCTOR_FILTER_KEYS, 'search']),
  };
}
