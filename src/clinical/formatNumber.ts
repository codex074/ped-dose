/** Byte-for-byte port of upstream num(). Do not "improve". */
export function formatNumber(x: number | null | undefined): string {
  if (x === null || x === undefined || isNaN(x)) return '—';
  if (x === 0) return '0';
  if (x >= 100) return Math.round(x).toString();
  if (x >= 10) return x.toFixed(1).replace(/\.0$/, '');
  if (x >= 1) return x.toFixed(2).replace(/\.?0+$/, '');
  return x.toFixed(2).replace(/\.?0+$/, '');
}

export function formatRange(lo: number, hi: number): string {
  return lo === hi ? formatNumber(lo) : `${formatNumber(lo)}-${formatNumber(hi)}`;
}
