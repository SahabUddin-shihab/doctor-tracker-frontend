import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorFormDialog } from '@/components/doctors/doctor-form-dialog';

const mutateAsync = vi.fn();
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast }));
vi.mock('@/features/doctors/api', () => ({
  useCreateDoctor: () => ({ mutateAsync, isPending: false }),
}));

beforeEach(() => vi.clearAllMocks());

const fill = async (user: ReturnType<typeof userEvent.setup>, overrides: Partial<Record<string, string>> = {}) => {
  const values = { 'Full name': 'Dr. Ayesha Khan', Specialization: 'Cardiology', Hospital: 'Square Hospital', 'Phone number': '+880 1712-345678', 'Email address': 'ayesha@hospital.org', ...overrides };
  for (const [label, value] of Object.entries(values)) {
    const field = screen.getByLabelText(new RegExp(label, 'i'));
    await user.clear(field);
    if (value) await user.type(field, value);
  }
};

describe('DoctorFormDialog', () => {
  it('requires every field and shows a message per field', async () => {
    const user = userEvent.setup();
    render(<DoctorFormDialog open onOpenChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Add doctor' }));

    expect(await screen.findByText('Full name is required')).toBeInTheDocument();
    expect(screen.getByText('Specialization is required')).toBeInTheDocument();
    expect(screen.getByText('Hospital is required')).toBeInTheDocument();
    expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('validates the email format and phone number', async () => {
    const user = userEvent.setup();
    render(<DoctorFormDialog open onOpenChange={() => {}} />);
    await fill(user, { 'Phone number': 'abc', 'Email address': 'not-an-email' });
    await user.click(screen.getByRole('button', { name: 'Add doctor' }));
    expect(await screen.findByText('Enter a valid phone number (7–15 digits)')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-invalid', 'true');
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('submits valid data, announces success, closes and notifies the parent', async () => {
    mutateAsync.mockResolvedValue({ id: '1', name: 'Dr. Ayesha Khan' });
    const onOpenChange = vi.fn();
    const onCreated = vi.fn();
    const user = userEvent.setup();
    render(<DoctorFormDialog open onOpenChange={onOpenChange} onCreated={onCreated} />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Add doctor' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
    expect(mutateAsync.mock.calls[0]![0]).toEqual({
      name: 'Dr. Ayesha Khan',
      specialization: 'Cardiology',
      hospital: 'Square Hospital',
      phone: '+880 1712-345678',
      email: 'ayesha@hospital.org',
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast.success).toHaveBeenCalledWith('Doctor added', expect.anything());
    expect(onCreated).toHaveBeenCalled();
  });

  it('shows the server’s duplicate-email error on the email field', async () => {
    mutateAsync.mockRejectedValue(
      new AxiosError('conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 409,
        data: { success: false, message: 'A doctor with this email already exists', errors: [{ path: 'email', message: 'A doctor with this email already exists' }] },
      } as never),
    );
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<DoctorFormDialog open onOpenChange={onOpenChange} />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Add doctor' }));

    expect(await screen.findByText('A doctor with this email already exists')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-invalid', 'true');
    expect(onOpenChange).not.toHaveBeenCalledWith(false); // dialog stays open so the user can correct it
    expect(toast.error).toHaveBeenCalled();
  });

  it('disables inputs and buttons while submitting', async () => {
    let resolve!: (v: unknown) => void;
    mutateAsync.mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<DoctorFormDialog open onOpenChange={() => {}} />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Add doctor' }));

    const busy = await screen.findByRole('button', { name: /adding/i });
    expect(busy).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByLabelText(/full name/i)).toBeDisabled();
    resolve({ id: '1', name: 'x' });
  });

  it('starts empty each time it is opened', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<DoctorFormDialog open onOpenChange={() => {}} />);
    await user.type(screen.getByLabelText(/full name/i), 'Dr. Partial');
    rerender(<DoctorFormDialog open={false} onOpenChange={() => {}} />);
    rerender(<DoctorFormDialog open onOpenChange={() => {}} />);
    await waitFor(() => expect(screen.getByLabelText(/full name/i)).toHaveValue(''));
  });
});
