import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { checkContraindication } from '@/clinical';
import { translate } from '@/i18n';
import type { ContraindicationHit } from '@/clinical/types';
import { ContraindicationAlert } from '@/components/ContraindicationAlert';
import { renderWithProviders, realDataset } from '../utils';

describe('ContraindicationAlert', () => {
  const idefen = realDataset.drugs.find((d) => d.id === 'idefen_syrup')!;

  function hitFor(weight: number | null, age: number | null): ContraindicationHit {
    const hit = checkContraindication(idefen, weight, age);
    if (!hit) throw new Error('expected a contraindication hit for this fixture');
    return hit;
  }

  test('severe hit renders role="alert" and the contra.severe label', () => {
    const hit = hitFor(5, 0.1);
    expect(hit.severity).toBe('severe');

    renderWithProviders(
      <ContraindicationAlert
        hit={hit}
        severityLabel={translate('en', 'contra.severe')}
        reason={hit.contraindication.reason}
      />,
      { lang: 'en' },
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(translate('en', 'contra.severe'));
  });

  test('moderate hit renders role="status" and the contra.moderate label', () => {
    const hit: ContraindicationHit = {
      index: 0,
      contraindication: {
        type: 'weight_below_kg',
        threshold_kg: 3,
        severity: '不建議',
        reason: 'test',
      },
      severity: 'moderate',
    };

    renderWithProviders(
      <ContraindicationAlert
        hit={hit}
        severityLabel={translate('en', 'contra.moderate')}
        reason="test reason"
      />,
      { lang: 'en' },
    );

    expect(screen.getByRole('status')).toHaveTextContent(translate('en', 'contra.moderate'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('mild hit renders role="status" and shows the translated raw severity text', () => {
    const hit: ContraindicationHit = {
      index: 0,
      contraindication: {
        type: 'weight_below_kg',
        threshold_kg: 3,
        severity: '慎用',
        reason: 'test',
      },
      severity: 'mild',
    };

    renderWithProviders(
      <ContraindicationAlert hit={hit} severityLabel="慎用" reason="use caution" />,
      { lang: 'th' },
    );

    expect(screen.getByRole('status')).toHaveTextContent('慎用');
    expect(screen.getByText(/use caution/)).toBeInTheDocument();
  });

  test('never conveys meaning by color alone: icon + text are always present', () => {
    const hit = hitFor(5, 0.1);
    renderWithProviders(
      <ContraindicationAlert
        hit={hit}
        severityLabel={translate('en', 'contra.severe')}
        reason={hit.contraindication.reason}
      />,
      { lang: 'en' },
    );
    expect(screen.getByText('🚫')).toBeInTheDocument();
    expect(screen.getByText(translate('en', 'contra.title'), { exact: false })).toBeInTheDocument();
  });
});
