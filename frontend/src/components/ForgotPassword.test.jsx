import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

describe('ForgotPassword Page Unit Tests', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
        vi.clearAllMocks();
    });

    it('shows error for invalid email format', () => {
        render(
            <BrowserRouter>
                <ForgotPassword />
            </BrowserRouter>
        );

        const input = screen.getByPlaceholderText(/Enter your email/i);
        fireEvent.change(input, { target: { value: 'not-an-email' } });

        fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });

    it('shows success message and navigates on valid submission', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ error: '' }),
        });

        render(
            <BrowserRouter>
                <ForgotPassword />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), { target: { value: 'travis@ucf.edu' } });
        fireEvent.click(screen.getByRole('button', { name: /Send Reset Link/i }));

        await waitFor(() => {
            expect(screen.getByText(/If an account exists, we sent a reset link/i)).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/resetPassword');
        }, { timeout: 2000 });
    });
});