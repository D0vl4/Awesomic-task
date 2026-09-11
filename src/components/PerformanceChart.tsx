import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartRow } from '../lib/aggregate';
import type { Anomaly, AnomalyMetric } from '../lib/anomalies';
import { METRIC_LABEL } from '../lib/anomalies';
import { compact, pct, shortDate, signedPct, weekdayDate } from '../lib/format';

interface Props {
  rows: ChartRow[];
  anomalies: Anomaly[];
  compare: boolean;
  activeAnomalyId: string | null;
  onHoverAnomaly: (id: string | null) => void;
  onSelectAnomaly: (id: string) => void;
}

const C = {
  openRate: 'var(--data-chart-lines-active)',
  clickRate: 'var(--data-chart-lines-secondary)',
  ghost: 'var(--data-chart-lines-ghost)',
  anomaly: 'var(--data-chart-anomaly)',
  anomalyStrong: 'var(--data-chart-anomaly-strong)',
  grid: 'var(--border-separators)',
  tick: 'var(--text-tertiary)',
};

const MARGIN_TOP = 44;
const X_TICK_MARGIN = 12;

const tickStyle = {
  fontFamily: 'var(--font-family-heading)',
  fontSize: 12,
  fill: C.tick,
};

/** Which line a flagged metric is drawn on. Revenue has no line, so it rides on open rate. */
const LINE_FOR_METRIC: Record<AnomalyMetric, 'openRate' | 'clickRate'> = {
  openRate: 'openRate',
  clickRate: 'clickRate',
  revenuePerRecipient: 'openRate',
};

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: ChartRow;
}

