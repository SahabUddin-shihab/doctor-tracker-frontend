'use client';

import { Eye, Plus, SearchX, Stethoscope, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { DataTable, type Column } from '@/components/shared/data-table';
import { DateRangeFilter, FilterPanel, FilterSelect, FilterToggle } from '@/components/shared/filters';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { PatientFormDialog } from '@/components/patients/patient-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDoctorFilterOptions, useDoctors } from '@/features/doctors/api';
import { useDoctorListState } from '@/features/doctors/use-doctor-list-state';
import { formatDate } from '@/lib/utils';
import type { Doctor } from '@/types';
import { DoctorFormDialog } from './doctor-form-dialog';

export function DoctorsView() {
  const { query, update, activeFilterCount, hasAnyCriteria, clearFilters, clearAll } = useDoctorListState();
  const { data, isPending, isFetching, isError, error, refetch } = useDoctors(query);
  const filterOptions = useDoctorFilterOptions();

  const [filtersOpen, setFiltersOpen] = useState(activeFilterCount > 0);
  const [addOpen, setAddOpen] = useState(false);
  const [patientFor, setPatientFor] = useState<Doctor | null>(null);

  const onSearch = useCallback((search: string) => update({ search }), [update]);

  const columns: Column<Doctor>[] = [
    {
      id: 'name',
      header: 'Doctor',
      sortKey: 'name',
      cell: (d) => (
        <Link prefetch={false} href={`/doctors/${d.id}`} className="font-medium hover:text-primary hover:underline">
          {d.name}
        </Link>
      ),
    },
    { id: 'specialization', header: 'Specialization', cell: (d) => <Badge>{d.specialization}</Badge> },
    { id: 'hospital', header: 'Hospital', showFrom: 'lg', cell: (d) => d.hospital },
    { id: 'phone', header: 'Phone', showFrom: 'xl', cell: (d) => <span className="tabular">{d.phone}</span> },
    { id: 'email', header: 'Email', showFrom: 'xl', cell: (d) => <span className="text-muted-foreground">{d.email}</span> },
    {
      id: 'patients',
      header: 'Patients',
      cell: (d) => (
        <Link prefetch={false} href={`/doctors/${d.id}#patients`} className="tabular inline-flex items-center gap-1.5 hover:text-primary" aria-label={`${d.patientCount} patients of ${d.name}`}>
          <Users className="size-3.5 text-muted-foreground" aria-hidden />
          {d.patientCount}
        </Link>
      ),
    },
    { id: 'created', header: 'Created', sortKey: 'createdAt', showFrom: 'lg', cell: (d) => <span className="tabular whitespace-nowrap">{formatDate(d.createdAt)}</span> },
    {
      id: 'actions',
      header: 'Actions',
      className: 'w-px',
      cell: (d) => <DoctorActions doctor={d} onAddPatient={() => setPatientFor(d)} />,
    },
  ];

  const total = data?.meta.total;
  const empty = !isPending && !isError && data?.items.length === 0;

  return (
    <>
      <PageHeader
        title="Doctors"
        description={total === undefined ? 'Loading directory…' : `${total} ${total === 1 ? 'doctor' : 'doctors'}${hasAnyCriteria ? ' match your criteria' : ' in the directory'}`}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus /> Add doctor
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <SearchInput
            label="Search doctors"
            value={query.search ?? ''}
            onSearch={onSearch}
            placeholder="Search by name, specialization, hospital, email or phone"
          />
          <FilterToggle open={filtersOpen} onToggle={() => setFiltersOpen((o) => !o)} activeCount={activeFilterCount} controlsId="doctor-filters" />
        </div>

        <FilterPanel id="doctor-filters" open={filtersOpen} activeCount={activeFilterCount} onClear={clearFilters}>
          <FilterSelect
            id="filter-specialization"
            label="Specialization"
            allLabel="All specializations"
            value={query.specialization ?? ''}
            onChange={(specialization) => update({ specialization })}
            options={(filterOptions.data?.specializations ?? []).map((value) => ({ value, label: value }))}
          />
          <FilterSelect
            id="filter-hospital"
            label="Hospital"
            allLabel="All hospitals"
            value={query.hospital ?? ''}
            onChange={(hospital) => update({ hospital })}
            options={(filterOptions.data?.hospitals ?? []).map((value) => ({ value, label: value }))}
          />
          <DateRangeFilter idPrefix="doctor-created" from={query.createdFrom ?? ''} to={query.createdTo ?? ''} onChange={update} />
        </FilterPanel>

        {isError ? (
          <ErrorState title="Could not load doctors" error={error} onRetry={() => void refetch()} />
        ) : empty ? (
          hasAnyCriteria ? (
            <EmptyState
              icon={SearchX}
              title="No doctors match your search"
              description="Try a different search term or remove some filters."
              action={
                <Button variant="outline" onClick={clearAll}>
                  Clear search and filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Stethoscope}
              title="No doctors yet"
              description="Add your first doctor to start assigning patients."
              action={
                <Button onClick={() => setAddOpen(true)}>
                  <Plus /> Add doctor
                </Button>
              }
            />
          )
        ) : (
          <DataTable
            label="Doctors"
            columns={columns}
            rows={data?.items ?? []}
            getRowId={(d) => d.id}
            isLoading={isPending}
            isFetching={isFetching}
            sort={{ by: query.sortBy ?? 'createdAt', order: query.sortOrder ?? 'desc' }}
            onSortChange={(s) => update({ sortBy: s.by, sortOrder: s.order })}
            renderMobileCard={(d) => <DoctorMobileCard doctor={d} onAddPatient={() => setPatientFor(d)} />}
          />
        )}

        {data && !isError && !empty ? (
          <Pagination
            meta={data.meta}
            itemLabel="doctors"
            onPageChange={(page) => update({ page })}
            onLimitChange={(limit) => update({ limit })}
          />
        ) : null}
      </Card>

      <DoctorFormDialog open={addOpen} onOpenChange={setAddOpen} />
      <PatientFormDialog
        open={patientFor !== null}
        onOpenChange={(open) => !open && setPatientFor(null)}
        doctor={patientFor ? { id: patientFor.id, name: patientFor.name, specialization: patientFor.specialization, hospital: patientFor.hospital } : undefined}
        lockDoctor
      />
    </>
  );
}

function DoctorActions({ doctor, onAddPatient }: { doctor: Doctor; onAddPatient: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="icon" title="View details">
        <Link prefetch={false} href={`/doctors/${doctor.id}`} aria-label={`View details of ${doctor.name}`}>
          <Eye />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon" title="View patients">
        <Link prefetch={false} href={`/doctors/${doctor.id}#patients`} aria-label={`View patients of ${doctor.name}`}>
          <Users />
        </Link>
      </Button>
      <Button variant="ghost" size="icon" title="Add patient" onClick={onAddPatient} aria-label={`Add patient to ${doctor.name}`}>
        <UserPlus />
      </Button>
    </div>
  );
}

function DoctorMobileCard({ doctor, onAddPatient }: { doctor: Doctor; onAddPatient: () => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link prefetch={false} href={`/doctors/${doctor.id}`} className="font-medium hover:text-primary">
            {doctor.name}
          </Link>
          <p className="truncate text-sm text-muted-foreground">{doctor.hospital}</p>
        </div>
        <Badge>{doctor.specialization}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Phone</dt>
        <dd className="tabular text-right">{doctor.phone}</dd>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="truncate text-right">{doctor.email}</dd>
        <dt className="text-muted-foreground">Patients</dt>
        <dd className="tabular text-right">{doctor.patientCount}</dd>
        <dt className="text-muted-foreground">Created</dt>
        <dd className="tabular text-right">{formatDate(doctor.createdAt)}</dd>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link prefetch={false} href={`/doctors/${doctor.id}`}>
            <Eye /> Details
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link prefetch={false} href={`/doctors/${doctor.id}#patients`}>
            <Users /> Patients
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={onAddPatient}>
          <UserPlus /> Add patient
        </Button>
      </div>
    </div>
  );
}
