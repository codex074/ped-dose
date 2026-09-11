import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'vitest';
import { DrugList } from '@/components/DrugList';
import { STARRED_KEY } from '@/hooks/useStarred';
import { realDataset, renderWithProviders } from '../utils';

const antiphenSyrup = realDataset.drugs.find((d) => d.id === 'antiphen_syrup')!;
const voren = realDataset.drugs.find((d) => d.id === 'voren_supp')!;

beforeEach(() => {
  localStorage.clear();
  // `useStarred` seeds a default starred set from `starred_default` tags exactly once, but ONLY
  // when the storage key is entirely absent. Pre-seeding it with an empty array disables that
  // one-time auto-seed so every test starts from a known, empty starred set instead of whatever
  // the real dataset happens to seed (e.g. antiphen_syrup carries `starred_default`, which would
  // otherwise split the Acetaminophen group across the starred/category sections).
  localStorage.setItem(STARRED_KEY, JSON.stringify([]));
});

describe('DrugList', () => {
  test('antipyretic view groups Acetaminophen syrup + tablet into one card with 2 star buttons', () => {
    renderWithProviders(<DrugList />, { calculator: { view: 'antipyretic' } });

    const card = screen.getByTestId('drug-group-card-acetaminophen');
    expect(within(card).getByText('Acetaminophen')).toBeInTheDocument();
    const starButtons = within(card).getAllByRole('button', { name: /ปักหมุด/ });
    expect(starButtons).toHaveLength(2);
    // Each member's star button must have a distinct accessible name (brand-disambiguated) so
    // AT users can tell them apart — both buttons sharing the group's generic name would be an
    // a11y regression.
    expect(starButtons[0]).not.toHaveAccessibleName(starButtons[1]!.getAttribute('aria-label')!);
    // Both forms' bodies are present under the one card.
    expect(within(card).getByTestId('drug-form-antiphen_syrup')).toBeInTheDocument();
    expect(within(card).getByTestId('drug-form-acetaminophen_tab')).toBeInTheDocument();
  });

  test('at weight 10 the antiphen syrup mini dose line reads 100-150 mg (4.17-6.25 mL)', () => {
    renderWithProviders(<DrugList />, {
      calculator: { view: 'antipyretic', weight: 10, weightInput: '10' },
    });

    const form = screen.getByTestId('drug-form-antiphen_syrup');
    expect(within(form).getByTestId('mini-dose-line')).toHaveTextContent(
      '100-150 mg (4.17-6.25 mL)',
    );
  });

  test('clicking a card selects it: aria-pressed flips and the selected badge appears', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DrugList />, { calculator: { view: 'antipyretic' } });

    const card = screen.getByTestId(`drug-card-${voren.id}`);
    expect(card).toHaveAttribute('aria-pressed', 'false');

    await user.click(card);

    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(within(card).getByText(/เลือกแล้ว/)).toBeInTheDocument();
  });

  test('group card selection: clicking selects the first member id', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DrugList />, { calculator: { view: 'antipyretic' } });

    const card = screen.getByTestId('drug-group-card-acetaminophen');
    expect(card).toHaveAttribute('aria-pressed', 'false');

    await user.click(card);

    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  test('a search with no matches renders the empty state', () => {
    renderWithProviders(<DrugList />, { calculator: { search: 'zzzz-no-such-drug' } });

    expect(screen.getByText(/ไม่พบยาที่ค้นหา/)).toBeInTheDocument();
    expect(screen.queryByTestId(/drug-card-|drug-group-card-/)).not.toBeInTheDocument();
  });

  test('list cards render no clinical accordion or warnings/notes text', () => {
    const { container } = renderWithProviders(<DrugList />, {
      calculator: { view: 'antipyretic' },
    });

    // These strings only ever appear in the full clinical detail (kmuh_detail) / notes, which
    // list cards deliberately never render (that lives in SelectedDrugPanel, Task 18). This check
    // is translation-agnostic: whatever language antiphenSyrup's `副作用` renders in (canonical
    // zh, since it currently has no TH/EN override, or a future translation), the clinical
    // accordion the text would appear in simply doesn't exist in list-card markup.
    expect(screen.queryByText(antiphenSyrup.notes!)).not.toBeInTheDocument();
    expect(screen.queryByText(antiphenSyrup.kmuh_detail['副作用']!)).not.toBeInTheDocument();
    // Structural guard: list cards never render a `<dl>`/`<details>` accordion at all (upstream's
    // `renderKmuhDetail` uses a `<dl>`; this repo has nothing else that would legitimately render
    // one in the drug list), independent of whether any particular clinical field happens to have
    // a translation yet.
    expect(container.querySelector('dl')).toBeNull();
    expect(container.querySelector('details')).toBeNull();
  });

  test('starring an unstarred drug moves it into the starred section', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DrugList />, { calculator: { view: 'antipyretic' } });

    expect(screen.queryByRole('heading', { name: /รายการโปรด/ })).not.toBeInTheDocument();

    const vorenCard = screen.getByTestId(`drug-card-${voren.id}`);
    const starButton = within(vorenCard).getByRole('button', { name: /^ปักหมุด/ });
    await user.click(starButton);

    const heading = screen.getByRole('heading', { name: /รายการโปรด/ });
    const starredSection = heading.parentElement!;
    expect(within(starredSection).getByTestId(`drug-card-${voren.id}`)).toBeInTheDocument();
  });

  test('renders nothing for the pals view', () => {
    const { container } = renderWithProviders(<DrugList />, { calculator: { view: 'pals' } });
    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing for the se view', () => {
    const { container } = renderWithProviders(<DrugList />, { calculator: { view: 'se' } });
    expect(container).toBeEmptyDOMElement();
  });
});