export function PerformanceChart({
  rows,
  anomalies,
  compare,
  activeAnomalyId,
  onHoverAnomaly,
  onSelectAnomaly,
}: Props) {
  const byDate = useMemo(() => {
    const m = new Map<string, { a: Anomaly; n: number }>();
    anomalies.forEach((a, i) => m.set(a.date, { a, n: i + 1 }));
    return m;
  }, [anomalies]);

  // Every label on 7d, roughly weekly otherwise.
  const tickInterval = rows.length <= 7 ? 0 : rows.length <= 30 ? 4 : 13;

  // Y axis in 8% steps, extended when a spike leaves the usual range.
  const yTicks = useMemo(() => {
    const step = 0.08;
    let max = 0.3;
    for (const r of rows) {
      max = Math.max(max, r.openRate, r.clickRate, compare ? r.prevOpenRate : 0, compare ? r.prevClickRate : 0);
    }
    const top = Math.ceil(max / step) * step;
    const ticks: number[] = [];
    for (let v = 0; v <= top + 1e-9; v += step) ticks.push(+v.toFixed(2));
    return ticks;
  }, [rows, compare]);

  const makeDot =
    (line: 'openRate' | 'clickRate') =>
    (props: DotProps) => {
      const { cx, cy, payload } = props;
      const key = `d-${line}-${payload?.date ?? 'x'}`;
      if (cx == null || cy == null || !payload) return <g key={key} />;
      const hit = byDate.get(payload.date);
      if (!hit || LINE_FOR_METRIC[hit.a.metric] !== line) return <g key={key} />;
      const active = hit.a.id === activeAnomalyId;
      const r = active ? 6 : 4.5;
      const pillW = 22;
      const pillH = 18;
      const gap = 16; // dot centre to pill edge
      // Pill hangs below the point. It flips above only if it would cross the
      // bottom of the plot. Plot bottom is derived from this point: the plot
      // starts at MARGIN_TOP and cy = top + (1 - v / yTop) * plotHeight.
      const yTop = yTicks[yTicks.length - 1];
      const frac = 1 - payload[line] / yTop;
      const plotBottom = frac > 0.01 ? MARGIN_TOP + (cy - MARGIN_TOP) / frac : Infinity;
      // The pill may sit over the axis line; it must not reach the date labels
      // (which start X_TICK_MARGIN below the plot).
      const below = cy + gap + pillH <= plotBottom + X_TICK_MARGIN - 2;
      const dir = below ? 1 : -1;
      const pillEdge = cy + dir * gap; // near edge of pill
      const pillY = below ? pillEdge : pillEdge - pillH;
      return (
        <g
          key={key}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => onHoverAnomaly(hit.a.id)}
          onMouseLeave={() => onHoverAnomaly(null)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelectAnomaly(hit.a.id)}
          role="button"
          aria-label={`Anomaly ${hit.n} on ${weekdayDate(hit.a.date)}`}
        >
          <line x1={cx} y1={cy + dir * (r + 2)} x2={cx} y2={pillEdge} stroke={C.anomaly} strokeWidth={1} strokeDasharray="2 2" />
          <rect
            x={cx - pillW / 2}
            y={pillY}
            width={pillW}
            height={pillH}
            rx={4}
            fill={active ? C.anomalyStrong : '#fff'}
            stroke={active ? C.anomalyStrong : C.anomaly}
            strokeWidth={1}
          />
          <text
            x={cx}
            y={pillY + pillH / 2 + 4}
            textAnchor="middle"
            fontFamily="var(--font-family-mono)"
            fontSize={11}
            fontWeight={500}
            fill={active ? '#fff' : C.anomalyStrong}
          >
            {hit.n}
          </text>
          <circle cx={cx} cy={cy} r={r} fill={C.anomalyStrong} stroke="#fff" strokeWidth={2} />
        </g>
      );
    };

  const openDot = useMemo(() => makeDot('openRate'), [byDate, activeAnomalyId, yTicks]); // eslint-disable-line react-hooks/exhaustive-deps
  const clickDot = useMemo(() => makeDot('clickRate'), [byDate, activeAnomalyId, yTicks]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: MARGIN_TOP, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} strokeWidth={1} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            interval={tickInterval}
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            tickMargin={X_TICK_MARGIN}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            tickFormatter={(v: number) => pct(v, 0)}
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={44}
            domain={[0, yTicks[yTicks.length - 1]]}
            ticks={yTicks}
          />
          <Tooltip
            cursor={{ stroke: C.grid, strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as ChartRow;
              const hit = byDate.get(row.date);
              return (
                <div className="chart-tooltip">
                  <div className="chart-tooltip__date">{weekdayDate(row.date)}</div>
                  <div className="chart-tooltip__row">
                    <span>Open rate</span>
                    <span>{pct(row.openRate)}</span>
                  </div>
                  <div className="chart-tooltip__row">
                    <span>Click-to-open</span>
                    <span>{pct(row.clickRate)}</span>
                  </div>
                  {compare && (
                    <>
                      <div className="chart-tooltip__row chart-tooltip__row--ghost">
                        <span>Open rate, prev.</span>
                        <span>{pct(row.prevOpenRate)}</span>
                      </div>
                      <div className="chart-tooltip__row chart-tooltip__row--ghost">
                        <span>Click-to-open, prev.</span>
                        <span>{pct(row.prevClickRate)}</span>
                      </div>
                    </>
                  )}
                  <div className="chart-tooltip__row chart-tooltip__row--ghost">
                    <span>
                      {compact(row.sent)} sent · {compact(row.opens)} opens · {compact(row.clicks)} clicks
                    </span>
                  </div>
                  {hit && (
                    <div className="chart-tooltip__flag">
                      #{hit.n} {METRIC_LABEL[hit.a.metric]} {signedPct(hit.a.delta, 0)}
                    </div>
                  )}
                </div>
              );
            }}
          />
          {compare && (
            <>
              <Line
                type="monotone"
                dataKey="prevOpenRate"
                stroke={C.ghost}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="prevClickRate"
                stroke={C.ghost}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </>
          )}
          <Line
            type="monotone"
            dataKey="clickRate"
            stroke={C.clickRate}
            strokeWidth={1.5}
            dot={clickDot}
            activeDot={{ r: 3, strokeWidth: 0 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="openRate"
            stroke={C.openRate}
            strokeWidth={1.5}
            dot={openDot}
            activeDot={{ r: 3, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
