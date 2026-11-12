'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Info } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormField, fieldAria } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getErrorMessage, getFieldErrors } from '@/lib/api/client';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { loginSchema, type LoginValues } from '@/lib/validations/auth';
import { useAuth } from '@/providers/auth-provider';

export function LoginForm() {
  const { status, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = safeRedirectPath(searchParams.get('next'));
  const expired = searchParams.get('reason') === 'expired';

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  // Already signed in (e.g. opened /login in a second tab): skip the form.
  useEffect(() => {
    if (status === 'authenticated') router.replace(destination);
  }, [status, router, destination]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      toast.success('Welcome back', { description: 'You are now signed in.' });
      router.replace(destination);
    } catch (error) {
      for (const fieldError of getFieldErrors(error)) {
        if (fieldError.path === 'email' || fieldError.path === 'password') {
          setError(fieldError.path, { message: fieldError.message });
        }
      }
      setFormError(getErrorMessage(error, 'Unable to sign in. Please try again.'));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" aria-label="Sign in">
      {expired && !formError ? (
        <div role="status" className="flex items-start gap-2.5 rounded-lg border bg-muted/60 p-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          Your session expired. Sign in again to continue.
        </div>
      ) : null}

      {formError ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {formError}
        </div>
      ) : null}

      <FormField id="email" label="Email address" error={errors.email?.message} required>
        <Input
          {...fieldAria('email', errors.email?.message)}
          type="email"
          autoComplete="username"
          placeholder="admin@hospital.org"
          autoFocus
          {...register('email')}
        />
      </FormField>

      <FormField id="password" label="Password" error={errors.password?.message} required>
        <div className="relative">
          <Input
            {...fieldAria('password', errors.password?.message)}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="pr-11"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        </div>
      </FormField>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
        <input type="checkbox" className="size-4 rounded border-input accent-[var(--primary)]" {...register('rememberMe')} />
        Keep me signed in for 7 days
      </label>

      <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
