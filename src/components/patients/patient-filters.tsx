'use client';

import { DateRangeFilter, DebouncedInput, FilterPanel, FilterSelect } from '@/components/shared/filters';
import { useDoctorOptions } from '@/features/doctors/api';
import { useConditionOptions, type PatientListParams } from '@/features/patients/api';
import { GENDER_OPTIONS } from '@/lib/validations/patient';

interface PatientFiltersProps {
  id: string;
  open: boolean;
  query: PatientListParams;
  activeCount: number;
  update: (patch: Record<string, string | number | null | undefined>) => void;
  onClear: () => void;
  /** Not shown on a doctor's own page, where the list is already limited to that doctor. */
  showDoctorFilter?: boolean;
}

export function PatientFilters({ id, open, query, activeCount, update, onClear, showDoctorFilter = true }: PatientFiltersProps) {
  const conditions = useConditionOptions();
  const doctors = useDoctorOptions('', open && showDoctorFilter);

  return (
    <FilterPanel id={id} open={open} activeCount={activeCount} onClear={onClear}>
      <FilterSelect
        id="filter-condition"
        label="Medical condition"
        allLabel="All conditions"
        value={query.condition ?? ''}
        onChange={(condition) => update({ condition })}
        options={(conditions.data ?? []).map((c) => ({ value: c.value, label: `${c.label} (${c.count})` }))}
      />
      <FilterSelect
        id="filter-gender"
        label="Gender"
        allLabel="All genders"
        value={query.gender ?? ''}
        onChange={(gender) => update({ gender })}
        options={[...GENDER_OPTIONS]}
      />
      {showDoctorFilter ? (
        <FilterSelect
          id="filter-doctor"
          label="Assigned doctor"
          allLabel="All doctors"
          value={query.doctorId ?? ''}
          onChange={(doctorId) => update({ doctorId })}
          options={[{ value: 'unassigned', label: 'Unassigned' }, ...(doctors.data ?? []).map((d) => ({ value: d.id, label: d.name }))]}
        />
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <DebouncedInput id="filter-age-min" label="Min age" type="number" min={0} max={130} placeholder="0" value={String(query.ageMin ?? '')} onCommit={(ageMin) => update({ ageMin })} />
        <DebouncedInput id="filter-age-max" label="Max age" type="number" min={0} max={130} placeholder="130" value={String(query.ageMax ?? '')} onCommit={(ageMax) => update({ ageMax })} />
      </div>
      <DateRangeFilter idPrefix="patient-created" from={query.createdFrom ?? ''} to={query.createdTo ?? ''} onChange={update} />
    </FilterPanel>
  );
}
