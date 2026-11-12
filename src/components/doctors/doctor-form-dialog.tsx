'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField, fieldAria } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCreateDoctor } from '@/features/doctors/api';
import { getErrorMessage, getFieldErrors } from '@/lib/api/client';
import { doctorDefaults, doctorSchema, type DoctorValues } from '@/lib/validations/doctor';
import type { Doctor } from '@/types';

interface DoctorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (doctor: Doctor) => void;
}

const FIELDS = ['name', 'specialization', 'hospital', 'phone', 'email'] as const;

export function DoctorFormDialog({ open, onOpenChange, onCreated }: DoctorFormDialogProps) {
  const create = useCreateDoctor();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DoctorValues>({ resolver: zodResolver(doctorSchema), defaultValues: doctorDefaults });

  // Start every opening with a clean form (also clears any previous server errors).
  useEffect(() => {
    if (open) reset(doctorDefaults);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const doctor = await create.mutateAsync(values);
      toast.success('Doctor added', { description: `${doctor.name} is now in your directory.` });
      reset(doctorDefaults);
      onOpenChange(false);
      onCreated?.(doctor);
    } catch (error) {
      const fieldErrors = getFieldErrors(error).filter((e): e is { path: (typeof FIELDS)[number]; message: string } =>
        (FIELDS as readonly string[]).includes(e.path),
      );
      fieldErrors.forEach((e) => setError(e.path, { message: e.message }));
      toast.error(fieldErrors.length ? 'Please fix the highlighted fields' : getErrorMessage(error, 'Could not add the doctor'), {
        description: fieldErrors.length ? fieldErrors[0]?.message : undefined,
      });
    }
  });

  const busy = isSubmitting || create.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => (!busy ? onOpenChange(next) : undefined)}>
      <DialogContent>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DialogHeader>
            <DialogTitle>Add doctor</DialogTitle>
            <DialogDescription>Add a doctor to the directory. Email addresses must be unique.</DialogDescription>
          </DialogHeader>

          <DialogBody className="grid gap-4 sm:grid-cols-2">
            <FormField id="doctor-name" label="Full name" error={errors.name?.message} required className="sm:col-span-2">
              <Input {...fieldAria('doctor-name', errors.name?.message)} placeholder="Dr. Anisur Rahman" autoComplete="off" disabled={busy} {...register('name')} />
            </FormField>
            <FormField id="doctor-specialization" label="Specialization" error={errors.specialization?.message} required>
              <Input {...fieldAria('doctor-specialization', errors.specialization?.message)} placeholder="Cardiology" autoComplete="off" disabled={busy} {...register('specialization')} />
            </FormField>
            <FormField id="doctor-hospital" label="Hospital" error={errors.hospital?.message} required>
              <Input {...fieldAria('doctor-hospital', errors.hospital?.message)} placeholder="Square Hospitals Ltd" autoComplete="off" disabled={busy} {...register('hospital')} />
            </FormField>
            <FormField id="doctor-phone" label="Phone number" error={errors.phone?.message} hint="Include the country code, e.g. +8801712345678" required>
              <Input {...fieldAria('doctor-phone', errors.phone?.message, 'hint')} type="tel" placeholder="+880 1712-345678" autoComplete="off" disabled={busy} {...register('phone')} />
            </FormField>
            <FormField id="doctor-email" label="Email address" error={errors.email?.message} required>
              <Input {...fieldAria('doctor-email', errors.email?.message)} type="email" placeholder="doctor@hospital.org" autoComplete="off" disabled={busy} {...register('email')} />
            </FormField>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {busy ? 'Adding…' : 'Add doctor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
