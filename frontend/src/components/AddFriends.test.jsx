import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AddFriends from './AddFriends';

beforeEach(() => {
    const mockUser = JSON.stringify({ _id: '123', firstName: 'Travis', lastName: 'Burns' });
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockUser);

    // Mock the global fetch API
    global.fetch = vi.fn();
});

describe('AddFriends Page Unit Tests', () => {

    it('updates search text value on change', () => {
        render(
            <BrowserRouter>
                <AddFriends />
            </BrowserRouter>
        );

        const input = screen.getByPlaceholderText(/Search username/i);
        fireEvent.change(input, { target: { value: 'cool_user' } });

        expect(input.value).toBe('cool_user');
    });

    it('displays "No users found" by default with an empty list', () => {
        render(
            <BrowserRouter>
                <AddFriends />
            </BrowserRouter>
        );

        expect(screen.getByText(/No users found/i)).toBeInTheDocument();
    });

    it('shows success message after sending a friend request', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ friendshipId: 'req_123', users: [] }),
        });

        render(
            <BrowserRouter>
                <AddFriends />
            </BrowserRouter>
        );

    });
});