const nf = new Intl.NumberFormat('en-US');

export function compact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (Math.abs(n) >= 10_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return nf.format(Math.round(n));
}

export function money(n: number): string {
  return '$' + compact(n);
}

export function pct(n: number, digits = 1): string {
  return (n * 100).toFixed(digits) + '%';
}

export function signedPct(n: number, digits = 1): string {
  const s = (n * 100).toFixed(digits);
  return (n > 0 ? '+' : '') + s + '%';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function weekdayDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
