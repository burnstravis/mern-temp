import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from './ResetPassword';

describe('ResetPassword Page Unit Tests', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
        vi.clearAllMocks();
    });

    it('shows error if passwords do not match', () => {
        render(
            <BrowserRouter>
                <ResetPassword />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Account email'), { target: { value: 'travis@ucf.edu' } });
        fireEvent.change(screen.getByPlaceholderText('Verification Code From Email'), { target: { value: '12345' } });
        fireEvent.change(screen.getByPlaceholderText('Choose a new password'), { target: { value: 'NewPass123' } });
        fireEvent.change(screen.getByPlaceholderText('Re-enter your new password'), { target: { value: 'WrongPass123' } });

        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });

    it('shows success message on successful password reset', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ error: '' }),
        });

        render(
            <BrowserRouter>
                <ResetPassword />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Account email'), { target: { value: 'travis@ucf.edu' } });
        fireEvent.change(screen.getByPlaceholderText('Verification Code From Email'), { target: { value: '12345' } });
        fireEvent.change(screen.getByPlaceholderText('Choose a new password'), { target: { value: 'NewPass123' } });
        fireEvent.change(screen.getByPlaceholderText('Re-enter your new password'), { target: { value: 'NewPass123' } });

        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

        await waitFor(() => {
            expect(screen.getByText(/Password reset! Redirecting.../i)).toBeInTheDocument();
        });
    });
});