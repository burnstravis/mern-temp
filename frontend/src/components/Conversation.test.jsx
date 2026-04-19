import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Conversation from './Conversation';
import * as tokenStorage from '../tokenStorage';

vi.mock('../tokenStorage', () => ({
    retrieveToken: vi.fn(),
    storeToken: vi.fn(),
}));

vi.mock('socket.io-client', () => ({
    io: vi.fn(() => ({
        on: vi.fn(),
        emit: vi.fn(),
        off: vi.fn(),
        disconnect: vi.fn(),
    })),
}));

describe('Conversation Component Unit Tests', () => {
    const mockUser = { _id: 'user123', firstName: 'Travis', lastName: 'Burns' };
    const mockFriendId = 'friend456';
    const mockState = { name: 'John Doe', conversationId: 'conv789' };

    beforeEach(() => {
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockUser));
        tokenStorage.retrieveToken.mockReturnValue('mock-token');

        global.fetch = vi.fn((url) => {
            if (url.includes('api/messages')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        messages: [{ _id: 'm1', text: 'Hello!', senderId: 'friend456', createdAt: new Date().toISOString() }]
                    }),
                });
            }
            if (url.includes('api/return-random-prompt')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        prompt: { content: 'If you were a ghost, how would you mildly inconvenience people?' }
                    }),
                });
            }
            if (url.includes('api/conversations')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ conversationId: 'conv789' }),
                });
            }
            return Promise.reject(new Error('Unknown API call'));
        });
    });

    const renderWithRouter = () => {
        return render(
            <MemoryRouter initialEntries={[{ pathname: `/conversation/${mockFriendId}`, state: mockState }]}>
                <Routes>
                    <Route path="/conversation/:friendId" element={<Conversation />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('renders the friend name and the daily prompt after loading', async () => {
        renderWithRouter();

        const friendName = await screen.findByText('John Doe');
        expect(friendName).toBeInTheDocument();

        const prompt = await screen.findByText(/If you were a ghost/i);
        expect(prompt).toBeInTheDocument();
    });

    it('clears the input field after sending a message', async () => {
        renderWithRouter();

        const input = await screen.findByPlaceholderText(/message/i);
        const sendButton = screen.getByText(/Send/i);

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ accessToken: 'new-token' }),
        });

        fireEvent.change(input, { target: { value: 'Testing a new message' } });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(input.value).toBe('');
        });
    });

    it('shows loading state initially', async () => {
        renderWithRouter();

        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
        });
    });
});