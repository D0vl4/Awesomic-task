import type { Timeframe } from '../data/types';

interface Props {
  value: Timeframe;
  onChange: (t: Timeframe) => void;
}

const OPTIONS: { value: Timeframe; label: string }[] = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

export function TimeframeToggle({ value, onChange }: Props) {
  return (
    <div className="toggle" role="group" aria-label="Timeframe">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          className="toggle__item"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
