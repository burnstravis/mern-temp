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

    it('updates search text value on change', async () => {
        render(
            <BrowserRouter>
                <AddFriends />
            </BrowserRouter>
        );

        const input = screen.getByPlaceholderText(/Search username/i);

        fireEvent.change(input, { target: { value: 'cool_user' } });

        await waitFor(() => {
            expect(input.value).toBe('cool_user');
        });
    });

    it('displays "No users found" by default with an empty list', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ users: [] }),
        });

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
        // 1. Mock the initial search results
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                users: [{ _id: '456', username: 'target_user' }]
            }),
        });

        render(
            <BrowserRouter>
                <AddFriends />
            </BrowserRouter>
        );

        // 2. Find the "Send" button (Updated from /add/i to /send/i)
        const sendBtn = await screen.findByRole('button', { name: /send/i });

        // 3. Mock the POST request for sending the request
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Request Sent' }),
        });

        fireEvent.click(sendBtn);

        // 4. Verify success message and wait for state to settle (clears act warning)
        await waitFor(() => {
            // Match this text to whatever your API/UI actually displays
            expect(screen.getByText(/Request Sent/i)).toBeInTheDocument();
        });
    });

});