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
    // PatientInput/PatientSummaryBanner are implemented (Task 15), not stubs: assert their real
    // rendered output instead of a testid. The banner stays hidden until weight/age is entered.
    expect(screen.getByRole('heading', { name: 'ข้อมูลผู้ป่วย' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^drug-(group-)?card-/).length).toBeGreaterThan(0);
    // SelectedDrugPanel is implemented (Task 18): with no drug selected it renders its empty
    // state rather than the old stub.
    expect(screen.getByTestId('selected-drug-panel-empty')).toBeInTheDocument();
    expect(screen.getByTestId('stub-app-footer')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-pals-view')).not.toBeInTheDocument();
  });

  test('shows the PALSView stub (and hides search/list) when view=pals', () => {
    renderWithProviders(<Layout />, { calculator: { view: 'pals' } });
    expect(screen.getByTestId('stub-pals-view')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^drug-(group-)?card-/)).not.toBeInTheDocument();
  });

  test('shows the SEView stub (and hides search/list) when view=se', () => {
    renderWithProviders(<Layout />, { calculator: { view: 'se' } });
    expect(screen.getByTestId('stub-se-view')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^drug-(group-)?card-/)).not.toBeInTheDocument();
  });

  test('switching language flips document.documentElement.lang and keeps stub sections mounted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Layout />);
    await user.click(screen.getByRole('radio', { name: 'EN' }));
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getAllByTestId(/^drug-(group-)?card-/).length).toBeGreaterThan(0);
    expect(screen.getByTestId('selected-drug-panel-empty')).toBeInTheDocument();
  });
});
