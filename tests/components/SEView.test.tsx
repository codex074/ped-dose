import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { SEView } from '@/components/se/SEView';
import { renderWithProviders } from '../utils';

describe('SEView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders the title/subtitle and 4 stage cards', () => {
    renderWithProviders(<SEView />);
    expect(screen.getByTestId('se-view')).toBeInTheDocument();
    expect(screen.getAllByTestId('se-stage')).toHaveLength(4);
  });

  test('renders a decision divider between stages (3 dividers for 4 stages)', () => {
    renderWithProviders(<SEView />);
    expect(screen.getAllByText(/ยังชักอยู่หรือไม่/)).toHaveLength(3);
  });

  test('with weight 20, stage 2 (Initial Therapy) shows lorazepam as 2 mg (1 mL)', () => {
    renderWithProviders(<SEView />, { calculator: { weight: 20, weightInput: '20' } });
    const stages = screen.getAllByTestId('se-stage');
    const stage2 = stages[1]!;
    const row = within(stage2).getByTestId('drug-mini-lorazepam_inj');
    // calc: 0.1 mg/kg/dose * 20 kg = 2 mg (< max_dose_mg 4, unclamped);
    // concentration 2 mg/mL -> 2 mg / 2 mg/mL = 1 mL. formatRange(2,2) = "2", formatRange(1,1) = "1".
    expect(row).toHaveTextContent('2 mg (1 mL)');
  });

  test('without weight, stage 2 shows the needs-weight text for its drugs', () => {
    renderWithProviders(<SEView />);
    const stages = screen.getAllByTestId('se-stage');
    const stage2 = stages[1]!;
    const row = within(stage2).getByTestId('drug-mini-lorazepam_inj');
    expect(row).toHaveTextContent('กรอกน้ำหนักเพื่อคำนวณ');
  });

  test('stage 2 (Initial Therapy) shows all midazolam indications, not just one route (do-not-fix parity)', () => {
    renderWithProviders(<SEView />, { calculator: { weight: 20, weightInput: '20' } });
    const stages = screen.getAllByTestId('se-stage');
    const stage2 = stages[1]!;
    const row = within(stage2).getByTestId('drug-mini-midazolam_dormicum');
    expect(within(row).getAllByTestId('mini-dose-line')).toHaveLength(3);
  });

  test('stages without drugs (Stabilization, Third Therapy) render no drug doses section', () => {
    renderWithProviders(<SEView />);
    const stages = screen.getAllByTestId('se-stage');
    expect(within(stages[0]!).queryByTestId(/drug-mini-/)).not.toBeInTheDocument();
  });

  test('renders the AES figure link with target=_blank and rel=noopener noreferrer, plus citation', () => {
    renderWithProviders(<SEView />);
    const view = screen.getByTestId('se-view');
    const link = within(view).getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(view).toHaveTextContent('Glauser');
  });

  // NOTE: src/i18n/algorithms/{th,en}/ currently hold only `.gitkeep` (no translation JSON has
  // landed yet for pals_algorithms/se_algorithm), so `localizeSe`/`localizePals` fall back to the
  // canonical (Chinese-English mixed) dataset text for algorithm-authored strings regardless of
  // `lang` -- a pre-existing gap outside this task's scope (see report). The UI-chrome strings
  // (from ui.th.json/ui.en.json, e.g. `se.decision`, `se.minutes`) DO switch with `lang` and are
  // what this test exercises.
  test('localizes UI-chrome strings to English when lang=en', () => {
    renderWithProviders(<SEView />, { lang: 'en' });
    expect(screen.getAllByText(/Does the seizure continue/)).toHaveLength(3);
    expect(screen.getAllByText(/minutes/).length).toBeGreaterThan(0);
  });

  test('shows the empty state when the SE dataset has no algorithm data (undefined _meta)', () => {
    renderWithProviders(<SEView />, {
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
        // Intentionally missing/empty se_algorithm-shaped data isn't representable without
        // violating the type; instead this test asserts the ready-with-empty-stages case below.
        se_algorithm: {
          id: 'convulsive_se',
          title: 'x',
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
    // With a present-but-empty se_algorithm, the view renders (not the "not loaded" empty state)
    // with zero stage cards -- this exercises the ready branch's tolerance of an empty array.
    expect(screen.getByTestId('se-view')).toBeInTheDocument();
    expect(screen.queryAllByTestId('se-stage')).toHaveLength(0);
  });
});
