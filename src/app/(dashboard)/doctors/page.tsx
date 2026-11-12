import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DoctorsView } from '@/components/doctors/doctors-view';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Doctors' };

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="Doctors" description="Loading directory…" />
          <Card className="p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mt-4 h-72 w-full" />
          </Card>
        </>
      }
    >
      <DoctorsView />
    </Suspense>
  );
}
