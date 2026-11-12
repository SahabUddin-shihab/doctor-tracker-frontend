import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DoctorDetails } from '@/components/doctors/doctor-details';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = { title: 'Doctor details' };

export default async function DoctorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="Doctor" />
          <Skeleton className="h-40 w-full" />
        </>
      }
    >
      <DoctorDetails id={id} />
    </Suspense>
  );
}
