import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Friends from './Friends';

beforeEach(() => {
    const mockUser = JSON.stringify({ _id: '123', firstName: 'Travis' });
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(mockUser);
});

describe('Friends Component Unit Tests', () => {
    it('should render the Friends List header', () => {
        render(
            <BrowserRouter>
                <Friends />
            </BrowserRouter>
        );
        expect(screen.getByText(/Friends List/i)).toBeInTheDocument();
    });

    it('should display loading text on initial mount', () => {
        render(
            <BrowserRouter>
                <Friends />
            </BrowserRouter>
        );
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });
});