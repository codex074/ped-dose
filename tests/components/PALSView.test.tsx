import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { PALSView } from '@/components/pals/PALSView';
import { renderWithProviders } from '../utils';

describe('PALSView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders the 3 PALS algorithm cards in dataset order', () => {
    renderWithProviders(<PALSView />, { calculator: { weight: 20, weightInput: '20' } });
    const view = screen.getByTestId('pals-view');
    const cards = within(view).getAllByRole('heading', { level: 2 });
    expect(cards).toHaveLength(3);
    expect(screen.getByTestId('pals-card-cardiac_arrest')).toBeInTheDocument();
    expect(screen.getByTestId('pals-card-tachy_pulse')).toBeInTheDocument();
    expect(screen.getByTestId('pals-card-brady_pulse')).toBeInTheDocument();
  });

  test('with weight 20, cardiac arrest card shows an epinephrine row containing 0.2 mg', () => {
    renderWithProviders(<PALSView />, { calculator: { weight: 20, weightInput: '20' } });
    const card = screen.getByTestId('pals-card-cardiac_arrest');
    const row = within(card).getByTestId('drug-mini-epinephrine_arrest');
    expect(row).toHaveTextContent('0.2 mg');
  });

  test('with weight 20, cardiac arrest card shows the 2 J/kg energy row as 40 J', () => {
    renderWithProviders(<PALSView />, { calculator: { weight: 20, weightInput: '20' } });
    const card = screen.getByTestId('pals-card-cardiac_arrest');
    expect(within(card).getByText('40 J')).toBeInTheDocument();
  });

  test('without weight, the cardiac arrest energy row shows the J/kg range', () => {
    renderWithProviders(<PALSView />);
    const card = screen.getByTestId('pals-card-cardiac_arrest');
    expect(within(card).getByText('2 J/kg')).toBeInTheDocument();
  });

  test('the drug rule note (max/frequency) is rendered for epinephrine_arrest', () => {
    renderWithProviders(<PALSView />, { calculator: { weight: 20, weightInput: '20' } });
    const card = screen.getByTestId('pals-card-cardiac_arrest');
    const row = within(card).getByTestId('drug-mini-epinephrine_arrest');
    // formatRule('mg_per_kg_per_dose') with only maxMg -> base + "(สูงสุด {max} mg/dose)" (th).
    expect(row).toHaveTextContent('0.01 mg/kg/dose');
    expect(row).toHaveTextContent('(สูงสุด 1 mg/dose)');
    expect(row).toHaveTextContent('Q3-5 min during arrest');
  });

  test('the min-dose variant of the rule note is rendered for atropine_brady', () => {
    renderWithProviders(<PALSView />, { calculator: { weight: 20, weightInput: '20' } });
    const card = screen.getByTestId('pals-card-brady_pulse');
    const row = within(card).getByTestId('drug-mini-atropine_brady');
    expect(row).toHaveTextContent('(ต่ำสุด 0.1 mg)');
    expect(row).toHaveTextContent('(สูงสุด 0.5 mg/dose)');
  });

  test('without weight, a drug mini row shows the needs-weight text', () => {
    renderWithProviders(<PALSView />);
    const card = screen.getByTestId('pals-card-cardiac_arrest');
    const row = within(card).getByTestId('drug-mini-epinephrine_arrest');
    expect(row).toHaveTextContent('กรอกน้ำหนักเพื่อคำนวณ');
  });

  test('renders the decision tree question and YES/NO branches for each card', () => {
    renderWithProviders(<PALSView />);
    const card = screen.getByTestId('pals-card-cardiac_arrest');
    expect(within(card).getByText(/❓/)).toBeInTheDocument();
    expect(within(card).getByText('ใช่')).toBeInTheDocument();
    expect(within(card).getByText('ไม่ใช่')).toBeInTheDocument();
  });

  test('renders the external AHA figure link with target=_blank and rel=noopener noreferrer', () => {
    renderWithProviders(<PALSView />);
    const card = screen.getByTestId('pals-card-cardiac_arrest');
    const link = within(card).getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('localizes to English when lang=en', () => {
    renderWithProviders(<PALSView />, { lang: 'en' });
    const card = screen.getByTestId('pals-card-cardiac_arrest');
    expect(within(card).getByText('Yes')).toBeInTheDocument();
    expect(within(card).getByText('No')).toBeInTheDocument();
  });

  test('shows the empty state when the PALS dataset has no algorithms', () => {
    renderWithProviders(<PALSView />, {
      dataset: {
        _meta: {
          version: '0',
          last_updated: '',
          scope: '',
          primary_source: '',
          disclaimer: '',
        },
        categories: [],
        drugs: [],
        pals_algorithms: [],
        se_algorithm: {
          id: 'convulsive_se',
          title: '',
          subtitle: '',
          icon: '',
          time_stages: [],
          decision_label: '',
          citation: '',
          figure_url: '',
          figure_label: '',
        },
      },
    });
    expect(screen.getByTestId('pals-empty')).toBeInTheDocument();
  });
});
