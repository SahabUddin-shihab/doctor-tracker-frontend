'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField, fieldAria } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAddPatientToDoctor, useDoctorOptions } from '@/features/doctors/api';
import { useCreatePatient, useUpdatePatient } from '@/features/patients/api';
import { getErrorMessage, getFieldErrors } from '@/lib/api/client';
import {
  GENDER_OPTIONS,
  patientDefaults,
  patientSchema,
  type PatientFormValues,
  type PatientValues,
} from '@/lib/validations/patient';
import type { DoctorOption, Patient } from '@/types';

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Provide a patient to edit; omit to create. */
  patient?: Patient;
  /** Pre-selected doctor when adding from a doctor row / doctor page. */
  doctor?: DoctorOption;
  /** Show the doctor but do not allow changing it (adding from a doctor's own page). */
  lockDoctor?: boolean;
}

const FIELDS = ['name', 'email', 'phone', 'age', 'gender', 'condition', 'notes', 'doctorId'] as const;
type FieldName = (typeof FIELDS)[number];

function valuesFor(patient: Patient | undefined, doctorId: string): PatientFormValues {
  if (!patient) return patientDefaults(doctorId);
  return {
    name: patient.name,
    email: patient.email ?? '',
    phone: patient.phone,
    age: patient.age,
    gender: patient.gender,
    condition: patient.condition,
    notes: patient.notes ?? '',
    doctorId: patient.doctor?.id ?? '',
  };
}

export function PatientFormDialog({ open, onOpenChange, patient, doctor, lockDoctor = false }: PatientFormDialogProps) {
  const isEdit = Boolean(patient);
  const lockedDoctorId = lockDoctor ? (doctor?.id ?? '') : '';

  const doctors = useDoctorOptions('', open);
  const createPatient = useCreatePatient();
  const addToDoctor = useAddPatientToDoctor(lockedDoctorId);
  const updatePatient = useUpdatePatient(patient?.id ?? '');

  const initial = useMemo(() => valuesFor(patient, doctor?.id ?? ''), [patient, doctor?.id]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues, unknown, PatientValues>({
    // The schema's input type requires age/gender; the empty form legitimately has neither yet.
    resolver: zodResolver(patientSchema) as unknown as Resolver<PatientFormValues, unknown, PatientValues>,
    defaultValues: initial,
  });

  useEffect(() => {
    if (open) reset(initial);
  }, [open, initial, reset]);

  // Make sure the currently assigned / pre-selected doctor is always selectable, even outside the first page of options.
  const doctorChoices = useMemo(() => {
    const list = [...(doctors.data ?? [])];
    const extra: DoctorOption | undefined = doctor ?? (patient?.doctor ? { ...patient.doctor, hospital: '' } : undefined);
    if (extra && !list.some((d) => d.id === extra.id)) list.unshift(extra);
    return list;
  }, [doctors.data, doctor, patient]);

  const busy = isSubmitting || createPatient.isPending || addToDoctor.isPending || updatePatient.isPending;

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await updatePatient.mutateAsync(values);
        toast.success('Patient updated', { description: `${values.name}’s record has been saved.` });
      } else if (lockDoctor && lockedDoctorId) {
        await addToDoctor.mutateAsync(values);
        toast.success('Patient added', { description: `${values.name} was added to ${doctor?.name}.` });
      } else {
        await createPatient.mutateAsync(values);
        toast.success('Patient added', { description: `${values.name} has been registered.` });
      }
      onOpenChange(false);
    } catch (error) {
      const fieldErrors = getFieldErrors(error).filter((e) => (FIELDS as readonly string[]).includes(e.path));
      fieldErrors.forEach((e) => setError(e.path as FieldName, { message: e.message }));
      toast.error(fieldErrors.length ? 'Please fix the highlighted fields' : getErrorMessage(error, isEdit ? 'Could not update the patient' : 'Could not add the patient'), {
        description: fieldErrors[0]?.message,
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (!busy ? onOpenChange(next) : undefined)}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit patient' : 'Add patient'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Update the patient’s details or move them to another doctor.' : 'Every patient is assigned to a doctor.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <FormField id="patient-name" label="Full name" error={errors.name?.message} required className="sm:col-span-2">
              <Input {...fieldAria('patient-name', errors.name?.message)} placeholder="Rahim Uddin" autoComplete="off" disabled={busy} {...register('name')} />
            </FormField>

            <FormField id="patient-phone" label="Phone number" error={errors.phone?.message} required>
              <Input {...fieldAria('patient-phone', errors.phone?.message)} type="tel" placeholder="01712-345678" autoComplete="off" disabled={busy} {...register('phone')} />
            </FormField>
            <FormField id="patient-email" label="Email address" error={errors.email?.message} hint="Optional">
              <Input {...fieldAria('patient-email', errors.email?.message, 'hint')} type="email" placeholder="patient@example.com" autoComplete="off" disabled={busy} {...register('email')} />
            </FormField>

            <FormField id="patient-age" label="Age" error={errors.age?.message} required>
              <Input
                {...fieldAria('patient-age', errors.age?.message)}
                type="number"
                inputMode="numeric"
                min={0}
                max={130}
                placeholder="42"
                disabled={busy}
                {...register('age', { setValueAs: (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)) })}
              />
            </FormField>
            <FormField id="patient-gender" label="Gender" error={errors.gender?.message} required>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={busy}>
                    <SelectTrigger {...fieldAria('patient-gender', errors.gender?.message)} onBlur={field.onBlur}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField id="patient-condition" label="Medical condition" error={errors.condition?.message} required>
              <Input {...fieldAria('patient-condition', errors.condition?.message)} placeholder="Hypertension" autoComplete="off" disabled={busy} {...register('condition')} />
            </FormField>
            <FormField id="patient-doctor" label="Assigned doctor" error={errors.doctorId?.message} required hint={lockDoctor ? 'Adding to this doctor’s patient list' : undefined}>
              <Controller
                control={control}
                name="doctorId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={busy || lockDoctor}>
                    <SelectTrigger {...fieldAria('patient-doctor', errors.doctorId?.message)} onBlur={field.onBlur}>
                      <SelectValue placeholder={doctors.isPending ? 'Loading doctors…' : 'Select a doctor'} />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorChoices.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} · {d.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField id="patient-notes" label="Additional notes" error={errors.notes?.message} hint="Optional · up to 2000 characters" className="sm:col-span-2">
              <Textarea {...fieldAria('patient-notes', errors.notes?.message, 'hint')} rows={3} placeholder="Allergies, referral source, follow-up plan…" disabled={busy} {...register('notes')} />
            </FormField>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
