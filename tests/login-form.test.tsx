import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from '@/components/auth/login-form';

const replace = vi.fn();
const login = vi.fn();
let status = 'unauthenticated';
let search = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ status, login }),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const apiError = (httpStatus: number, message: string) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: httpStatus,
    data: { success: false, message, errors: [] },
  } as never);

beforeEach(() => {
  vi.clearAllMocks();
  status = 'unauthenticated';
  search = '';
});

describe('LoginForm', () => {
  it('shows validation messages and does not call the API for empty or invalid input', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    const field = document.querySelector<HTMLInputElement>('#password')!;
    expect(field.type).toBe('password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(field.type).toBe('text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(field.type).toBe('password');
  });

  it('submits trimmed credentials, shows a loading state and redirects to the requested page', async () => {
    search = 'next=%2Fpatients';
    let resolve!: () => void;
    login.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email address/i), '  admin@hospital.org ');
    await user.type(document.querySelector<HTMLInputElement>('#password')!, 'Secret#12345');
    await user.click(screen.getByLabelText(/keep me signed in/i));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const busy = await screen.findByRole('button', { name: /signing in/i });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');

    resolve();
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/patients'));
    expect(login).toHaveBeenCalledWith({ email: 'admin@hospital.org', password: 'Secret#12345', rememberMe: true });
  });

  it('never redirects to an external address from the ?next parameter', async () => {
    search = 'next=https%3A%2F%2Fevil.example';
    login.mockResolvedValue({});
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email address/i), 'admin@hospital.org');
    await user.type(document.querySelector<HTMLInputElement>('#password')!, 'x');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows the API error for wrong credentials and re-enables the form', async () => {
    login.mockRejectedValue(apiError(401, 'Invalid email or password'));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email address/i), 'admin@hospital.org');
    await user.type(document.querySelector<HTMLInputElement>('#password')!, 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('explains a network failure instead of a generic error', async () => {
    login.mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email address/i), 'admin@hospital.org');
    await user.type(document.querySelector<HTMLInputElement>('#password')!, 'x');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot reach the server/i);
  });

  it('tells the user when their session expired', () => {
    search = 'reason=expired';
    render(<LoginForm />);
    expect(screen.getByRole('status')).toHaveTextContent(/session expired/i);
  });

  it('skips the form when already signed in', async () => {
    status = 'authenticated';
    render(<LoginForm />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
  });
});
