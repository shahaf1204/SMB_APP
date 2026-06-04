import type { Event, EventValue } from '../types/models';
import { calculateTotalsByEventIds, filterEventsByPeriod } from './finance';

export interface TrendMetric {
  label: string;
  current: number;
  previous: number;
  changePct: number | null;
}

function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function getFinancialTrends(
  events: Event[],
  eventValues: EventValue[],
): TrendMetric[] {
  const thisMonth = filterEventsByPeriod(events, 'thisMonth');
  const lastMonth = filterEventsByPeriod(events, 'lastMonth');
  const thisIds = new Set(thisMonth.map((e) => e.id));
  const lastIds = new Set(lastMonth.map((e) => e.id));
  const cur = calculateTotalsByEventIds(thisIds, eventValues);
  const prev = calculateTotalsByEventIds(lastIds, eventValues);

  return [
    {
      label: 'הכנסות',
      current: cur.revenue,
      previous: prev.revenue,
      changePct: changePercent(cur.revenue, prev.revenue),
    },
    {
      label: 'הוצאות',
      current: cur.expense,
      previous: prev.expense,
      changePct: changePercent(cur.expense, prev.expense),
    },
    {
      label: 'רווח',
      current: cur.profit,
      previous: prev.profit,
      changePct: changePercent(cur.profit, prev.profit),
    },
  ];
}

export function countNewLeadsThisWeek(leads: { createdAt: string }[]): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return leads.filter((l) => new Date(l.createdAt) >= weekAgo).length;
}
