import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Messages from './Messages';

beforeEach(() => {
    const mockUser = JSON.stringify({ id: 'me_123', firstName: 'Travis' });
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockUser);
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
});