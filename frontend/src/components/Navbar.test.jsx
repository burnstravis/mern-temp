import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Navbar Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('navigates to the Home page when Home is clicked', () => {
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText(/Home/i));
        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    it('clears localStorage and redirects to login on logout', () => {
        localStorage.setItem('user_data', 'some_user');

        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

        const logoutBtn = screen.getByText(/Logout/i);
        fireEvent.click(logoutBtn);

        expect(localStorage.getItem('user_data')).toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});