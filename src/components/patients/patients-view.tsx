'use client';

import { Plus, SearchX, Users } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FilterToggle } from '@/components/shared/filters';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDeletePatient, usePatients } from '@/features/patients/api';
import { usePatientListState } from '@/features/patients/use-patient-list-state';
import { getErrorMessage } from '@/lib/api/client';
import type { Patient } from '@/types';
import { PatientDetailsDialog } from './patient-details-dialog';
import { PatientFilters } from './patient-filters';
import { PatientFormDialog } from './patient-form-dialog';
import { PatientsTable } from './patients-table';

export function PatientsView() {
  const { query, update, activeFilterCount, hasAnyCriteria, clearFilters, clearAll } = usePatientListState();
  const { data, isPending, isFetching, isError, error, refetch } = usePatients(query);
  const deletePatient = useDeletePatient();

  const [filtersOpen, setFiltersOpen] = useState(activeFilterCount > 0);
  const [addOpen, setAddOpen] = useState(false);
  const [viewing, setViewing] = useState<Patient | null>(null);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const onSearch = useCallback((search: string) => update({ search }), [update]);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deletePatient.mutateAsync(deleting.id);
      toast.success('Patient deleted', { description: `${deleting.name}’s record was removed.` });
      setDeleting(null);
    } catch (err) {
      toast.error('Could not delete the patient', { description: getErrorMessage(err) });
    }
  };

  const total = data?.meta.total;
  const empty = !isPending && !isError && data?.items.length === 0;
  const pageEmptyButHasRecords = empty && (data?.meta.total ?? 0) > 0; // e.g. last row of the last page was just deleted

  return (
    <>
      <PageHeader
        title="Patients"
        description={total === undefined ? 'Loading patients…' : `${total} ${total === 1 ? 'patient' : 'patients'}${hasAnyCriteria ? ' match your criteria' : ' registered'}`}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus /> Add patient
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput
            label="Search patients"
            value={query.search ?? ''}
            onSearch={onSearch}
            placeholder="Search by name, phone, email, condition or doctor"
          />
          <FilterToggle open={filtersOpen} onToggle={() => setFiltersOpen((o) => !o)} activeCount={activeFilterCount} controlsId="patient-filters" />
        </div>

        <PatientFilters id="patient-filters" open={filtersOpen} query={query} activeCount={activeFilterCount} update={update} onClear={clearFilters} />

        {isError ? (
          <ErrorState title="Could not load patients" error={error} onRetry={() => void refetch()} />
        ) : empty ? (
          hasAnyCriteria ? (
            <EmptyState
              icon={SearchX}
              title="No patients match your search"
              description="Try a different search term or remove some filters."
              action={
                <Button variant="outline" onClick={clearAll}>
                  Clear search and filters
                </Button>
              }
            />
          ) : pageEmptyButHasRecords ? (
            <EmptyState title="This page is empty" action={<Button variant="outline" onClick={() => update({ page: 1 })}>Go to first page</Button>} />
          ) : (
            <EmptyState
              icon={Users}
              title="No patients yet"
              description="Register a patient and assign them to a doctor."
              action={
                <Button onClick={() => setAddOpen(true)}>
                  <Plus /> Add patient
                </Button>
              }
            />
          )
        ) : (
          <PatientsTable
            label="Patients"
            patients={data?.items ?? []}
            isLoading={isPending}
            isFetching={isFetching}
            sort={{ by: query.sortBy ?? 'createdAt', order: query.sortOrder ?? 'desc' }}
            onSortChange={(s) => update({ sortBy: s.by, sortOrder: s.order })}
            onView={setViewing}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        )}

        {data && !isError && !empty ? (
          <Pagination meta={data.meta} itemLabel="patients" onPageChange={(page) => update({ page })} onLimitChange={(limit) => update({ limit })} />
        ) : null}
      </Card>

      <PatientFormDialog open={addOpen} onOpenChange={setAddOpen} />
      <PatientFormDialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} patient={editing ?? undefined} />
      <PatientDetailsDialog patient={viewing} onOpenChange={(open) => !open && setViewing(null)} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this patient?"
        description={
          <>
            <strong className="text-foreground">{deleting?.name}</strong>’s record will be permanently deleted. Their doctor is not affected. This cannot be undone.
          </>
        }
        confirmLabel="Delete patient"
        loading={deletePatient.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
