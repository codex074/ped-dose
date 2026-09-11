import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { DrugMiniRow } from '@/components/pals/DrugMiniRow';
import type { Drug, DrugDataset } from '@/clinical/types';
import { renderWithProviders } from '../utils';

const BASE_META: DrugDataset['_meta'] = {
  version: '0',
  last_updated: '',
  scope: '',
  primary_source: '',
  disclaimer: '',
};

const BASE_SE: DrugDataset['se_algorithm'] = {
  id: 'convulsive_se',
  title: '',
  subtitle: '',
  icon: '',
  time_stages: [],
  decision_label: '',
  citation: '',
  figure_url: '',
  figure_label: '',
};

function datasetWith(drug: Drug): DrugDataset {
  return {
    _meta: BASE_META,
    categories: [],
    drugs: [drug],
    pals_algorithms: [],
    se_algorithm: BASE_SE,
  };
}

describe('DrugMiniRow — rule note kind derivation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('mg_per_kg_per_dose with max_dose_mg gets the mg/kg rule note', () => {
    const drug: Drug = {
      id: 'test_mg_drug',
      generic: 'TestMgDrug',
      brand: 'TestBrand',
      kmuh_code: null,
      category: 'test',
      form: 'amp',
      route: 'IV',
      source: 'test',
      kmuh_detail: {},
      calc: { type: 'mg_per_kg_per_dose', low: 0.1, high: 0.2, max_dose_mg: 5 },
    };
    renderWithProviders(<DrugMiniRow drugId="test_mg_drug" />, {
      dataset: datasetWith(drug),
      calculator: { weight: 20, weightInput: '20' },
    });
    const row = screen.getByTestId('drug-mini-test_mg_drug');
    expect(row).toHaveTextContent('mg/kg/dose');
  });

  test('a non-mg_per_kg_per_dose calc.type does not get a mislabeled mg/kg rule note', () => {
    // Contrived: max_dose_mg present but calc.type is ml_per_kg_per_dose. Before the fix,
    // DrugMiniRow hardcoded RuleDescriptor.kind: 'mg_per_kg_per_dose' and would have rendered a
    // "mg/kg/dose" note built from ml/kg numbers -- wrong unit label. The note should now be
    // skipped entirely for kinds that don't carry mg/kg-per-dose semantics.
    const drug: Drug = {
      id: 'test_ml_drug',
      generic: 'TestMlDrug',
      brand: 'TestBrand',
      kmuh_code: null,
      category: 'test',
      form: 'amp',
      route: 'IV',
      source: 'test',
      kmuh_detail: {},
      calc: { type: 'ml_per_kg_per_dose', low: 0.1, high: 0.2, max_dose_mg: 5 },
    };
    renderWithProviders(<DrugMiniRow drugId="test_ml_drug" />, {
      dataset: datasetWith(drug),
      calculator: { weight: 20, weightInput: '20' },
    });
    const row = screen.getByTestId('drug-mini-test_ml_drug');
    expect(row).not.toHaveTextContent('mg/kg');
  });
});
