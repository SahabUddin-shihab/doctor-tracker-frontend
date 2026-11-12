'use client';

import { Building2, CalendarDays, Mail, Phone, Plus, SearchX, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FilterToggle } from '@/components/shared/filters';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { PatientDetailsDialog } from '@/components/patients/patient-details-dialog';
import { PatientFilters } from '@/components/patients/patient-filters';
import { PatientFormDialog } from '@/components/patients/patient-form-dialog';
import { PatientsTable } from '@/components/patients/patients-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDoctor, useDoctorPatients, useRemovePatientFromDoctor } from '@/features/doctors/api';
import { useDeletePatient } from '@/features/patients/api';
import { usePatientListState } from '@/features/patients/use-patient-list-state';
import { getErrorMessage, getErrorStatus } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import type { Patient } from '@/types';

function InfoRow({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm break-words">{children}</dd>
      </div>
    </div>
  );
}

export function DoctorDetails({ id }: { id: string }) {
  const doctor = useDoctor(id);
  const { query, update, activeFilterCount, hasAnyCriteria, clearFilters, clearAll } = usePatientListState();
  // The doctor is fixed by the route, so the doctor filter is not part of this list's query.
  const { doctorId: _ignored, ...patientQuery } = query;
  const patients = useDoctorPatients(id, patientQuery);
  const removeFromDoctor = useRemovePatientFromDoctor(id);
  const deletePatient = useDeletePatient();

  const [filtersOpen, setFiltersOpen] = useState(activeFilterCount > 0);
  const [addOpen, setAddOpen] = useState(false);
  const [viewing, setViewing] = useState<Patient | null>(null);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [removing, setRemoving] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const onSearch = useCallback((search: string) => update({ search }), [update]);

  if (doctor.isError) {
    const missing = getErrorStatus(doctor.error) === 404 || getErrorStatus(doctor.error) === 400;
    return (
      <>
        <PageHeader title="Doctor" breadcrumbs={[{ label: 'Doctors', href: '/doctors' }, { label: 'Not found' }]} />
        <Card>
          {missing ? (
            <EmptyState
              title="Doctor not found"
              description="This doctor does not exist or the link is incorrect."
              action={
                <Button asChild variant="outline">
                  <Link href="/doctors">Back to doctors</Link>
                </Button>
              }
            />
          ) : (
            <ErrorState title="Could not load this doctor" error={doctor.error} onRetry={() => void doctor.refetch()} />
          )}
        </Card>
      </>
    );
  }

  const d = doctor.data;
  const empty = !patients.isPending && !patients.isError && patients.data?.items.length === 0;

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await removeFromDoctor.mutateAsync(removing.id);
      toast.success('Patient removed from list', { description: `${removing.name} is now unassigned and can be re-assigned from Patients.` });
      setRemoving(null);
    } catch (error) {
      toast.error('Could not remove the patient', { description: getErrorMessage(error) });
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deletePatient.mutateAsync(deleting.id);
      toast.success('Patient deleted', { description: `${deleting.name}’s record was removed.` });
      setDeleting(null);
    } catch (error) {
      toast.error('Could not delete the patient', { description: getErrorMessage(error) });
    }
  };

  return (
    <>
      <PageHeader
        title={d?.name ?? 'Doctor'}
        breadcrumbs={[{ label: 'Doctors', href: '/doctors' }, { label: d?.name ?? '…' }]}
        description={d ? `${d.specialization} · ${d.hospital}` : <Skeleton className="mt-1 h-4 w-56" />}
        actions={
          d ? (
            <Button onClick={() => setAddOpen(true)}>
              <UserPlus /> Add patient
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Doctor information</CardTitle>
          </CardHeader>
          <CardContent>
            {d ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoRow icon={Building2} label="Hospital">
                  {d.hospital}
                </InfoRow>
                <InfoRow icon={Phone} label="Phone">
                  <span className="tabular">{d.phone}</span>
                </InfoRow>
                <InfoRow icon={Mail} label="Email">
                  {d.email}
                </InfoRow>
                <InfoRow icon={CalendarDays} label="Added">
                  <span className="tabular">{formatDate(d.createdAt)}</span>
                </InfoRow>
                <div className="sm:col-span-2">
                  <Badge>{d.specialization}</Badge>
                </div>
              </dl>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Users className="size-6" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total patients</p>
            {d ? <p className="tabular text-3xl leading-none font-semibold tracking-tight">{d.patientCount}</p> : <Skeleton className="mt-2 h-8 w-12" />}
          </div>
        </Card>
      </div>

      <section id="patients" aria-labelledby="patients-heading" className="mt-6 scroll-mt-20">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="patients-heading" className="text-base font-semibold tracking-tight">
              Associated patients
            </h2>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div className="sm:w-72">
                <SearchInput label="Search this doctor's patients" value={query.search ?? ''} onSearch={onSearch} placeholder="Search patients" />
              </div>
              <FilterToggle open={filtersOpen} onToggle={() => setFiltersOpen((o) => !o)} activeCount={activeFilterCount} controlsId="doctor-patient-filters" />
            </div>
          </div>

          <PatientFilters
            id="doctor-patient-filters"
            open={filtersOpen}
            query={query}
            activeCount={activeFilterCount}
            update={update}
            onClear={clearFilters}
            showDoctorFilter={false}
          />

          {patients.isError ? (
            <ErrorState title="Could not load patients" error={patients.error} onRetry={() => void patients.refetch()} />
          ) : empty ? (
            hasAnyCriteria ? (
              <EmptyState
                icon={SearchX}
                title="No patients match"
                description="Try a different search or remove some filters."
                action={
                  <Button variant="outline" onClick={clearAll}>
                    Clear search and filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={Users}
                title="No patients yet"
                description="This doctor has no patients. Add the first one."
                action={
                  <Button onClick={() => setAddOpen(true)}>
                    <Plus /> Add patient
                  </Button>
                }
              />
            )
          ) : (
            <PatientsTable
              label="Patients of this doctor"
              patients={patients.data?.items ?? []}
              isLoading={patients.isPending}
              isFetching={patients.isFetching}
              showDoctor={false}
              sort={{ by: query.sortBy ?? 'createdAt', order: query.sortOrder ?? 'desc' }}
              onSortChange={(s) => update({ sortBy: s.by, sortOrder: s.order })}
              onView={setViewing}
              onEdit={setEditing}
              onDelete={setDeleting}
              onRemoveFromDoctor={setRemoving}
            />
          )}

          {patients.data && !patients.isError && !empty ? (
            <Pagination meta={patients.data.meta} itemLabel="patients" onPageChange={(page) => update({ page })} onLimitChange={(limit) => update({ limit })} />
          ) : null}
        </Card>
      </section>

      {d ? (
        <PatientFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          doctor={{ id: d.id, name: d.name, specialization: d.specialization, hospital: d.hospital }}
          lockDoctor
        />
      ) : null}
      <PatientFormDialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} patient={editing ?? undefined} />
      <PatientDetailsDialog patient={viewing} onOpenChange={(open) => !open && setViewing(null)} />

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove from this doctor's list?"
        description={
          <>
            <strong className="text-foreground">{removing?.name}</strong> will no longer be assigned to {d?.name}. Their record is kept and they will show as unassigned until you assign another doctor.
          </>
        }
        confirmLabel="Remove from list"
        loading={removeFromDoctor.isPending}
        onConfirm={() => void confirmRemove()}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this patient?"
        description={
          <>
            <strong className="text-foreground">{deleting?.name}</strong>’s record will be permanently deleted. This cannot be undone.
          </>
        }
        confirmLabel="Delete patient"
        loading={deletePatient.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
