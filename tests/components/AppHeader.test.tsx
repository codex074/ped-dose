import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { AppHeader } from '@/components/AppHeader';
import { realDataset, renderWithProviders } from '../utils';

describe('AppHeader', () => {
  test('renders app name, subtitle, and version badge from the dataset', () => {
    renderWithProviders(<AppHeader />);
    expect(screen.getByText('PedsDose')).toBeInTheDocument();
    expect(screen.getByText('ผู้ช่วยคำนวณขนาดยาในเด็ก')).toBeInTheDocument();
    expect(screen.getByText(`v${realDataset._meta.version}`)).toBeInTheDocument();
  });

  test('has role banner', () => {
    renderWithProviders(<AppHeader />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  test('renders subtitle in English when lang=en', () => {
    renderWithProviders(<AppHeader />, { lang: 'en' });
    expect(screen.getByText('Pediatric Dose Calculator')).toBeInTheDocument();
  });
});
