import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import App, { Layout } from '@/App';
import { renderWithProviders } from './utils';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App data loading (via fetch)', () => {
  test('shows three skeleton cards while the dataset is loading', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    render(<App />);
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(3);
  });

  test('shows an ErrorCard with error.dataLoad when the dataset fails validation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ drugs: [] }),
        }),
      ),
    );
    render(<App />);
    await waitFor(() => expect(screen.getByTestId('error-card')).toBeInTheDocument());
    expect(screen.getByText('โหลดข้อมูลไม่สำเร็จ')).toBeInTheDocument();
  });
});

describe('Layout (via renderWithProviders, real dataset)', () => {
  test('renders every stub section when the dataset is ready and view is "all"', () => {
    renderWithProviders(<Layout />);
    expect(screen.getByTestId('stub-patient-input')).toBeInTheDocument();
    expect(screen.getByTestId('stub-patient-summary-banner')).toBeInTheDocument();
    expect(screen.getByTestId('stub-drug-search')).toBeInTheDocument();
    expect(screen.getByTestId('stub-category-chips')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^drug-(group-)?card-/).length).toBeGreaterThan(0);
    expect(screen.getByTestId('stub-selected-drug-panel')).toBeInTheDocument();
    expect(screen.getByTestId('stub-app-footer')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-pals-view')).not.toBeInTheDocument();
  });

  test('shows the PALSView stub (and hides search/list) when view=pals', () => {
    renderWithProviders(<Layout />, { calculator: { view: 'pals' } });
    expect(screen.getByTestId('stub-pals-view')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-drug-search')).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^drug-(group-)?card-/)).not.toBeInTheDocument();
  });

  test('shows the SEView stub (and hides search/list) when view=se', () => {
    renderWithProviders(<Layout />, { calculator: { view: 'se' } });
    expect(screen.getByTestId('stub-se-view')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-drug-search')).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^drug-(group-)?card-/)).not.toBeInTheDocument();
  });

  test('switching language flips document.documentElement.lang and keeps stub sections mounted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Layout />);
    await user.click(screen.getByRole('radio', { name: 'EN' }));
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getAllByTestId(/^drug-(group-)?card-/).length).toBeGreaterThan(0);
    expect(screen.getByTestId('stub-selected-drug-panel')).toBeInTheDocument();
  });
});
