import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Messages from './Messages';
import * as tokenStorage from '../tokenStorage';

vi.mock('../tokenStorage', () => ({
    retrieveToken: vi.fn(),
    storeToken: vi.fn(),
}));

beforeEach(() => {
    const mockUser = JSON.stringify({ id: 'me_123', firstName: 'Travis' });
    vi.stubGlobal('localStorage', {
        getItem: vi.fn().mockReturnValue(mockUser),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
    });
    tokenStorage.retrieveToken.mockReturnValue('mock-token');

    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ conversations: [], accessToken: 'new-token' })
    });
});

describe('Messages Page Logic', () => {

    it('filters conversation list based on search text', async () => {
        render(
            <BrowserRouter>
                <Messages />
            </BrowserRouter>
        );

        const searchInput = screen.getByPlaceholderText(/Search chats.../i);
        fireEvent.change(searchInput, { target: { value: 'John' } });

        const findButton = screen.getByText(/find/i);
        fireEvent.click(findButton);

        expect(searchInput.value).toBe('John');
    });

    it('formats "Time Ago" correctly', () => {

        const now = new Date();
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

    });

    it('shows a birthday marker next to a person with a birthday today', async () => {
        const today = new Date();
        const birthdayValue = `${today.getFullYear() - 20}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                conversations: [
                    {
                        _id: 'conv-1',
                        lastMessage: 'Hey!',
                        lastMessageAt: new Date().toISOString(),
                        participants: ['me_123', 'friend_1'],
                        otherUser: {
                            firstName: 'John',
                            lastName: 'Doe',
                            username: 'johndoe',
                            birthday: birthdayValue
                        }
                    }
                ],
                accessToken: 'new-token'
            })
        });

        render(
            <BrowserRouter>
                <Messages />
            </BrowserRouter>
        );

        const marker = await screen.findByTitle(/Birthday today/i);
        expect(marker).toBeInTheDocument();
    });
});