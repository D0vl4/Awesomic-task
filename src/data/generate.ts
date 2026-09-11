import type { DayPoint } from './types';

/** Small deterministic PRNG so the dataset is identical on every load. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOTAL_DAYS = 180; // 90 visible + 90 for the "previous period" comparison

/** Last complete day: yesterday, UTC. The dashboard always reads current. */
export function defaultEnd(now = Date.now()): Date {
  const d = new Date(now - 86400000);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Deliberate events. Offsets are days before END (0 = END).
 * These are what the anomaly detector should find; everything else is noise.
 */
const EVENTS: Record<number, { opens?: number; clicks?: number; sent?: number; revenue?: number; note: string }> = {
  61: { opens: 1.55, clicks: 1.35, revenue: 1.6, note: 'Summer sale launch to full list' },
  27: { sent: 2.4, opens: 0.62, clicks: 0.55, note: 'Re-engagement blast to lapsed segment' },
  9: { clicks: 0.35, revenue: 0.3, note: 'Broken CTA link in the newsletter' },
};

export function generateSeries(end: Date = defaultEnd()): DayPoint[] {
  // Fixed seed: the same shape on every reload within a day.
  const rand = mulberry32(20260909);
  const gauss = () => {
    // Box-Muller, clipped at 2 sigma: ordinary days wobble, they do not
    // spike. The spikes are the injected events below.
    const u = 1 - rand();
    const v = rand();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return Math.max(-2, Math.min(2, z));
  };
  const out: DayPoint[] = [];
  for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 86400000);
    const dow = d.getUTCDay(); // 0 Sun .. 6 Sat
    const weekend = dow === 0 || dow === 6;
    const t = (TOTAL_DAYS - 1 - i) / TOTAL_DAYS; // 0 → 1 over time, gentle growth

    // Send volume: campaigns cluster Tue/Thu, quiet weekends
    let sentBase = weekend ? 18000 : dow === 2 || dow === 4 ? 52000 : 34000;
    sentBase *= 1 + 0.18 * t;
    let sent = sentBase * (1 + 0.09 * gauss());

    let openRate = (weekend ? 0.19 : 0.225) * (1 + 0.035 * gauss()) + 0.012 * t;
    let ctr = 0.031 * (1 + 0.06 * gauss()); // clicks per open... roughly
    let rpc = 4.1 * (1 + 0.06 * gauss()); // revenue per click

    const ev = EVENTS[i];
    if (ev) {
      if (ev.sent) sent *= ev.sent;
      if (ev.opens) openRate *= ev.opens;
      if (ev.clicks) ctr *= ev.clicks;
      if (ev.revenue) rpc *= ev.revenue;
    }

    const opens = Math.round(sent * openRate);
    const clicks = Math.round(opens * ctr * 4.6);
    const revenue = Math.round(clicks * rpc);

    out.push({
      date: d.toISOString().slice(0, 10),
      sent: Math.round(sent),
      opens,
      clicks,
      revenue,
      note: ev?.note,
    });
  }
  return out;
}

export const SERIES: DayPoint[] = generateSeries();
