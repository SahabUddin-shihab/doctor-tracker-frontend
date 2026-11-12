'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/query-keys';
import type { DoctorValues } from '@/lib/validations/doctor';
import type { PatientValues } from '@/lib/validations/patient';
import type { ApiSuccess, Doctor, DoctorOption, Paginated, Patient } from '@/types';
import { patientPayload, type PatientListParams } from '../patients/api';

export interface DoctorListParams {
  page: number;
  limit: number;
  search?: string;
  specialization?: string;
  hospital?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/** Drops empty values so they never reach the query string (the API treats absent = no filter). */
export function cleanParams<T extends object>(params: T): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Record<string, string | number>;
}

async function fetchDoctors(params: DoctorListParams): Promise<Paginated<Doctor>> {
  const res = await api.get<ApiSuccess<Doctor[]>>('/doctors', { params: cleanParams(params) });
  return { items: res.data.data, meta: res.data.meta! };
}

export const useDoctors = (params: DoctorListParams) =>
  useQuery({
    queryKey: queryKeys.doctors.list(params),
    queryFn: () => fetchDoctors(params),
    placeholderData: keepPreviousData, // keep the old page on screen while the next one loads
  });

export const useDoctor = (id: string) =>
  useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: async () => (await api.get<ApiSuccess<Doctor>>(`/doctors/${id}`)).data.data,
  });

export type DoctorPatientParams = Omit<PatientListParams, 'doctorId'>;

export const useDoctorPatients = (id: string, params: DoctorPatientParams) =>
  useQuery({
    queryKey: queryKeys.doctors.patients(id, params),
    queryFn: async (): Promise<Paginated<Patient>> => {
      const res = await api.get<ApiSuccess<Patient[]>>(`/doctors/${id}/patients`, { params: cleanParams(params) });
      return { items: res.data.data, meta: res.data.meta! };
    },
    placeholderData: keepPreviousData,
  });

export const useDoctorOptions = (search = '', enabled = true) =>
  useQuery({
    queryKey: queryKeys.doctors.options(search),
    queryFn: async () =>
      (await api.get<ApiSuccess<DoctorOption[]>>('/doctors/options', { params: cleanParams({ search, limit: 100 }) })).data.data,
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

export const useDoctorFilterOptions = () =>
  useQuery({
    queryKey: queryKeys.doctors.filterOptions,
    queryFn: async () =>
      (await api.get<ApiSuccess<{ specializations: string[]; hospitals: string[] }>>('/doctors/filter-options')).data.data,
    staleTime: 60_000,
  });

/** Everything that displays doctor/patient counts or analytics must be refreshed after these mutations. */
function useInvalidateRelationships() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.doctors.all }),
      client.invalidateQueries({ queryKey: queryKeys.patients.all }),
      client.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
    ]);
}

export function useCreateDoctor() {
  const invalidate = useInvalidateRelationships();
  return useMutation({
    mutationFn: async (values: DoctorValues) => (await api.post<ApiSuccess<Doctor>>('/doctors', values)).data.data,
    onSuccess: invalidate,
  });
}

export function useAddPatientToDoctor(doctorId: string) {
  const invalidate = useInvalidateRelationships();
  return useMutation({
    mutationFn: async (values: PatientValues) =>
      (await api.post<ApiSuccess<Patient>>(`/doctors/${doctorId}/patients`, patientPayload(values, { withDoctor: false }))).data.data,
    onSuccess: invalidate,
  });
}

export function useRemovePatientFromDoctor(doctorId: string) {
  const invalidate = useInvalidateRelationships();
  return useMutation({
    mutationFn: async (patientId: string) =>
      (await api.delete<ApiSuccess<Patient>>(`/doctors/${doctorId}/patients/${patientId}`)).data.data,
    onSuccess: invalidate,
  });
}
