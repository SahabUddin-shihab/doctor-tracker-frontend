import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Pagination } from '@/components/shared/pagination';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState, ErrorState } from '@/components/shared/states';

describe('SearchInput', () => {
  it('debounces: commits once after the user pauses, trimmed', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchInput value="" onSearch={onSearch} label="Search doctors" delayMs={60} />);

    await user.type(screen.getByRole('searchbox', { name: 'Search doctors' }), '  card');
    await waitFor(() => expect(onSearch).toHaveBeenCalled());
    expect(onSearch).toHaveBeenCalledTimes(1); // one commit for the whole burst of keystrokes
    expect(onSearch).toHaveBeenCalledWith('card');
  });

  it('clears the field with the clear button and reflects external resets', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<SearchInput value="neuro" onSearch={onSearch} label="Search" delayMs={60} />);
    const box = screen.getByRole('searchbox');
    expect(box).toHaveValue('neuro');

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(box).toHaveValue('');
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith(''));

    rerender(<SearchInput value="heart" onSearch={onSearch} label="Search" />); // e.g. back button
    expect(box).toHaveValue('heart');
  });
});

describe('Pagination', () => {
  const meta = { page: 2, limit: 10, total: 25, totalPages: 3 };

  it('shows the visible range and navigates', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination meta={meta} onPageChange={onPageChange} onLimitChange={() => {}} itemLabel="doctors" />);
    expect(screen.getByText('11–20')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('disables previous on the first page and next on the last', () => {
    const { rerender } = render(<Pagination meta={{ ...meta, page: 1 }} onPageChange={() => {}} onLimitChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    rerender(<Pagination meta={{ ...meta, page: 3 }} onPageChange={() => {}} onLimitChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('handles an empty result set', () => {
    render(<Pagination meta={{ page: 1, limit: 10, total: 0, totalPages: 0 }} onPageChange={() => {}} onLimitChange={() => {}} itemLabel="patients" />);
    expect(screen.getByText('No patients')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});

describe('ConfirmDialog', () => {
  const base = { open: true, onOpenChange: () => {}, title: 'Delete patient?', description: 'Rahim Uddin will be removed.', confirmLabel: 'Delete patient' };

  it('requires an explicit click to confirm and offers cancel', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...base} onConfirm={onConfirm} onOpenChange={onOpenChange} />);
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Rahim Uddin will be removed.');
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete patient' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cannot be cancelled or re-confirmed while the request is running', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<ConfirmDialog {...base} onConfirm={onConfirm} onOpenChange={onOpenChange} loading />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /delete patient/i }));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

describe('loading / empty / error states', () => {
  it('ErrorState announces the API message and retries', async () => {
    const onRetry = vi.fn();
    const error = new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 500,
      data: { success: false, message: 'Database unavailable', errors: [] },
    } as never);
    const user = userEvent.setup();
    render(<ErrorState error={error} title="Could not load doctors" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load doctors');
    expect(screen.getByRole('alert')).toHaveTextContent('Database unavailable');
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('EmptyState renders guidance and its call to action', () => {
    render(<EmptyState title="No patients yet" description="Add the first patient." action={<button>Add patient</button>} />);
    expect(screen.getByText('No patients yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add patient' })).toBeInTheDocument();
  });
});
