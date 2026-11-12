'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/auth-provider';
import { OverviewCards } from './overview-cards';
import { RecentActivity } from './recent-activity';

// Recharts is the heaviest dependency; load it after the page shell and stat cards have rendered.
const chartFallback = (height: string) =>
  function ChartFallback() {
    return (
      <Card className="p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className={`mt-5 w-full ${height}`} />
      </Card>
    );
  };

const PatientsPerDoctorChart = dynamic(() => import('./patients-per-doctor-chart'), { ssr: false, loading: chartFallback('h-64') });
const ConditionsChart = dynamic(() => import('./conditions-chart'), { ssr: false, loading: chartFallback('h-48') });
const TrendsChart = dynamic(() => import('./trends-chart'), { ssr: false, loading: chartFallback('h-96') });

function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export function DashboardView() {
  const { admin } = useAuth();
  const name = admin?.email.split('@')[0] ?? '';

  return (
    <>
      <PageHeader title={`${greeting()}${name ? `, ${name}` : ''}`} description="Here is what is happening across your doctors and patients." />

      <div className="space-y-6">
        <OverviewCards />

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="space-y-6 xl:col-span-3">
            <ErrorBoundary title="This chart could not be displayed">
              <TrendsChart />
            </ErrorBoundary>
            <ErrorBoundary title="This chart could not be displayed">
              <PatientsPerDoctorChart />
            </ErrorBoundary>
          </div>
          <div className="space-y-6 xl:col-span-2">
            <ErrorBoundary title="This chart could not be displayed">
              <ConditionsChart />
            </ErrorBoundary>
            <RecentActivity />
          </div>
        </div>
      </div>
    </>
  );
}
