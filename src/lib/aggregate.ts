import type { DayPoint, Timeframe } from '../data/types';

export interface Kpi {
  key: 'sent' | 'openRate' | 'revenue';
  label: string;
  value: number;
  previous: number;
  /** (value - previous) / previous */
  delta: number;
  /** Per-day values for the sparkline (current period) */
  spark: number[];
}

export interface Slice {
  current: DayPoint[];
  previous: DayPoint[];
  /** Days before `current`, used as anomaly baseline history */
  history: DayPoint[];
}

export function sliceSeries(series: DayPoint[], days: Timeframe): Slice {
  const n = series.length;
  const current = series.slice(n - days);
  const previous = series.slice(n - 2 * days, n - days);
  const history = series.slice(Math.max(0, n - days - 30), n - days);
  return { current, previous, history };
}

const sum = (xs: DayPoint[], k: keyof DayPoint) => xs.reduce((a, d) => a + (d[k] as number), 0);

export function computeKpis(slice: Slice): Kpi[] {
  const { current, previous } = slice;
  const sentNow = sum(current, 'sent');
  const sentPrev = sum(previous, 'sent');
  const openNow = sum(current, 'opens') / sentNow;
  const openPrev = sum(previous, 'opens') / sentPrev;
  const revNow = sum(current, 'revenue');
  const revPrev = sum(previous, 'revenue');
  const pct = (a: number, b: number) => (b === 0 ? 0 : (a - b) / b);
  return [
    {
      key: 'sent',
      label: 'Emails sent',
      value: sentNow,
      previous: sentPrev,
      delta: pct(sentNow, sentPrev),
      spark: current.map((d) => d.sent),
    },
    {
      key: 'openRate',
      label: 'Open rate',
      value: openNow,
      previous: openPrev,
      delta: pct(openNow, openPrev),
      spark: current.map((d) => d.opens / d.sent),
    },
    {
      key: 'revenue',
      label: 'Revenue attributed',
      value: revNow,
      previous: revPrev,
      delta: pct(revNow, revPrev),
      spark: current.map((d) => d.revenue),
    },
  ];
}

/**
 * Chart rows: current period, with the previous period aligned by index.
 * Rates rather than raw counts, so Tuesday's big send does not dwarf the
 * weekend and both series share one axis.
 */
export interface ChartRow {
  date: string;
  openRate: number;
  clickRate: number;
  prevOpenRate: number;
  prevClickRate: number;
  sent: number;
  opens: number;
  clicks: number;
}

const rate = (a: number, b: number) => (b ? a / b : 0);

export function chartRows(slice: Slice): ChartRow[] {
  return slice.current.map((d, i) => {
    const p = slice.previous[i];
    return {
      date: d.date,
      openRate: rate(d.opens, d.sent),
      clickRate: rate(d.clicks, d.opens),
      prevOpenRate: p ? rate(p.opens, p.sent) : 0,
      prevClickRate: p ? rate(p.clicks, p.opens) : 0,
      sent: d.sent,
      opens: d.opens,
      clicks: d.clicks,
    };
  });
}
