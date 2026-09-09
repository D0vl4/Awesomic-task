import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function IconMail() {
  return (
    <svg {...base}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3.5 7l7.3 5.2a2 2 0 0 0 2.4 0L20.5 7" />
    </svg>
  );
}

export function IconOpen() {
  return (
    <svg {...base}>
      <path d="M3 8.5v9A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-9" />
      <path d="M3 8.5 12 3l9 5.5-7.8 5.3a2 2 0 0 1-2.4 0Z" />
    </svg>
  );
}

export function IconRevenue() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" />
    </svg>
  );
}

export function IconTrendUp({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={1.75}>
      <path d="M4 16.5 10 10.5l4 4 6-7" />
      <path d="M15.5 7.5H20v4.5" />
    </svg>
  );
}

export function IconTrendDown({ size = 16 }: { size?: number }) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={1.75}>
      <path d="M4 7.5 10 13.5l4-4 6 7" />
      <path d="M15.5 16.5H20V12" />
    </svg>
  );
}
