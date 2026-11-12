'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/query-keys';
import type {
  ActivityItem,
  ApiSuccess,
  ConditionDistribution,
  DashboardOverview,
  PatientsPerDoctor,
  TrendPeriod,
  TrendsResponse,
} from '@/types';

export const useOverview = () =>
  useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: async () => (await api.get<ApiSuccess<DashboardOverview>>('/dashboard/overview')).data.data,
  });

export const usePatientsPerDoctor = () =>
  useQuery({
    queryKey: queryKeys.dashboard.patientsPerDoctor,
    queryFn: async () =>
      (await api.get<ApiSuccess<PatientsPerDoctor>>('/dashboard/patients-per-doctor', { params: { limit: 10 } })).data.data,
  });

export const useTrends = (period: TrendPeriod, from: string, to: string) =>
  useQuery({
    queryKey: queryKeys.dashboard.trends(period, from, to),
    queryFn: async () =>
      (
        await api.get<ApiSuccess<TrendsResponse>>('/dashboard/trends', {
          params: { period, ...(from ? { from } : {}), ...(to ? { to } : {}) },
        })
      ).data.data,
    placeholderData: keepPreviousData,
  });

export const useConditionDistribution = () =>
  useQuery({
    queryKey: queryKeys.dashboard.conditions,
    queryFn: async () =>
      (await api.get<ApiSuccess<ConditionDistribution>>('/dashboard/conditions', { params: { limit: 7 } })).data.data,
  });

export const useRecentActivity = () =>
  useQuery({
    queryKey: queryKeys.dashboard.activity,
    queryFn: async () =>
      (await api.get<ApiSuccess<ActivityItem[]>>('/dashboard/recent-activity', { params: { limit: 10 } })).data.data,
  });
