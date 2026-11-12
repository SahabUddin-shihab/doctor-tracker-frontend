import { z } from 'zod';
import { emailSchema } from './shared';

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
  rememberMe: z.boolean(),
});

export type LoginValues = z.infer<typeof loginSchema>;
