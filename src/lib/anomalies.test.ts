import { describe, it, expect } from 'vitest';
import { SERIES } from '../data/generate';
import { sliceSeries } from './aggregate';
import { detectAnomalies } from './anomalies';

describe('detectAnomalies', () => {
  it('flags the three injected events on the 90-day range and nothing else', () => {
    const s = sliceSeries(SERIES, 90);
    const found = detectAnomalies(s.history, s.current);
    const injected = SERIES.filter((d) => d.note).map((d) => d.date);
    const dates = found.map((a) => a.date);
    for (const d of injected) expect(dates).toContain(d);
    expect(found.length).toBe(injected.length);
  });

  it('flags fewer days on a shorter range', () => {
    const s7 = sliceSeries(SERIES, 7);
    const s90 = sliceSeries(SERIES, 90);
    expect(detectAnomalies(s7.history, s7.current).length).toBeLessThanOrEqual(
      detectAnomalies(s90.history, s90.current).length,
    );
  });

  it('lower threshold never flags fewer days', () => {
    const s = sliceSeries(SERIES, 90);
    const strict = detectAnomalies(s.history, s.current, { threshold: 2.5 });
    const loose = detectAnomalies(s.history, s.current, { threshold: 1.5 });
    expect(loose.length).toBeGreaterThanOrEqual(strict.length);
  });
});
