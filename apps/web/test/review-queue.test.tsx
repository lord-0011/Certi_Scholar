import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/components/AppShell', () => ({ useMe: () => ({ id: 'v1', name: 'Rahul', email: 'v@example.test', role: 'verifier' }), useDocTypes: () => [] }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import ReviewQueuePage from '@/app/(app)/review/page';

afterEach(cleanup);

describe('review queue', () => {
  const item = (n: number) => ({ id: `doc00000${String(n).padStart(3, '0')}`, documentType: 'identity', status: 'needs_review', reason: 'field_review', pendingFields: 1, assignedTo: null, createdAt: '2026-11-07T10:00:00Z' });
  const fetchMock = vi.fn(async (url: string) => {
    const u = new URL(url, 'http://x');
    if (u.pathname.endsWith('/summary')) return new Response(JSON.stringify({ total: 608, mine: 3, unassigned: 605, pendingFields: 910 }), { status: 200 });
    const page = Number(u.searchParams.get('page'));
    return new Response(JSON.stringify(page === 1 ? [item(1)] : [item(608)]), { status: 200, headers: { 'X-Total-Count': '608' } });
  });
  beforeEach(() => vi.stubGlobal('fetch', fetchMock));
  afterEach(() => vi.unstubAllGlobals());

  it('shows totals for the whole queue and pages to the last case', async () => {
    render(<ReviewQueuePage />);
    expect(await screen.findByText('1–25 of 608 cases')).toBeInTheDocument();
    expect(screen.getByText('608')).toBeInTheDocument(); // open cases, not the 25 on screen
    expect(screen.getByText('605')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Page 25' }));
    await waitFor(() => expect(screen.getByText('601–608 of 608 cases')).toBeInTheDocument());
    expect(fetchMock.mock.calls.map((c) => String(c[0])).some((u) => u.includes('page=25'))).toBe(true);
  });

  it('sends the chosen filters and sort order', async () => {
    render(<ReviewQueuePage />);
    await screen.findByText('1–25 of 608 cases');
    await userEvent.selectOptions(screen.getByLabelText('Filter by assignment'), 'me');
    await userEvent.selectOptions(screen.getByLabelText('Sort order'), 'newest');
    await waitFor(() => expect(String(fetchMock.mock.calls.at(-1)![0])).toMatch(/review-queue\?sort=newest&assigned=me&page=1/));
  });
});
