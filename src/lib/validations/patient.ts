import { z } from 'zod';
import { emailSchema, phoneSchema, requiredText } from './shared';

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

export const patientSchema = z.object({
  name: requiredText('Name'),
  // Optional: an empty string means "no email".
  email: z.union([z.literal(''), emailSchema]),
  phone: phoneSchema,
  age: z
    .number({ error: 'Enter the patient’s age' })
    .int('Age must be a whole number')
    .min(0, 'Age cannot be negative')
    .max(130, 'Enter a realistic age'),
  gender: z.enum(['male', 'female', 'other'], { error: 'Select a gender' }),
  condition: requiredText('Medical condition', 2, 150),
  notes: z.string().trim().max(2000, 'Notes must be at most 2000 characters'),
  doctorId: z.string().min(1, 'Select a doctor'),
});

/** Form values: `age` and `gender` are empty until the user fills them in. */
export type PatientFormValues = Omit<z.infer<typeof patientSchema>, 'age' | 'gender'> & {
  age: number | undefined;
  gender: z.infer<typeof patientSchema>['gender'] | undefined;
};
export type PatientValues = z.infer<typeof patientSchema>;

export const patientDefaults = (doctorId = ''): PatientFormValues => ({
  name: '',
  email: '',
  phone: '',
  age: undefined,
  gender: undefined,
  condition: '',
  notes: '',
  doctorId,
});
