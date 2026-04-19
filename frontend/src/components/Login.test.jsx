import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('jwt-decode', () => ({
    jwtDecode: vi.fn(() => ({ id: '123', firstName: 'Travis', lastName: 'Burns' }))
}));

describe('Login Page Unit Tests', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('shows error message on failed login', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Invalid credentials' }),
        });

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'user1' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpass' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
        });
    });

    it('stores user data and navigates to home on success', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ accessToken: 'fake_token' }),
        });

        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'travis_b' } });
        fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'correctpass' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            const userData = JSON.parse(localStorage.getItem('user_data'));
            expect(userData.firstName).toBe('Travis');
            expect(mockNavigate).toHaveBeenCalledWith('/home');
        });
    });
});