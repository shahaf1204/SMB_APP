import type { Event, PeriodFilter } from '../types/models';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function endOfMonth(year: number, month: number): Date {
  return endOfDay(new Date(year, month + 1, 0));
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
  futureOnly?: boolean;
}

export function getPeriodRange(filter: PeriodFilter, now = new Date()): DateRange {
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = startOfDay(now);

  switch (filter) {
    case 'thisMonth':
      return { start: startOfMonth(y, m), end: endOfMonth(y, m) };
    case 'lastMonth':
      return { start: startOfMonth(y, m - 1), end: endOfMonth(y, m - 1) };
    case 'nextMonth':
      return { start: startOfMonth(y, m + 1), end: endOfMonth(y, m + 1) };
    case 'last7': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start, end: endOfDay(now) };
    }
    case 'last30': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start, end: endOfDay(now) };
    }
    case 'ytd':
      return { start: new Date(y, 0, 1), end: endOfDay(now) };
    case 'allTime':
      return { start: null, end: null };
    case 'allFuture':
      return { start: today, end: null, futureOnly: true };
    default:
      return { start: startOfMonth(y, m), end: endOfMonth(y, m) };
  }
}

export function eventInRange(event: Event, range: DateRange): boolean {
  const d = startOfDay(new Date(event.eventDate));
  if (range.futureOnly) {
    const today = startOfDay(new Date());
    return d >= today;
  }
  if (range.start && d < range.start) return false;
  if (range.end && d > range.end) return false;
  return true;
}

export const PERIOD_LABELS: Record<PeriodFilter, string> = {
  thisMonth: 'החודש',
  lastMonth: 'חודש קודם',
  nextMonth: 'חודש הבא',
  last7: '7 ימים אחרונים',
  last30: '30 ימים אחרונים',
  ytd: 'מתחילת השנה',
  allTime: 'נתונים מצטברים',
  allFuture: 'אירועים עתידיים',
};
