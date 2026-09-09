import type { Anomaly } from '../lib/anomalies';
import { DEFAULT_MIN_DELTA, DEFAULT_THRESHOLD, DEFAULT_WINDOW, METRIC_LABEL } from '../lib/anomalies';
import { compact, pct, signedPct, weekdayDate } from '../lib/format';

interface Props {
  anomalies: Anomaly[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  timeframe: number;
}

function describe(a: Anomaly): string {
  const label = METRIC_LABEL[a.metric];
  const dir = a.direction === 'up' ? 'above' : 'below';
  return `${label} was ${Math.round(Math.abs(a.delta) * 100)}% ${dir} its ${DEFAULT_WINDOW}-day baseline.`;
}

function hint(a: Anomaly): string {
  if (a.note) return a.note;
  // Fallback heuristics when no campaign metadata is attached
  if (a.metric === 'openRate' && a.direction === 'down' && a.day.sent > 60000)
    return 'Unusually large send. Check the segment.';
  if (a.metric === 'clickRate' && a.direction === 'down') return 'Opens held up but clicks fell. Check links and CTA.';
  if (a.direction === 'up') return 'Worth repeating. Compare with the campaign calendar.';
  return 'No campaign note attached.';
}

function valueFmt(a: Anomaly): string {
  if (a.metric === 'revenuePerRecipient') return `$${a.value.toFixed(2)} vs $${a.baseline.toFixed(2)}`;
  return `${pct(a.value)} vs ${pct(a.baseline)}`;
}

export function AnomalyRail({ anomalies, activeId, onHover, onSelect, timeframe }: Props) {
  return (
    <section className="card rail" aria-labelledby="rail-title">
      <div className="card__header">
        <div>
          <h2 className="card__title" id="rail-title">
            Anomalies
          </h2>
          <p className="card__subtitle">
            {anomalies.length === 0
              ? `Nothing unusual in the last ${timeframe} days`
              : `${anomalies.length} day${anomalies.length === 1 ? '' : 's'} behaved differently from the baseline`}
          </p>
        </div>
      </div>

      {anomalies.length === 0 ? (
        <p className="rail__empty">All metrics stayed within the expected range. Widen the timeframe to see earlier events.</p>
      ) : (
        <ol className="rail__list">
          {anomalies.map((a, i) => (
            <li key={a.id}>
              <button
                type="button"
                className="anomaly"
                data-active={a.id === activeId}
                onMouseEnter={() => onHover(a.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(a.id)}
                onBlur={() => onHover(null)}
                onClick={() => onSelect(a.id)}
              >
                <span className="anomaly__num" aria-hidden>
                  {i + 1}
                </span>
                <span>
                  <span className="anomaly__head">
                    <span className="anomaly__date">{weekdayDate(a.date)}</span>
                    <span className={`anomaly__delta ${a.direction === 'up' ? 'anomaly__delta--up' : ''}`}>
                      {signedPct(a.delta, 0)}
                    </span>
                  </span>
                  <p className="anomaly__text">{describe(a)}</p>
                  <p className="anomaly__meta">
                    {hint(a)} · {valueFmt(a)} · {compact(a.day.sent)} sent
                  </p>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}

      <p className="rail__foot">
        <span>
          Baseline: rolling {DEFAULT_WINDOW}-day mean. Flagged when <code>|z| ≥ {DEFAULT_THRESHOLD}</code> and change{' '}
          <code>≥ {Math.round(DEFAULT_MIN_DELTA * 100)}%</code>.
        </span>
      </p>
    </section>
  );
}
