import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PatientFormDialog } from '@/components/patients/patient-form-dialog';
import type { Patient } from '@/types';

const create = vi.fn();
const update = vi.fn();
const addToDoctor = vi.fn();
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock('sonner', () => ({ toast }));
vi.mock('@/features/patients/api', () => ({
  useCreatePatient: () => ({ mutateAsync: create, isPending: false }),
  useUpdatePatient: () => ({ mutateAsync: update, isPending: false }),
}));
vi.mock('@/features/doctors/api', () => ({
  useAddPatientToDoctor: () => ({ mutateAsync: addToDoctor, isPending: false }),
  useDoctorOptions: () => ({
    isPending: false,
    data: [
      { id: 'd1', name: 'Dr. Alice Heart', specialization: 'Cardiology', hospital: 'Alpha' },
      { id: 'd2', name: 'Dr. Bob Brain', specialization: 'Neurology', hospital: 'Beta' },
    ],
  }),
}));

const existing: Patient = {
  id: 'p1',
  name: 'Rahim Uddin',
  email: 'rahim@example.com',
  phone: '01712345678',
  age: 42,
  gender: 'male',
  condition: 'Hypertension',
  notes: 'Follow up in May',
  doctor: { id: 'd1', name: 'Dr. Alice Heart', specialization: 'Cardiology' },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => vi.clearAllMocks());

describe('PatientFormDialog — create', () => {
  it('validates required fields, age and the doctor selection', async () => {
    const user = userEvent.setup();
    render(<PatientFormDialog open onOpenChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Add patient' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Phone number is required')).toBeInTheDocument();
    expect(screen.getByText('Enter the patient’s age')).toBeInTheDocument();
    expect(screen.getByText('Select a gender')).toBeInTheDocument();
    expect(screen.getByText('Medical condition is required')).toBeInTheDocument();
    expect(screen.getAllByRole('alert').map((e) => e.textContent)).toContain('Select a doctor'); // the placeholder uses the same words
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    ['-3', 'Age cannot be negative'],
    ['131', 'Enter a realistic age'],
    ['40.5', 'Age must be a whole number'],
  ])('rejects age %s', async (age, message) => {
    const user = userEvent.setup();
    render(<PatientFormDialog open onOpenChange={() => {}} />);
    await user.type(screen.getByLabelText(/^age/i), age);
    await user.click(screen.getByRole('button', { name: 'Add patient' }));
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it('treats the email as optional but validates it when present', async () => {
    const user = userEvent.setup();
    render(<PatientFormDialog open onOpenChange={() => {}} />);
    await user.type(screen.getByLabelText(/email address/i), 'bad');
    await user.click(screen.getByRole('button', { name: 'Add patient' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('shows the doctor as fixed when adding from a doctor’s page', () => {
    render(
      <PatientFormDialog
        open
        onOpenChange={() => {}}
        lockDoctor
        doctor={{ id: 'd1', name: 'Dr. Alice Heart', specialization: 'Cardiology', hospital: 'Alpha' }}
      />,
    );
    const trigger = document.querySelector<HTMLButtonElement>('#patient-doctor')!;
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveTextContent('Dr. Alice Heart');
  });
});

describe('PatientFormDialog — edit', () => {
  it('pre-populates every field with the existing record', () => {
    render(<PatientFormDialog open onOpenChange={() => {}} patient={existing} />);
    expect(screen.getByRole('heading', { name: 'Edit patient' })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Rahim Uddin');
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('01712345678');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('rahim@example.com');
    expect(screen.getByLabelText(/^age/i)).toHaveValue(42);
    expect(screen.getByLabelText(/medical condition/i)).toHaveValue('Hypertension');
    expect(screen.getByLabelText(/additional notes/i)).toHaveValue('Follow up in May');
    expect(document.querySelector('#patient-gender')).toHaveTextContent('Male');
    expect(document.querySelector('#patient-doctor')).toHaveTextContent('Dr. Alice Heart');
  });

  it('sends the edited values to the update endpoint and closes', async () => {
    update.mockResolvedValue(existing);
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<PatientFormDialog open onOpenChange={onOpenChange} patient={existing} />);

    const age = screen.getByLabelText(/^age/i);
    await user.clear(age);
    await user.type(age, '43');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update.mock.calls[0]![0]).toMatchObject({ name: 'Rahim Uddin', age: 43, gender: 'male', doctorId: 'd1', condition: 'Hypertension' });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(toast.success).toHaveBeenCalledWith('Patient updated', expect.anything());
  });

  it('keeps the dialog open and reports a failed update', async () => {
    update.mockRejectedValue(
      new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 422,
        data: { success: false, message: 'Selected doctor does not exist', errors: [{ path: 'doctorId', message: 'Selected doctor does not exist' }] },
      } as never),
    );
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<PatientFormDialog open onOpenChange={onOpenChange} patient={existing} />);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Selected doctor does not exist')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled(); // user can retry
  });
});
