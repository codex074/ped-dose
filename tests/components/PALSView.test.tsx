import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { translate } from '@/i18n';
import { formatRule } from '@/i18n/formatRule';
import { drugsEn, drugsTh } from '@/i18n/drugs';
import { localizeDrug } from '@/i18n/useDrugText';
import { PALSView } from '@/components/pals/PALSView';
import { realDataset, renderWithProviders } from '../utils';

/**
 * Assertions in this file derive their expected strings from the same localization functions
 * the components use (`formatRule`, `localizeDrug`, `translate`) rather than hardcoding
 * translated text, so they stay correct as drug/algorithm translations
 * (src/i18n/drugs/, src/i18n/algorithms/) are filled in over time.
 */
function findDrug(id: string) {
  const drug = realDataset.drugs.find((d) => d.id === id);
  if (!drug) throw new Error(`fixture drug not found: ${id}`);
  return drug;
}

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

    const canonical = findDrug('epinephrine_arrest');
    const t = (key: string, params?: Record<string, string | number>) =>
      translate('th', key, params);
    const expectedNote = formatRule(
      {
        kind: 'mg_per_kg_per_dose',
        low: canonical.calc!.low!,
        high: canonical.calc!.high!,
        maxMg: canonical.calc!.max_dose_mg!,
      },
      t,
    );
    const localizedFrequency = localizeDrug(canonical, 'th', drugsTh, drugsEn).frequency;
    expect(row).toHaveTextContent(expectedNote);
    expect(localizedFrequency).toBeDefined();
    expect(row).toHaveTextContent(localizedFrequency!);
  });

  test('the min-dose variant of the rule note is rendered for atropine_brady', () => {
    renderWithProviders(<PALSView />, { calculator: { weight: 20, weightInput: '20' } });
    const card = screen.getByTestId('pals-card-brady_pulse');
    const row = within(card).getByTestId('drug-mini-atropine_brady');

    const canonical = findDrug('atropine_brady');
    const t = (key: string, params?: Record<string, string | number>) =>
      translate('th', key, params);
    const expectedNote = formatRule(
      {
        kind: 'mg_per_kg_per_dose',
        low: canonical.calc!.low!,
        high: canonical.calc!.high!,
        minMg: canonical.calc!.min_dose_mg,
        maxMg: canonical.calc!.max_dose_mg!,
      },
      t,
    );
    expect(row).toHaveTextContent(expectedNote);
  });

  test('without weight, a drug mini row shows the needs-weight text', () => {
    renderWithProviders(<PALSView />);
    const card = screen.getByTestId('pals-card-cardiac_arrest');
    const row = within(card).getByTestId('drug-mini-epinephrine_arrest');
    expect(row).toHaveTextContent(translate('th', 'dose.needsWeight'));
  });

  test('reversible-causes sub-labels are derived from array length, not hardcoded "5H"', () => {
    // reversible_causes.title reads "Reversible Causes — 6H + 5T" (h has 6 entries, t has 5);
    // the sub-heading above each list must match, not upstream's hardcoded "5H" bug.
    renderWithProviders(<PALSView />);
    const card = screen.getByTestId('pals-card-cardiac_arrest');
    expect(within(card).getByText('6H')).toBeInTheDocument();
    expect(within(card).getByText('5T')).toBeInTheDocument();
    expect(within(card).queryByText('5H')).not.toBeInTheDocument();
  });

  test('renders the decision tree question and YES/NO branches for each card', () => {
    renderWithProviders(<PALSView />);
    const card = screen.getByTestId('pals-card-cardiac_arrest');
    expect(within(card).getByText(/❓/)).toBeInTheDocument();
    expect(within(card).getByText(translate('th', 'pals.yes'))).toBeInTheDocument();
    expect(within(card).getByText(translate('th', 'pals.no'))).toBeInTheDocument();
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
    expect(within(card).getByText(translate('en', 'pals.yes'))).toBeInTheDocument();
    expect(within(card).getByText(translate('en', 'pals.no'))).toBeInTheDocument();
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
