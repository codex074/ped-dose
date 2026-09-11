import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { DoseResultCard } from '@/components/DoseResultCard';
import { renderWithProviders, realDataset } from '../utils';

describe('DoseResultCard', () => {
  const antiphen = realDataset.drugs.find((d) => d.id === 'antiphen_syrup')!;

  test.each(['th', 'en'] as const)(
    'shows 100-150 mg and 4.17-6.25 mL for antiphen_syrup at 10 kg (%s)',
    (lang) => {
      renderWithProviders(<DoseResultCard drug={antiphen} />, {
        lang,
        calculator: { weight: 10, weightInput: '10', age: 2, ageInput: '2' },
      });

      expect(screen.getByTestId('dose-row-mg')).toHaveTextContent('100-150');
      expect(screen.getByTestId('dose-row-ml')).toHaveTextContent('4.17-6.25');
    },
  );

  test('numeric values are identical across languages', () => {
    const { unmount } = renderWithProviders(<DoseResultCard drug={antiphen} />, {
      lang: 'th',
      calculator: { weight: 10, weightInput: '10', age: 2, ageInput: '2' },
    });
    const thMg = screen.getByTestId('dose-row-mg').textContent;
    const thMl = screen.getByTestId('dose-row-ml').textContent;
    unmount();

    renderWithProviders(<DoseResultCard drug={antiphen} />, {
      lang: 'en',
      calculator: { weight: 10, weightInput: '10', age: 2, ageInput: '2' },
    });
    // Only the label/unit text differs by language; strip everything but digits/./- to compare
    // the numeric portion (this also covers any digits inside the mg row's rule sub-text, e.g.
    // a "max 1000 mg/dose" notice, since the underlying numbers must match too).
    const numeric = (s: string | null) => (s ?? '').replace(/[^0-9.\-]/g, '');
    expect(numeric(screen.getByTestId('dose-row-ml').textContent)).toBe(numeric(thMl));
    expect(numeric(screen.getByTestId('dose-row-mg').textContent)).toBe(numeric(thMg));
  });

  test('the mL row is emphasized (larger, bold value) while the mg row is not', () => {
    renderWithProviders(<DoseResultCard drug={antiphen} />, {
      lang: 'en',
      calculator: { weight: 10, weightInput: '10', age: 2, ageInput: '2' },
    });

    const mlValue = screen.getByTestId('dose-row-ml').querySelector('p:nth-of-type(2)');
    const mgValue = screen.getByTestId('dose-row-mg').querySelector('p:nth-of-type(2)');
    expect(mlValue?.className).toMatch(/text-3xl/);
    expect(mlValue?.className).toMatch(/font-bold/);
    expect(mgValue?.className).not.toMatch(/text-3xl/);
  });

  test('renders drug generic name and route/frequency chips', () => {
    renderWithProviders(<DoseResultCard drug={antiphen} />, {
      lang: 'en',
      calculator: { weight: 10, weightInput: '10', age: 2, ageInput: '2' },
    });
    expect(screen.getByText('Acetaminophen')).toBeInTheDocument();
    expect(screen.getByText('PO')).toBeInTheDocument();
  });

  test('per-indication frequency is rendered (not dropped)', () => {
    const prednisolone = realDataset.drugs.find((d) => d.id === 'prednisolone_tab')!;
    expect(prednisolone.indications?.[0]?.frequency).toBe('ST × 1 dose');

    renderWithProviders(<DoseResultCard drug={prednisolone} />, {
      lang: 'en',
      calculator: { weight: 20, weightInput: '20', age: 5, ageInput: '5' },
    });

    expect(screen.getByText(/ST × 1 dose/)).toBeInTheDocument();
  });

  test('a grouped selection renders a card for every member sharing group_id', () => {
    const group = realDataset.drugs.filter((d) => d.group_id === 'acetaminophen');
    expect(group.length).toBeGreaterThan(1);

    renderWithProviders(
      <>
        {group.map((d) => (
          <DoseResultCard key={d.id} drug={d} />
        ))}
      </>,
      { lang: 'en', calculator: { weight: 10, weightInput: '10', age: 2, ageInput: '2' } },
    );

    expect(screen.getAllByTestId('dose-result-card')).toHaveLength(group.length);
  });
});
