'use client';

import { CalendarPlus, Stethoscope, UserRoundPlus, Users, UsersRound } from 'lucide-react';
import { ErrorState } from '@/components/shared/states';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/ui/card';
import { useOverview } from '@/features/dashboard/api';

const month = new Intl.DateTimeFormat('en-GB', { month: 'long' });

export function OverviewCards() {
  const { data, isPending, isError, error, refetch } = useOverview();

  if (isError) {
    return (
      <Card>
        <ErrorState title="Could not load the summary" error={error} onRetry={() => void refetch()} className="py-8" />
      </Card>
    );
  }

  const monthName = data ? month.format(new Date(data.monthStart)) : 'This month';

  return (
    <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Total doctors"
        icon={Stethoscope}
        loading={isPending}
        value={data?.totals.doctors}
        hint={data ? (data.doctorsWithoutPatients > 0 ? `${data.doctorsWithoutPatients} without patients` : 'All have patients') : undefined}
      />
      <StatCard
        label="Total patients"
        icon={Users}
        loading={isPending}
        value={data?.totals.patients}
        hint={data && data.unassignedPatients > 0 ? `${data.unassignedPatients} unassigned` : 'All assigned to a doctor'}
      />
      <StatCard label="Avg. patients per doctor" icon={UsersRound} loading={isPending} value={data?.averagePatientsPerDoctor.toFixed(1)} hint="Assigned patients ÷ doctors" />
      <StatCard
        label={`Doctors added in ${monthName}`}
        icon={UserRoundPlus}
        loading={isPending}
        value={data?.thisMonth.doctors}
        hint={data ? `${data.lastMonth.doctors} last month` : undefined}
      />
      <StatCard
        label={`Patients added in ${monthName}`}
        icon={CalendarPlus}
        loading={isPending}
        value={data?.thisMonth.patients}
        hint={data ? `${data.lastMonth.patients} last month` : undefined}
      />
    </section>
  );
}
