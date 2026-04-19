import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';

describe('Register Page Unit Tests', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
        vi.clearAllMocks();
    });

    it('shows error if passwords do not match', () => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'John' } });
        fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'john@doe.com' } });
        fireEvent.change(screen.getByPlaceholderText('Choose a username'), { target: { value: 'johndoe' } });

        fireEvent.change(screen.getByPlaceholderText('Choose a password'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), { target: { value: 'password456' } });

        const registerBtn = screen.getByRole('button', { name: /register/i });
        fireEvent.click(registerBtn);

        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });

    it('transitions to verification state on successful registration', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ error: '' }),
        });

        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'Travis' } });
        fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Burns' } });
        fireEvent.change(screen.getByPlaceholderText('Enter your email'), { target: { value: 'test@ucf.edu' } });
        fireEvent.change(screen.getByPlaceholderText('Choose a username'), { target: { value: 'travis_b' } });
        fireEvent.change(screen.getByPlaceholderText('Choose a password'), { target: { value: 'StrongPass123' } });
        fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), { target: { value: 'StrongPass123' } });

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(screen.getByText(/Verify Email/i)).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/5-digit code/i)).toBeInTheDocument();
        });
    });
});