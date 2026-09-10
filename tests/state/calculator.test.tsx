import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import {
  CalculatorProvider,
  parseAge,
  parseWeight,
  useCalculator,
} from '@/state/CalculatorProvider';
import { LAST_KEY } from '@/hooks/useStarred';

beforeEach(() => {
  localStorage.clear();
});

describe('parseWeight', () => {
  test.each([
    ['', null, false],
    ['0', null, true],
    ['120', 120, false],
    ['120.1', null, true],
    ['17.5', 17.5, false],
    ['abc', null, true],
  ])('parseWeight(%s)', (s, v, e) =>
    expect(parseWeight(s as string)).toEqual({ value: v, error: e }),
  );
});

describe('parseAge', () => {
  test.each([
    ['', null, false],
    ['0', 0, false],
    ['18', 18, false],
    ['18.5', null, true],
    ['-1', null, true],
  ])('parseAge(%s)', (s, v, e) => expect(parseAge(s as string)).toEqual({ value: v, error: e }));
});

describe('useCalculator', () => {
  test('years+months helper produces float years', () => {
    const { result } = renderHook(() => useCalculator(), { wrapper: CalculatorProvider });
    act(() => result.current.setAgeFromYearsMonths(2, 6));
    expect(result.current.age).toBe(2.5);
  });

  test('setWeightInput drives weight/weightError', () => {
    const { result } = renderHook(() => useCalculator(), { wrapper: CalculatorProvider });
    act(() => result.current.setWeightInput('17.5'));
    expect(result.current.weight).toBe(17.5);
    expect(result.current.weightError).toBe(false);
    act(() => result.current.setWeightInput('abc'));
    expect(result.current.weight).toBeNull();
    expect(result.current.weightError).toBe(true);
  });

  test('setSearch, setView, selectDrug, toggleDetail update state', () => {
    const { result } = renderHook(() => useCalculator(), { wrapper: CalculatorProvider });
    act(() => result.current.setSearch('acet'));
    expect(result.current.search).toBe('acet');
    act(() => result.current.setView('antipyretic'));
    expect(result.current.view).toBe('antipyretic');
    act(() => result.current.selectDrug('antiphen_syrup'));
    expect(result.current.selectedDrugId).toBe('antiphen_syrup');
    act(() => result.current.selectDrug(null));
    expect(result.current.selectedDrugId).toBeNull();
    act(() => result.current.toggleDetail('antiphen_syrup'));
    expect(result.current.expandedDetails.has('antiphen_syrup')).toBe(true);
    act(() => result.current.toggleDetail('antiphen_syrup'));
    expect(result.current.expandedDetails.has('antiphen_syrup')).toBe(false);
  });

  test('default view is all, no drug selected', () => {
    const { result } = renderHook(() => useCalculator(), { wrapper: CalculatorProvider });
    expect(result.current.view).toBe('all');
    expect(result.current.selectedDrugId).toBeNull();
  });

  test('persists weight/age to LAST_KEY and restores on next mount', () => {
    const { result, unmount } = renderHook(() => useCalculator(), { wrapper: CalculatorProvider });
    act(() => result.current.setWeightInput('17.5'));
    act(() => result.current.setAgeInput('5'));
    expect(JSON.parse(localStorage.getItem(LAST_KEY)!)).toEqual({ weight: 17.5, age: 5 });
    unmount();

    const { result: result2 } = renderHook(() => useCalculator(), { wrapper: CalculatorProvider });
    expect(result2.current.weight).toBe(17.5);
    expect(result2.current.age).toBe(5);
  });

  test('treats stored 0 as absent, like upstream', () => {
    localStorage.setItem(LAST_KEY, JSON.stringify({ weight: 0, age: 0 }));
    const { result } = renderHook(() => useCalculator(), { wrapper: CalculatorProvider });
    expect(result.current.weight).toBeNull();
    expect(result.current.age).toBeNull();
  });

  test('initial prop overrides stored state', () => {
    localStorage.setItem(LAST_KEY, JSON.stringify({ weight: 10, age: 3 }));
    const { result } = renderHook(() => useCalculator(), {
      wrapper: ({ children }) => (
        <CalculatorProvider initial={{ weightInput: '22', ageInput: '2' }}>
          {children}
        </CalculatorProvider>
      ),
    });
    expect(result.current.weight).toBe(22);
    expect(result.current.age).toBe(2);
  });
});
