# Campaign performance · analytics section

Design Engineer test task for Awesomic. The main analytics view of an email-marketing SaaS (Klaviyo / Customer.io register): three KPI cards, one chart, an anomaly rail as the standout feature, and a timeframe filter with real logic.

- **Live build:** https://awesomic-task.vercel.app/
- **Source:** https://github.com/D0vl4/Awesomic-task
- **Figma:** https://www.figma.com/design/ppPHkUT3QFofxtv7IK36Lw/Awesome (page "Analytics section · 1440": greyscale wireframe on the left, final design on the right, local components below)
- **Video:** _(Loom link)_

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # anomaly detector unit tests
npm run build
```

No environment variables, no backend. Data is generated deterministically at load time and anchored to yesterday, so the view always reads current. The Figma frame is a snapshot from the day it was designed.

## Process

**1. Wireframe first.** I blocked the section in greyscale at 1440: header, three KPI cards, chart, anomaly rail. This settled the proportions and the placement of the standout feature before any colour or type decisions.

**2. Apply the system.** I then applied the register and token set from my own dashboard library (indigo accent, white cards on an off-white ground, hairline borders, DM Sans headings) and its variable collection for semantic colour, spacing and radius. The brief asks for a single section, so that is all there is: no sidebar, no navigation, no app shell.

**3. Design and build together.** Tokens live in one place (`src/tokens.css`) and their names mirror the Figma variables one to one. The chart in Figma is the SVG that Recharts actually renders in the build, imported and re-bound to the same variables, so the two cannot drift.

**4. Screenshot loop.** A small Playwright script renders the build at 1440 wide and I compared it side by side with the Figma frame after each pass. That is how the raw-count chart got replaced with rates (see below) and how the contrast issues were found.

## Key design decisions

- **Rates, not raw counts, on the chart.** Send volume in email marketing clusters on Tuesdays and Thursdays. Plotted as raw opens the line looks like a seismograph and clicks flatten against the x-axis. Open rate and click-to-open rate share one axis, sit calm around their baselines, and make the anomalies obvious. Raw counts stay in the tooltip.
- **One loud colour.** Indigo carries the brand and the primary series; ink carries the second series; the only saturated accent is Tomato, reserved for anomalies (marks, chips, the active card). Text and filled chips use a deeper shade of it so they pass 4.5:1. Everything else is grey.
- **Type.** DM Sans for headings and UI (SemiBold 24 title, Medium 18 card titles, Medium 24 KPI values), Inter as the body fallback, DM Mono for the numbered chips and deltas so they read as data.
- **Accessibility.** All text is at or above 4.5:1 against its actual background, including badge text and the anomaly chips, which meant darkening two library tokens for text use (`scripts/contrast.mjs` checks every pair). Font sizes bottom out at 12px. Toggle, switch and anomaly items are real buttons with `aria-pressed`, `role="switch"` and keyboard focus that also highlights the chart marker.

## The standout feature: anomaly annotations

Typical analytics views show you a line and leave the "so what" to you. This section flags the days that behaved differently and explains them in one sentence.

How it works (`src/lib/anomalies.ts`):

1. For each day in the visible range, take the previous 14 days as the baseline.
2. Compute the rolling mean and standard deviation for three volume-normalised metrics: open rate, click-to-open rate, revenue per recipient.
3. Flag a day when its z-score is at least 2.0 **and** the change is at least 30% off baseline. The second condition is the practical-significance floor: a statistically odd 4% wobble is not worth a marketer's attention.
4. Keep one flag per day (the metric with the largest |z|) so a single campaign event does not produce three near-identical cards.

Each flag is a numbered chip on the chart and a card in the rail. Hovering or focusing either one highlights the other. The card carries the plain-language reading ("Click-to-open was 47% below its 14-day baseline"), the campaign note, the observed vs baseline value and the send volume.

Why this over an "AI insight" callout: it is real logic that a reviewer can read, change and see re-render. The threshold and window are exported constants and the unit test checks that exactly the three injected events are found on the 90-day range.

## Working interactions

- **Timeframe (7 / 30 / 90 days).** Re-slices the series, recomputes the three KPIs and their deltas against the previous period of equal length, re-renders the chart and re-runs anomaly detection. On 7 days nothing is flagged and the rail shows an empty state.
- **Compare previous period.** Overlays the previous period as dashed ghost lines; tooltip and legend update.
- **Anomaly hover / select.** Chart marker and rail card highlight each other. Clicking pins the selection.

## Tools

- **Figma** for the design, using the existing variable collection and the Card Shell, Page title and Tab-Toggle components from my library. KPI card, Anomaly item (Default / Active), Switch and Brand mark are new local components on the page.
- **Vite + React + TypeScript**, **Recharts** for the chart (styled from tokens: no default grid box, custom ticks, custom dot renderer for the flags, custom tooltip), **Vitest** for the detector tests, **Playwright** for the screenshot loop.
- **Claude Code** (Anthropic) as pair: scaffolding, the anomaly maths and its tests, Recharts customisation, the Figma Plugin API scripts that built the page from the same data as the build, and the contrast script. I directed the design decisions, reviewed every screenshot, and adjusted the output where it diverged from the design (chart metric choice, flag placement per series, badge and chip colours).

## Component / token system

- `src/tokens.css`: colour, type, spacing, radius, shadow tokens named after the Figma variables.
- `src/components/`: `KpiCard`, `Sparkline`, `TimeframeToggle`, `CompareToggle`, `PerformanceChart`, `AnomalyRail`.
- Figma page "Analytics section · 1440": the frame plus a Components section with the four local components.

## Time spent

| Step | Time |
| --- | --- |
| Reading the brief, wireframe, planning | 0:30 |
| Data model, anomaly detector, tests | 0:35 |
| Components, chart, interactions | 1:10 |
| Figma page, components, fidelity pass | 0:50 |
| Contrast, polish, README, deploy | 0:35 |
| **Total** | **≈ 3:40** |
