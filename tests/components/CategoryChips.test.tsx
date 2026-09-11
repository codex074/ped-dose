import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { CategoryChips } from '@/components/CategoryChips';
import { VIEW_ORDER } from '@/clinical/filters';
import { renderWithProviders } from '../utils';

const TH_LABELS: Record<string, string> = {
  all: 'ทั้งหมด',
  starred: 'รายการโปรด',
  uri: 'URI',
  age: 'AGE',
  antipyretic: 'ลดไข้',
  ml_only: 'ยาน้ำ',
  antibiotic: 'ยาปฏิชีวนะ',
  flu: 'ไข้หวัดใหญ่',
  sedation: 'ยาระงับประสาท',
  seizure: 'ชัก',
  se: 'แนวทาง SE',
  emergency: 'ฉุกเฉิน',
  pals: 'PALS',
};

describe('CategoryChips', () => {
  test('renders a tablist with 13 tabs in VIEW_ORDER order with translated labels', () => {
    renderWithProviders(<CategoryChips />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(13);
    expect(tabs).toHaveLength(VIEW_ORDER.length);
    tabs.forEach((tab, i) => {
      const view = VIEW_ORDER[i];
      expect(view).toBeDefined();
      expect(tab).toHaveTextContent(TH_LABELS[view as string] ?? '');
    });
  });

  test('the "all" tab is selected by default', () => {
    renderWithProviders(<CategoryChips />);
    expect(screen.getByRole('tab', { name: /ทั้งหมด/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /ทั้งหมด/ })).toHaveAttribute('tabIndex', '0');
  });

  test('clicking the PALS tab selects it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryChips />);
    const palsTab = screen.getByRole('tab', { name: /PALS/ });
    await user.click(palsTab);
    expect(palsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /ทั้งหมด/ })).toHaveAttribute('aria-selected', 'false');
  });

  test('ArrowRight from "all" selects "starred"', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryChips />);
    const allTab = screen.getByRole('tab', { name: /ทั้งหมด/ });
    allTab.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /รายการโปรด/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('only the active tab is in the tab order (roving tabIndex)', () => {
    renderWithProviders(<CategoryChips />, { calculator: { view: 'seizure' } });
    for (const tab of screen.getAllByRole('tab')) {
      const expected = tab.getAttribute('aria-selected') === 'true' ? '0' : '-1';
      expect(tab).toHaveAttribute('tabIndex', expected);
    }
  });

  test('renders localized labels in English', () => {
    renderWithProviders(<CategoryChips />, { lang: 'en' });
    expect(screen.getByRole('tab', { name: /Favorites/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Emergency/ })).toBeInTheDocument();
  });
});
