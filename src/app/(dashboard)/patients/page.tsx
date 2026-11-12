import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PatientsView } from '@/components/patients/patients-view';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Patients' };

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="Patients" description="Loading patients…" />
          <Card className="p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mt-4 h-72 w-full" />
          </Card>
        </>
      }
    >
      <PatientsView />
    </Suspense>
  );
}
