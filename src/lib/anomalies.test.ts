import { describe, it, expect } from 'vitest';
import { SERIES, generateSeries } from '../data/generate';
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

  it('finds exactly the injected events whatever day the series ends on', () => {
    // The series is anchored to "yesterday", so the weekday pattern shifts
    // under the injected events. Check every alignment across a full year.
    const base = Date.UTC(2026, 0, 1);
    for (let k = 0; k < 366; k += 3) {
      const series = generateSeries(new Date(base + k * 86400000));
      const s = sliceSeries(series, 90);
      const found = detectAnomalies(s.history, s.current).map((a) => a.date);
      const injected = series.filter((d) => d.note).map((d) => d.date);
      expect(found, `end offset ${k}`).toEqual(injected);
    }
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
