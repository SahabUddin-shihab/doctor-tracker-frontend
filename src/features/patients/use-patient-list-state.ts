'use client';

import { useMemo } from 'react';
import { toInt, useUrlParams } from '@/hooks/use-url-params';
import type { Gender } from '@/types';
import type { PatientListParams } from './api';

export const PATIENT_FILTER_KEYS = ['condition', 'gender', 'doctorId', 'ageMin', 'ageMax', 'createdFrom', 'createdTo'] as const;

const GENDERS: Gender[] = ['male', 'female', 'other'];
const SORTS = ['createdAt', 'name', 'age'] as const;

export function usePatientListState() {
  const { params, update, clear } = useUrlParams();

  const query = useMemo<PatientListParams>(
    () => ({
      page: toInt(params.page, 1),
      limit: toInt(params.limit, 10, 1, 100),
      search: params.search ?? '',
      condition: params.condition ?? '',
      gender: GENDERS.includes(params.gender as Gender) ? (params.gender as Gender) : '',
      doctorId: params.doctorId ?? '',
      ageMin: params.ageMin ?? '',
      ageMax: params.ageMax ?? '',
      createdFrom: params.createdFrom ?? '',
      createdTo: params.createdTo ?? '',
      sortBy: (SORTS as readonly string[]).includes(params.sortBy ?? '') ? (params.sortBy as (typeof SORTS)[number]) : 'createdAt',
      sortOrder: params.sortOrder === 'asc' ? 'asc' : 'desc',
    }),
    [params],
  );

  const activeFilterCount = PATIENT_FILTER_KEYS.filter((key) => Boolean(query[key])).length;
  const hasAnyCriteria = activeFilterCount > 0 || Boolean(query.search);

  return {
    query,
    update,
    activeFilterCount,
    hasAnyCriteria,
    clearFilters: () => clear([...PATIENT_FILTER_KEYS]),
    clearAll: () => clear([...PATIENT_FILTER_KEYS, 'search']),
  };
}
