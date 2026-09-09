import type { ReactNode } from 'react';
import type { Kpi } from '../lib/aggregate';
import { compact, money, pct, signedPct } from '../lib/format';
import { IconTrendDown, IconTrendUp } from './Icons';
import { Sparkline } from './Sparkline';

interface Props {
  kpi: Kpi;
  icon: ReactNode;
  periodLabel: string;
}

function formatValue(kpi: Kpi): string {
  switch (kpi.key) {
    case 'sent':
      return compact(kpi.value);
    case 'openRate':
      return pct(kpi.value);
    case 'revenue':
      return money(kpi.value);
  }
}

export function KpiCard({ kpi, icon, periodLabel }: Props) {
  const dir = Math.abs(kpi.delta) < 0.005 ? 'flat' : kpi.delta > 0 ? 'up' : 'down';
  return (
    <article className="card kpi" aria-label={kpi.label}>
      <div className="kpi__main">
        <div className="kpi__icon">{icon}</div>
        <div>
          <p className="kpi__label">{kpi.label}</p>
          <div className="kpi__value-row">
            <p className="kpi__value">{formatValue(kpi)}</p>
            <span className={`badge badge--${dir}`}>
              {dir === 'up' && <IconTrendUp />}
              {dir === 'down' && <IconTrendDown />}
              {signedPct(kpi.delta)} <span className="sr-only">versus</span>
              <span aria-hidden>vs</span> {periodLabel}
            </span>
          </div>
        </div>
      </div>
      <Sparkline values={kpi.spark} />
    </article>
  );
}
