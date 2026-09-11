import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'vitest';
import { translate } from '@/i18n';
import { AgeInput } from '@/components/AgeInput';
import { PatientInput } from '@/components/PatientInput';
import { PatientSummaryBanner } from '@/components/PatientSummaryBanner';
import { useCalculator } from '@/state/CalculatorProvider';
import { renderWithProviders } from '../utils';

const t = (key: string, params?: Record<string, string | number>) => translate('en', key, params);

/** Reads live calculator state into the DOM so tests can assert on parsed weight/age. */
function Probe() {
  const { weight, age } = useCalculator();
  return <div data-testid="probe">{`weight:${String(weight)} age:${String(age)}`}</div>;
}

beforeEach(() => {
  localStorage.clear();
});

describe('PatientInput', () => {
  test('typing 17.5 into weight sets weight to 17.5', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <PatientInput />
        <Probe />
      </>,
      { lang: 'en', calculator: { weightInput: '', ageInput: '' } },
    );

    await user.type(screen.getByLabelText(t('patient.weight')), '17.5');

    expect(screen.getByTestId('probe')).toHaveTextContent('weight:17.5');
  });

  test('typing 130 into weight shows the error and leaves weight null', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <PatientInput />
        <Probe />
      </>,
      { lang: 'en', calculator: { weightInput: '', ageInput: '' } },
    );

    const weightField = screen.getByLabelText(t('patient.weight'));
    await user.type(weightField, '130');

    expect(screen.getByText(t('patient.weightError'))).toBeVisible();
    expect(weightField).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByTestId('probe')).toHaveTextContent('weight:null');
  });
});

describe('AgeInput years+months helper', () => {
  test('is collapsed by default and toggles open', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgeInput />, {
      lang: 'en',
      calculator: { weightInput: '', ageInput: '' },
    });

    const toggle = screen.getByRole('button', { name: t('patient.ageHelperToggle') });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('entering years 2 + months 6 sets age to 2.5 and the years field shows 2.5', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <AgeInput />
        <Probe />
      </>,
      { lang: 'en', calculator: { weightInput: '', ageInput: '' } },
    );

    await user.click(screen.getByRole('button', { name: t('patient.ageHelperToggle') }));
    await user.type(screen.getByLabelText(t('patient.ageYears')), '2');
    await user.type(screen.getByLabelText(t('patient.ageMonths')), '6');

    expect(screen.getByTestId('probe')).toHaveTextContent('age:2.5');
    expect(screen.getByLabelText(t('patient.age'))).toHaveValue(2.5);
  });
});

describe('PatientSummaryBanner', () => {
  test('renders nothing when both weight and age are empty', () => {
    renderWithProviders(<PatientSummaryBanner />, {
      lang: 'en',
      calculator: { weightInput: '', ageInput: '' },
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('renders the summary pill once a weight and age are set', () => {
    renderWithProviders(<PatientSummaryBanner />, {
      lang: 'en',
      calculator: { weightInput: '17.5', ageInput: '5' },
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      t('patient.summary', { weight: '17.5', age: '5' }),
    );
  });

  test('renders once only weight is set, showing a dash placeholder for the missing age', () => {
    renderWithProviders(<PatientSummaryBanner />, {
      lang: 'en',
      calculator: { weightInput: '17.5', ageInput: '' },
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      t('patient.summary', { weight: '17.5', age: '—' }),
    );
  });
});
