import { z } from 'zod';
import { emailSchema, phoneSchema, requiredText } from './shared';

export const doctorSchema = z.object({
  name: requiredText('Full name'),
  specialization: requiredText('Specialization'),
  hospital: requiredText('Hospital', 2, 150),
  phone: phoneSchema,
  email: emailSchema,
});

export type DoctorValues = z.infer<typeof doctorSchema>;

export const doctorDefaults: DoctorValues = { name: '', specialization: '', hospital: '', phone: '', email: '' };
