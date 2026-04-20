import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AddFriends from './AddFriends';

beforeEach(() => {
    vi.clearAllMocks(); // Clean slate for every test
    const mockUser = JSON.stringify({ _id: '123', firstName: 'Travis', lastName: 'Burns' });
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockUser);

    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ users: [] }),
    });
});

describe('AddFriends Page Unit Tests', () => {

    it('updates search text value on change', async () => {
        render(
            <BrowserRouter>
                <AddFriends />
            </BrowserRouter>
        );

        const input = screen.getByPlaceholderText(/Search username/i);
        fireEvent.change(input, { target: { value: 'cool_user' } });

        expect(input.value).toBe('cool_user');
    });

    it('displays "No users found" by default with an empty list', async () => {
        render(
            <BrowserRouter>
                <AddFriends />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/No users found/i)).toBeInTheDocument();
        });
    });

    it('shows success message after sending a friend request', async () => {
        global.fetch = vi.fn().mockImplementation((url) => {
            if (url.includes('api/friends')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ friends: [] }) // Response for fetchFriends
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ users: [] }) // Default for fetchUsers
            });
        });

        render(
            <BrowserRouter>
                <AddFriends />
            </BrowserRouter>
        );

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                users: [{ _id: '456', username: 'target_user', firstName: 'Target', lastName: 'User' }]
            }),
        });

        const input = screen.getByPlaceholderText(/Search username/i);
        fireEvent.change(input, { target: { value: 'target_user' } });

        const searchBtn = screen.getByRole('button', { name: /find/i });
        fireEvent.click(searchBtn);

        const sendBtn = await screen.findByRole('button', { name: /send/i });

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ friendshipId: 'mock_id', message: 'Friend request sent to @target_user!' }),
        });

        fireEvent.click(sendBtn);

        await waitFor(() => {
            expect(screen.getByText(/Friend request sent to @target_user!/i)).toBeInTheDocument();
        });
    });

});