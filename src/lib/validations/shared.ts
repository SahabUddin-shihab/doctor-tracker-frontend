import { z } from 'zod';

/*
 * These rules intentionally mirror the API's schemas (apps/api/src/utils/validation.ts) so users get
 * instant feedback. They are a UX convenience only: the API re-validates everything and is the
 * single source of truth, and its field errors are mapped back onto the forms.
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .refine((value) => /^\+?\d{7,15}$/.test(value.replace(/[\s\-().]/g, '')), 'Enter a valid phone number (7–15 digits)');

export const emailSchema = z.string().trim().min(1, 'Email is required').pipe(z.email('Enter a valid email address'));

export const requiredText = (label: string, min = 2, max = 100) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);
