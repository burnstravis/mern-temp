import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Conversation from './Conversation';

vi.mock('socket.io-client', () => ({
    io: vi.fn(() => ({
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        disconnect: vi.fn(),
    })),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ friendId: 'friend_99' }),
        useLocation: () => ({ state: { name: 'John Doe', conversationId: 'conv_123' } }),
    };
});

beforeEach(() => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ _id: 'me_123' }));
    global.fetch = vi.fn();
});

describe('Conversation Page Unit Tests', () => {

    it('renders the friend name after loading', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ messages: [], conversationId: 'conv_123' }),
        });

        render(
            <BrowserRouter>
                <Conversation />
            </BrowserRouter>
        );

        await waitForElementToBeRemoved(() => screen.queryByText(/Loading.../i));

        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    it('shows the "Today\'s Prompt" section after loading', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ messages: [], conversationId: 'conv_123' }),
        });

        render(
            <BrowserRouter>
                <Conversation />
            </BrowserRouter>
        );

        await waitForElementToBeRemoved(() => screen.queryByText(/Loading.../i));
        expect(screen.getByText(/Today's Prompt/i)).toBeInTheDocument();
    });

    it('disables the send button when the input is empty', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ messages: [], conversationId: 'conv_123' }),
        });

        render(
            <BrowserRouter>
                <Conversation />
            </BrowserRouter>
        );

        await waitForElementToBeRemoved(() => screen.queryByText(/Loading.../i));

        const sendButton = screen.getByRole('button', { name: /send/i });
        expect(sendButton).toBeDisabled();
    });
});