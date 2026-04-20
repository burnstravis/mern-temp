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
        vi.stubGlobal('localStorage', {
            getItem: vi.fn().mockReturnValue(JSON.stringify(mockUser)),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        });
        tokenStorage.retrieveToken.mockReturnValue('mock-token');

        global.fetch = vi.fn((url) => {
            if (url.includes('api/friend-profile')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        friend: { firstName: 'John', lastName: 'Doe', birthday: '1990-01-01' }
                    }),
                });
            }
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

    it('shows a birthday marker when it is the friend birthday', async () => {
        const today = new Date();
        const birthdayValue = `${today.getFullYear() - 30}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        global.fetch.mockImplementation((url) => {
            if (url.includes('api/friend-profile')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        friend: { firstName: 'John', lastName: 'Doe', birthday: birthdayValue }
                    }),
                });
            }
            if (url.includes('api/messages')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ messages: [] }),
                });
            }
            if (url.includes('api/return-random-prompt')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ prompt: { content: 'Birthday prompt' } }),
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

        renderWithRouter();

        const badge = await screen.findByText(/Birthday today/i);
        expect(badge).toBeInTheDocument();
    });

    it('clears the input field after sending a message', async () => {
        global.fetch.mockImplementation((url, init) => {
            if (url.includes('api/friend-profile')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        friend: { firstName: 'John', lastName: 'Doe', birthday: '1990-01-01' }
                    }),
                });
            }
            if (url.includes('api/messages')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        messages: [{ _id: 'm1', text: 'Hello!', senderId: 'friend456', createdAt: new Date().toISOString() }]
                    }),
                });
            }
            if (url.includes('api/messages') && init?.method === 'POST') {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ accessToken: 'new-token' }),
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

        renderWithRouter();

        const input = await screen.findByPlaceholderText(/message/i);
        const sendButton = screen.getByText(/Send/i);

        fireEvent.change(input, { target: { value: 'Testing a new message' } });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(input.value).toBe('');
        });
    });

    it('shows loading state initially', async () => {
        let resolveLoading;
        const loadingPromise = new Promise((resolve) => {
            resolveLoading = resolve;
        });

        global.fetch.mockImplementation((url) => {
            if (url.includes('api/friend-profile')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        friend: { firstName: 'John', lastName: 'Doe', birthday: '1990-01-01' }
                    }),
                });
            }
            if (url.includes('api/messages')) {
                return loadingPromise;
            }
            if (url.includes('api/return-random-prompt')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({})
                });
            }
            if (url.includes('api/conversations')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ conversationId: 'conv789' }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({})
            });
        });

        let connectCallback;
        const { io } = await import('socket.io-client');
        io.mockReturnValue({
            on: vi.fn((event, cb) => {
                if (event === 'connect') connectCallback = cb;
            }),
            emit: vi.fn(),
            off: vi.fn(),
            disconnect: vi.fn(),
        });

        const { act } = await import('@testing-library/react');
        renderWithRouter();

        await act(async () => {
            if (connectCallback) await connectCallback();
        });

        expect(screen.getByText(/Loading\.\.\./i)).toBeInTheDocument();

        await act(async () => {
            resolveLoading({
                ok: true,
                json: async () => ({ messages: [] }),
            });
        });
    });
});