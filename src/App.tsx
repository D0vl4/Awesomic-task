import { useMemo, useState } from 'react';
import { SERIES } from './data/generate';
import type { Timeframe } from './data/types';
import { chartRows, computeKpis, sliceSeries } from './lib/aggregate';
import { DEFAULT_MIN_DELTA, DEFAULT_THRESHOLD, DEFAULT_WINDOW, detectAnomalies } from './lib/anomalies';
import { shortDate } from './lib/format';
import { AnomalyRail } from './components/AnomalyRail';
import { BrandMark } from './components/BrandMark';
import { CompareToggle } from './components/CompareToggle';
import { IconMail, IconOpen, IconRevenue } from './components/Icons';
import { KpiCard } from './components/KpiCard';
import { PerformanceChart } from './components/PerformanceChart';
import { TimeframeToggle } from './components/TimeframeToggle';

const ICONS = {
  sent: <IconMail />,
  openRate: <IconOpen />,
  revenue: <IconRevenue />,
};

export default function App() {
  const [timeframe, setTimeframe] = useState<Timeframe>(30);
  const [compare, setCompare] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const slice = useMemo(() => sliceSeries(SERIES, timeframe), [timeframe]);
  const kpis = useMemo(() => computeKpis(slice), [slice]);
  const rows = useMemo(() => chartRows(slice), [slice]);
  const anomalies = useMemo(
    () => detectAnomalies(slice.history, slice.current),
    // The constants are listed so a change to them (hot reload, or a future
    // settings UI) recomputes the flags instead of serving the cached result.
    [slice, DEFAULT_WINDOW, DEFAULT_THRESHOLD, DEFAULT_MIN_DELTA],
  );

  const activeId = hovered ?? selected;
  const first = slice.current[0]?.date;
  const last = slice.current[slice.current.length - 1]?.date;
  const periodLabel = `prev. ${timeframe}d`;

  const select = (id: string) => setSelected((cur) => (cur === id ? null : id));

  return (
    <main className="page">
      <header className="header">
        <div className="header__brand">
          <span className="brand" role="img" aria-label="Awesomic">
            <BrandMark />
          </span>
          <div>
            <h1 className="header__title">Campaign performance</h1>
          <p className="header__subtitle">
            {shortDate(first)} to {shortDate(last)} · All campaigns · Compared with the previous {timeframe} days
          </p>
          </div>
        </div>
        <div className="header__actions">
          <CompareToggle checked={compare} onChange={setCompare} />
          <TimeframeToggle
            value={timeframe}
            onChange={(t) => {
              setTimeframe(t);
              setSelected(null);
            }}
          />
        </div>
      </header>

      <section className="kpi-row" aria-label="Key metrics">
        {kpis.map((k) => (
          <KpiCard key={k.key} kpi={k} icon={ICONS[k.key]} periodLabel={periodLabel} />
        ))}
      </section>

      <section className="chart-row">
        <article className="card chart-card" aria-labelledby="chart-title">
          <div className="card__header">
            <div>
              <h2 className="card__title" id="chart-title">
                Open rate and click-to-open
              </h2>
              <p className="card__subtitle">Daily · numbered flags are anomalies, explained in the Anomalies panel</p>
            </div>
            <div className="legend" aria-hidden>
              <span className="legend__item" style={{ color: 'var(--data-chart-lines-active)' }}>
                <span className="legend__swatch" />
                <span style={{ color: 'var(--text-secondary)' }}>Open rate</span>
              </span>
              <span className="legend__item" style={{ color: 'var(--data-chart-lines-secondary)' }}>
                <span className="legend__swatch" />
                <span style={{ color: 'var(--text-secondary)' }}>Click-to-open</span>
              </span>
              {compare && (
                <span className="legend__item" style={{ color: 'var(--data-chart-lines-ghost)' }}>
                  <span className="legend__swatch legend__swatch--ghost" />
                  <span style={{ color: 'var(--text-secondary)' }}>Previous period</span>
                </span>
              )}
              <span className="legend__item">
                <span className="legend__dot" />
                <span>Anomaly</span>
              </span>
            </div>
          </div>
          <PerformanceChart
            rows={rows}
            anomalies={anomalies}
            compare={compare}
            activeAnomalyId={activeId}
            onHoverAnomaly={setHovered}
            onSelectAnomaly={select}
          />
        </article>

        <AnomalyRail
          anomalies={anomalies}
          activeId={activeId}
          onHover={setHovered}
          onSelect={select}
          timeframe={timeframe}
        />
      </section>
    </main>
  );
}
