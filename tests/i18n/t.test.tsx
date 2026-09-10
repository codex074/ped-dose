import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLang, useT, translate } from '@/i18n';

function Probe() {
  const t = useT();
  const { lang, setLang } = useLang();
  return (
    <>
      <span data-testid="lang">{lang}</span>
      <span data-testid="txt">{t('patient.weight')}</span>
      <button onClick={() => setLang('en')}>en</button>
    </>
  );
}

test('defaults to Thai and switches to English, persisting the choice', () => {
  localStorage.clear();
  render(
    <LanguageProvider>
      <Probe />
    </LanguageProvider>,
  );
  expect(screen.getByTestId('lang')).toHaveTextContent('th');
  expect(screen.getByTestId('txt')).toHaveTextContent('น้ำหนัก');
  act(() => screen.getByText('en').click());
  expect(screen.getByTestId('txt')).toHaveTextContent('Weight');
  expect(localStorage.getItem('pedsdose.lang')).toBe('en');
  expect(document.documentElement.lang).toBe('en');
});

test('translate is pure and returns the key itself for a missing key', () => {
  expect(translate('th', 'this.key.does.not.exist')).toBe('this.key.does.not.exist');
  expect(translate('en', 'this.key.does.not.exist')).toBe('this.key.does.not.exist');
});

test('translate interpolates params', () => {
  expect(translate('en', 'dose.unitCount', { unit: 'tab' })).toBe('tab count');
  expect(translate('th', 'dose.unitCount', { unit: 'tab' })).toBe('จำนวน tab');
});

test('language-switch labels are invariant across the active language', () => {
  expect(translate('en', 'lang.th')).toBe('ไทย');
  expect(translate('th', 'lang.th')).toBe('ไทย');
  expect(translate('en', 'lang.en')).toBe('EN');
  expect(translate('th', 'lang.en')).toBe('EN');
});
