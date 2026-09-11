import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { DrugSearch } from '@/components/DrugSearch';
import { renderWithProviders } from '../utils';

describe('DrugSearch', () => {
  test('the search input is labelled with the placeholder text', () => {
    renderWithProviders(<DrugSearch />);
    const input = screen.getByRole('searchbox', { name: 'ชื่อยา / ชื่อการค้า / อาการ' });
    expect(input).toHaveAttribute('placeholder', 'ชื่อยา / ชื่อการค้า / อาการ');
  });

  test('no clear button when the search is empty', () => {
    renderWithProviders(<DrugSearch />);
    expect(screen.queryByRole('button', { name: 'ล้างการค้นหา' })).not.toBeInTheDocument();
  });

  test('typing updates the input value and reveals the clear button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DrugSearch />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'para');
    expect(input).toHaveValue('para');
    expect(screen.getByRole('button', { name: 'ล้างการค้นหา' })).toBeInTheDocument();
  });

  test('clicking clear empties the input and refocuses it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DrugSearch />, { calculator: { search: 'ibuprofen' } });
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('ibuprofen');
    await user.click(screen.getByRole('button', { name: 'ล้างการค้นหา' }));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'ล้างการค้นหา' })).not.toBeInTheDocument();
  });

  test('renders localized labels in English', () => {
    renderWithProviders(<DrugSearch />, { lang: 'en' });
    expect(screen.getByRole('searchbox', { name: 'Drug name / brand / scenario' })).toBeVisible();
  });

  test('clear button meets the 44px minimum touch target', () => {
    renderWithProviders(<DrugSearch />, { calculator: { search: 'ibuprofen' } });
    const clearButton = screen.getByRole('button', { name: 'ล้างการค้นหา' });
    expect(clearButton.className).toMatch(/h-11/);
    expect(clearButton.className).toMatch(/w-11/);
  });
});
