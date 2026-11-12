'use client';

import { Eye, Pencil, Trash2, UserMinus } from 'lucide-react';
import Link from 'next/link';
import { DataTable, type Column, type SortState } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { capitalize, formatDate } from '@/lib/utils';
import type { Patient } from '@/types';

export interface PatientRowHandlers {
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
  /** Only on a doctor's own page: take the patient off this doctor's list without deleting them. */
  onRemoveFromDoctor?: (patient: Patient) => void;
}

interface PatientsTableProps extends PatientRowHandlers {
  patients: Patient[];
  isLoading: boolean;
  isFetching: boolean;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  /** Hide the doctor column when the list is already scoped to one doctor. */
  showDoctor?: boolean;
  label: string;
}

function DoctorCell({ patient }: { patient: Patient }) {
  if (!patient.doctor) return <Badge variant="warning">Unassigned</Badge>;
  return (
    <Link prefetch={false} href={`/doctors/${patient.doctor.id}`} className="hover:text-primary hover:underline">
      {patient.doctor.name}
    </Link>
  );
}

function RowActions({ patient, onView, onEdit, onDelete, onRemoveFromDoctor }: PatientRowHandlers & { patient: Patient }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" title="View details" aria-label={`View details of ${patient.name}`} onClick={() => onView(patient)}>
        <Eye />
      </Button>
      <Button variant="ghost" size="icon" title="Edit patient" aria-label={`Edit ${patient.name}`} onClick={() => onEdit(patient)}>
        <Pencil />
      </Button>
      {onRemoveFromDoctor ? (
        <Button variant="ghost" size="icon" title="Remove from this doctor" aria-label={`Remove ${patient.name} from this doctor`} onClick={() => onRemoveFromDoctor(patient)}>
          <UserMinus />
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        title="Delete patient"
        aria-label={`Delete ${patient.name}`}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => onDelete(patient)}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

export function PatientsTable({ patients, isLoading, isFetching, sort, onSortChange, showDoctor = true, label, ...handlers }: PatientsTableProps) {
  const columns: Column<Patient>[] = [
    { id: 'name', header: 'Patient', sortKey: 'name', cell: (p) => <span className="font-medium">{p.name}</span> },
    { id: 'phone', header: 'Phone', cell: (p) => <span className="tabular whitespace-nowrap">{p.phone}</span> },
    { id: 'email', header: 'Email', showFrom: 'xl', cell: (p) => (p.email ? <span className="text-muted-foreground">{p.email}</span> : <span className="text-muted-foreground/60">—</span>) },
    { id: 'age', header: 'Age', sortKey: 'age', showFrom: 'lg', cell: (p) => <span className="tabular">{p.age}</span> },
    { id: 'gender', header: 'Gender', showFrom: 'lg', cell: (p) => capitalize(p.gender) },
    { id: 'condition', header: 'Condition', cell: (p) => <Badge>{p.condition}</Badge> },
    ...(showDoctor ? [{ id: 'doctor', header: 'Doctor', showFrom: 'lg' as const, cell: (p: Patient) => <DoctorCell patient={p} /> }] : []),
    { id: 'created', header: 'Created', sortKey: 'createdAt', showFrom: 'xl', cell: (p) => <span className="tabular whitespace-nowrap">{formatDate(p.createdAt)}</span> },
    { id: 'actions', header: 'Actions', className: 'w-px', cell: (p) => <RowActions patient={p} {...handlers} /> },
  ];

  return (
    <DataTable
      label={label}
      columns={columns}
      rows={patients}
      getRowId={(p) => p.id}
      isLoading={isLoading}
      isFetching={isFetching}
      sort={sort}
      onSortChange={onSortChange}
      renderMobileCard={(p) => (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{p.name}</p>
              <p className="tabular text-sm text-muted-foreground">
                {p.age} yrs · {capitalize(p.gender)}
              </p>
            </div>
            <Badge>{p.condition}</Badge>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="tabular text-right">{p.phone}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate text-right">{p.email ?? '—'}</dd>
            {showDoctor ? (
              <>
                <dt className="text-muted-foreground">Doctor</dt>
                <dd className="text-right">
                  <DoctorCell patient={p} />
                </dd>
              </>
            ) : null}
            <dt className="text-muted-foreground">Created</dt>
            <dd className="tabular text-right">{formatDate(p.createdAt)}</dd>
          </dl>
          <RowActions patient={p} {...handlers} />
        </div>
      )}
    />
  );
}
