import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test } from 'vitest';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { renderWithProviders } from '../utils';

beforeEach(() => {
  localStorage.clear();
});

describe('LanguageSwitcher', () => {
  test('renders a radiogroup with th active by default', () => {
    renderWithProviders(<LanguageSwitcher />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-label', 'เปลี่ยนภาษา');
    expect(screen.getByRole('radio', { name: 'ไทย' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'EN' })).toHaveAttribute('aria-checked', 'false');
  });

  test('clicking EN flips document.documentElement.lang', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);
    await user.click(screen.getByRole('radio', { name: 'EN' }));
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('radio', { name: 'EN' })).toHaveAttribute('aria-checked', 'true');
  });

  test('ArrowRight from th moves to en', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);
    screen.getByRole('radio', { name: 'ไทย' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(document.documentElement.lang).toBe('en');
  });

  test('ArrowLeft from th wraps to en', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);
    screen.getByRole('radio', { name: 'ไทย' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(document.documentElement.lang).toBe('en');
  });

  test('buttons meet the 44px minimum touch target', () => {
    renderWithProviders(<LanguageSwitcher />);
    for (const btn of screen.getAllByRole('radio')) {
      expect(btn.className).toMatch(/h-11/);
    }
  });
});
