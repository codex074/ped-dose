import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { translate } from '@/i18n';
import { SelectedDrugPanel } from '@/components/SelectedDrugPanel';
import { renderWithProviders, realDataset } from '../utils';

describe('SelectedDrugPanel', () => {
  test('no selection shows the panel.empty friendly empty state', () => {
    renderWithProviders(<SelectedDrugPanel />, { calculator: { selectedDrugId: null } });
    expect(screen.getByTestId('selected-drug-panel-empty')).toBeInTheDocument();
    expect(screen.getByText(translate('th', 'panel.empty'))).toBeInTheDocument();
  });

  test('shows 100-150 mg / 4.17-6.25 mL for antiphen_syrup at 10 kg, in both languages', () => {
    for (const lang of ['th', 'en'] as const) {
      const { unmount } = renderWithProviders(<SelectedDrugPanel />, {
        lang,
        calculator: {
          weight: 10,
          weightInput: '10',
          age: 2,
          ageInput: '2',
          selectedDrugId: 'antiphen_syrup',
        },
      });
      // antiphen_syrup shares group_id "acetaminophen" with acetaminophen_tab, so more than one
      // dose-result-card (and dose-row-mg) renders — scope the query to the syrup's own card.
      const card = document.querySelector('[data-drug-id="antiphen_syrup"]') as HTMLElement;
      expect(within(card).getByTestId('dose-row-mg')).toHaveTextContent('100-150');
      expect(within(card).getByTestId('dose-row-ml')).toHaveTextContent('4.17-6.25');
      unmount();
    }
  });

  test('idefen_syrup at 5 kg / age 0.1 yr shows a severe contraindication alert', () => {
    renderWithProviders(<SelectedDrugPanel />, {
      lang: 'en',
      calculator: {
        weight: 5,
        weightInput: '5',
        age: 0.1,
        ageInput: '0.1',
        selectedDrugId: 'idefen_syrup',
      },
    });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(translate('en', 'contra.severe'));
  });

  test('a grouped selection (shared group_id) renders both member forms', () => {
    const group = realDataset.drugs.filter((d) => d.group_id === 'acetaminophen');
    expect(group.map((d) => d.id)).toContain('antiphen_syrup');
    expect(group.length).toBeGreaterThan(1);

    renderWithProviders(<SelectedDrugPanel />, {
      lang: 'en',
      calculator: {
        weight: 10,
        weightInput: '10',
        age: 2,
        ageInput: '2',
        selectedDrugId: 'antiphen_syrup',
      },
    });

    expect(screen.getAllByTestId('dose-result-card')).toHaveLength(group.length);
  });

  test('clinical info accordion toggles aria-expanded on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SelectedDrugPanel />, {
      lang: 'en',
      calculator: {
        weight: 10,
        weightInput: '10',
        age: 2,
        ageInput: '2',
        selectedDrugId: 'antiphen_syrup',
      },
    });

    const buttons = screen.getAllByRole('button', { name: translate('en', 'clinical.title') });
    const button = buttons[0]!;
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
