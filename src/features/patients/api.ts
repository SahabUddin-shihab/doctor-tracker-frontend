'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/query-keys';
import type { PatientValues } from '@/lib/validations/patient';
import type { ApiSuccess, ConditionOption, Gender, Paginated, Patient } from '@/types';

export interface PatientListParams {
  page: number;
  limit: number;
  search?: string;
  condition?: string;
  gender?: Gender | '';
  doctorId?: string;
  ageMin?: number | string;
  ageMax?: number | string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: 'createdAt' | 'name' | 'age';
  sortOrder?: 'asc' | 'desc';
}

/** Maps form values onto the API payload ("" email/notes mean "none"). */
export function patientPayload(values: PatientValues, options: { withDoctor: boolean }) {
  const { doctorId, email, notes, ...rest } = values;
  return {
    ...rest,
    email,
    notes,
    ...(options.withDoctor ? { doctorId } : {}),
  };
}

function compact(params: PatientListParams): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Record<string, string | number>;
}

export const usePatients = (params: PatientListParams) =>
  useQuery({
    queryKey: queryKeys.patients.list(params),
    queryFn: async (): Promise<Paginated<Patient>> => {
      const res = await api.get<ApiSuccess<Patient[]>>('/patients', { params: compact(params) });
      return { items: res.data.data, meta: res.data.meta! };
    },
    placeholderData: keepPreviousData,
  });

export const useConditionOptions = () =>
  useQuery({
    queryKey: queryKeys.patients.conditions,
    queryFn: async () => (await api.get<ApiSuccess<ConditionOption[]>>('/patients/filter-options')).data.data,
    staleTime: 60_000,
  });

function useInvalidatePatientData() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.patients.all }),
      client.invalidateQueries({ queryKey: queryKeys.doctors.all }), // patient counts + doctor patient lists
      client.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ]);
}

export function useCreatePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: async (values: PatientValues) =>
      (await api.post<ApiSuccess<Patient>>('/patients', patientPayload(values, { withDoctor: true }))).data.data,
    onSuccess: invalidate,
  });
}

export function useUpdatePatient(id: string) {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: async (values: PatientValues) =>
      (await api.put<ApiSuccess<Patient>>(`/patients/${id}`, patientPayload(values, { withDoctor: true }))).data.data,
    onSuccess: invalidate,
  });
}

export function useDeletePatient() {
  const invalidate = useInvalidatePatientData();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/patients/${id}`);
    },
    onSuccess: invalidate,
  });
}