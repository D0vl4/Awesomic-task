export interface DayPoint {
  /** ISO date, YYYY-MM-DD */
  date: string;
  sent: number;
  opens: number;
  clicks: number;
  revenue: number;
  /** Non-empty when the generator injected a deliberate event on this day */
  note?: string;
}

export type Timeframe = 7 | 30 | 90;
