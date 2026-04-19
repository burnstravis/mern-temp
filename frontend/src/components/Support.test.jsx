import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Support from './Support';

beforeEach(() => {
    const mockUser = JSON.stringify({ firstName: 'Travis', lastName: 'Burns' });
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockUser);
    global.fetch = vi.fn(); // Mock API calls
});

describe('Support Page Unit Tests', () => {

    it('disables the send button when textarea is empty', () => {
        render(
            <BrowserRouter>
                <Support />
            </BrowserRouter>
        );

        const button = screen.getByRole('button', { name: /send to friends/i });
        expect(button).toBeDisabled();
    });

    it('enables the send button when text is entered', () => {
        render(
            <BrowserRouter>
                <Support />
            </BrowserRouter>
        );

        const textarea = screen.getByPlaceholderText(/Tell your friends/i);
        const button = screen.getByRole('button', { name: /send to friends/i });

        fireEvent.change(textarea, { target: { value: 'I need some motivation!' } });
        expect(button).not.toBeDisabled();
    });

    it('shows success message after sending request', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ requestId: '123' }),
        });

        render(
            <BrowserRouter>
                <Support />
            </BrowserRouter>
        );

        const textarea = screen.getByPlaceholderText(/Tell your friends/i);
        const button = screen.getByRole('button', { name: /send to friends/i });

        fireEvent.change(textarea, { target: { value: 'Help me study!' } });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/Your request has been sent to all your friends!/i)).toBeInTheDocument();
        });
    });
});