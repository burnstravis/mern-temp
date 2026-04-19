import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Notifications from './Notifications';

beforeEach(() => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ _id: 'me_123' }));
    global.fetch = vi.fn();
});

describe('Notifications Page Unit Tests', () => {

    it('renders "No notifications yet" when the list is empty', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ notifications: [] }),
        });

        render(
            <BrowserRouter>
                <Notifications />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument();
        });
    });

    it('displays friend request buttons for new requests', async () => {
        const mockNotif = {
            _id: 'n1',
            type: 'friend_request',
            content: 'John Doe sent you a friend request!',
            isRead: false,
            relatedId: 'f123',
            senderFirstName: 'John',
            senderLastName: 'Doe'
        };

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ notifications: [mockNotif] }),
        });

        render(
            <BrowserRouter>
                <Notifications />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Accept/i)).toBeInTheDocument();
            expect(screen.getByText(/Decline/i)).toBeInTheDocument();
        });
    });

    it('updates UI status when a friend request is accepted', async () => {
        const mockNotif = {
            _id: 'n1',
            type: 'friend_request',
            content: 'John Doe sent you a friend request!',
            isRead: false,
            relatedId: 'f123'
        };

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ notifications: [mockNotif] }),
        });

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Success' }),
        });

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ status: 'success' }),
        });

        render(
            <BrowserRouter>
                <Notifications />
            </BrowserRouter>
        );

        const acceptBtn = await screen.findByText(/Accept/i);
        fireEvent.click(acceptBtn);

        await waitFor(() => {
            expect(screen.getByText(/Friend request accepted/i)).toBeInTheDocument();
        });
    });
});