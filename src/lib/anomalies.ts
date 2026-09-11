import type { DayPoint } from '../data/types';

/**
 * Anomalies are detected on volume-normalised metrics so that a big Tuesday
 * send does not read as an "anomaly" in raw opens. A marketer cares whether
 * the list *behaved* differently, not whether more mail went out.
 */
export type AnomalyMetric = 'openRate' | 'clickRate' | 'revenuePerRecipient';

export const METRIC_LABEL: Record<AnomalyMetric, string> = {
  openRate: 'Open rate',
  clickRate: 'Click-to-open',
  revenuePerRecipient: 'Revenue / recipient',
};

export function metricValue(d: DayPoint, m: AnomalyMetric): number {
  switch (m) {
    case 'openRate':
      return d.sent ? d.opens / d.sent : 0;
    case 'clickRate':
      return d.opens ? d.clicks / d.opens : 0;
    case 'revenuePerRecipient':
      return d.sent ? d.revenue / d.sent : 0;
  }
}

export interface Anomaly {
  id: string;
  date: string;
  metric: AnomalyMetric;
  /** Observed value on the day */
  value: number;
  /** Rolling baseline (mean of the previous `window` days) */
  baseline: number;
  /** (value - baseline) / baseline, e.g. 0.48 = +48% */
  delta: number;
  /** z-score against rolling std */
  z: number;
  direction: 'up' | 'down';
  /** Raw day so the UI can show sends / opens / clicks context */
  day: DayPoint;
  /** Optional hint carried from the dataset (in production: campaign metadata) */
  note?: string;
}

export interface AnomalyOptions {
  /** Days in the rolling window used for the baseline. Default 14. */
  window?: number;
  /** |z| threshold. Default 2.0. */
  threshold?: number;
  /**
   * Practical-significance floor: ignore days that are statistically odd but
   * only a few percent off baseline. Default 0.3 (30%).
   */
  minDelta?: number;
  metrics?: AnomalyMetric[];
}

export const DEFAULT_WINDOW = 14;
export const DEFAULT_THRESHOLD = 2.0;
export const DEFAULT_MIN_DELTA = 0.3;

/**
 * Flags days whose metric deviates from the rolling mean of the previous
 * `window` days by more than `threshold` standard deviations AND by at least
 * `minDelta` relative change (statistical + practical significance).
 *
 * `history` should contain at least `window` days *before* `range`, so the
 * first days of the visible range still have a baseline. Only days in
 * `range` can be flagged.
 */
export function detectAnomalies(
  history: DayPoint[],
  range: DayPoint[],
  opts: AnomalyOptions = {},
): Anomaly[] {
  const window = opts.window ?? DEFAULT_WINDOW;
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD;
  const minDelta = opts.minDelta ?? DEFAULT_MIN_DELTA;
  const metrics = opts.metrics ?? (['openRate', 'clickRate', 'revenuePerRecipient'] as AnomalyMetric[]);

  const all = [...history, ...range];
  const startIdx = history.length;
  const found: Anomaly[] = [];

  for (let i = startIdx; i < all.length; i++) {
    const day = all[i];
    const lo = Math.max(0, i - window);
    const prev = all.slice(lo, i);
    if (prev.length < Math.min(window, 7)) continue;

    for (const m of metrics) {
      const vals = prev.map((p) => metricValue(p, m));
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
      const std = Math.sqrt(variance);
      if (std === 0) continue;
      const v = metricValue(day, m);
      const z = (v - mean) / std;
      const delta = (v - mean) / mean;
      if (Math.abs(z) >= threshold && Math.abs(delta) >= minDelta) {
        found.push({
          id: `${day.date}-${m}`,
          date: day.date,
          metric: m,
          value: v,
          baseline: mean,
          delta,
          z,
          direction: z > 0 ? 'up' : 'down',
          day,
          note: day.note,
        });
      }
    }
  }

  // One card per day: keep the metric with the largest |z| so a single
  // campaign event does not produce three near-identical flags.
  const byDate = new Map<string, Anomaly>();
  for (const a of found) {
    const cur = byDate.get(a.date);
    if (!cur || Math.abs(a.z) > Math.abs(cur.z)) byDate.set(a.date, a);
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}
