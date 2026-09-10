import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { STARRED_KEY, useStarred } from '@/hooks/useStarred';
import type { Drug } from '@/clinical/types';

function drug(id: string, tags: string[] = []): Drug {
  return {
    id,
    generic: id,
    brand: '',
    kmuh_code: null,
    category: 'x',
    form: '',
    route: '',
    source: '',
    kmuh_detail: {},
    tags,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('useStarred', () => {
  test('seeds from starred_default tag on first run once drugs load', () => {
    const drugs = [drug('a', ['starred_default']), drug('b')];
    const { result, rerender } = renderHook(({ ds }: { ds: Drug[] }) => useStarred(ds), {
      initialProps: { ds: [] as Drug[] },
    });
    expect(result.current.starred.size).toBe(0);
    rerender({ ds: drugs });
    expect(result.current.starred.has('a')).toBe(true);
    expect(result.current.starred.has('b')).toBe(false);
    expect(JSON.parse(localStorage.getItem(STARRED_KEY)!)).toEqual(['a']);
  });

  test('does not re-seed once a starred key already exists', () => {
    localStorage.setItem(STARRED_KEY, JSON.stringify([]));
    const drugs = [drug('a', ['starred_default'])];
    const { result } = renderHook(() => useStarred(drugs));
    expect(result.current.starred.size).toBe(0);
  });

  test('toggle adds and removes and persists', () => {
    const drugs = [drug('a')];
    const { result } = renderHook(() => useStarred(drugs));
    act(() => result.current.toggle('a'));
    expect(result.current.starred.has('a')).toBe(true);
    expect(JSON.parse(localStorage.getItem(STARRED_KEY)!)).toEqual(['a']);
    act(() => result.current.toggle('a'));
    expect(result.current.starred.has('a')).toBe(false);
  });
});
