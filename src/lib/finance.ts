import type { ChartMetric, Event, EventValue, MonthlyExpense, PeriodFilter } from '../types/models';
import {
  includesDirectExpenses,
  includesMonthlyExpenses,
  monthKeyInPeriod,
  overheadByMonth,
} from './monthlyExpenses';
import type { ExpenseTrackingMode } from '../types/models';
import { eventInRange, getPeriodRange } from './period';

export interface FinancialTotals {
  revenue: number;
  expense: number;
  profit: number;
  directExpense?: number;
  monthlyExpense?: number;
}

export interface MonthlyPoint {
  month: string;
  label: string;
  revenue: number;
  expense: number;
  profit: number;
}

export interface CumulativeMonthlyPoint extends MonthlyPoint {
  cumRevenue: number;
  cumExpense: number;
  cumProfit: number;
}

function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' });
}

export function filterEventsByPeriod(
  events: Event[],
  filter: PeriodFilter,
): Event[] {
  const range = getPeriodRange(filter);
  return events.filter((e) => eventInRange(e, range));
}

export function calculateTotals(
  events: Event[],
  eventValues: EventValue[],
  filter: PeriodFilter,
): FinancialTotals {
  const filteredIds = new Set(filterEventsByPeriod(events, filter).map((e) => e.id));
  return calculateTotalsByEventIds(filteredIds, eventValues);
}

export function calculateTotalsByEventIds(
  eventIds: Set<string>,
  eventValues: EventValue[],
): FinancialTotals {
  let revenue = 0;
  let expense = 0;

  for (const ev of eventValues) {
    if (!eventIds.has(ev.eventId)) continue;
    revenue += ev.revenueValue ?? 0;
    expense += ev.expenseValue ?? 0;
  }

  return { revenue, expense, profit: revenue - expense };
}

export function getMonthlySeries(
  events: Event[],
  eventValues: EventValue[],
  filter: PeriodFilter,
  monthlyExpenses: MonthlyExpense[] = [],
  expenseMode: ExpenseTrackingMode = 'both',
): MonthlyPoint[] {
  const filtered = filterEventsByPeriod(events, filter);
  return getUnifiedMonthlySeries(
    filtered,
    eventValues,
    monthlyExpenses,
    expenseMode,
    filter,
  );
}

export function getUnifiedMonthlySeries(
  events: Event[],
  eventValues: EventValue[],
  monthlyExpenses: MonthlyExpense[],
  expenseMode: ExpenseTrackingMode,
  filter: PeriodFilter,
): MonthlyPoint[] {
  const base = getMonthlySeriesForEvents(
    events,
    eventValues,
    includesDirectExpenses(expenseMode),
  );

  if (!includesMonthlyExpenses(expenseMode) || monthlyExpenses.length === 0) {
    return base.filter((p) => monthKeyInPeriod(p.month, filter));
  }

  const overhead = overheadByMonth(monthlyExpenses);
  const byMonth = new Map<string, MonthlyPoint>();

  for (const point of base) {
    byMonth.set(point.month, { ...point });
  }

  for (const [month, amount] of overhead) {
    if (!monthKeyInPeriod(month, filter)) continue;
    const existing = byMonth.get(month);
    if (existing) {
      existing.expense += amount;
      existing.profit = existing.revenue - existing.expense;
    } else {
      byMonth.set(month, {
        month,
        label: monthLabel(month),
        revenue: 0,
        expense: amount,
        profit: -amount,
      });
    }
  }

  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function getMonthlySeriesForEvents(
  events: Event[],
  eventValues: EventValue[],
  includeDirectExpense = true,
): MonthlyPoint[] {
  const filtered = events;
  const byMonth = new Map<string, MonthlyPoint>();

  for (const event of filtered) {
    const key = monthKey(new Date(event.eventDate));
    if (!byMonth.has(key)) {
      byMonth.set(key, {
        month: key,
        label: monthLabel(key),
        revenue: 0,
        expense: 0,
        profit: 0,
      });
    }
  }

  const eventIds = new Set(filtered.map((e) => e.id));
  const eventById = new Map(filtered.map((e) => [e.id, e]));
  for (const ev of eventValues) {
    if (!eventIds.has(ev.eventId)) continue;
    const event = eventById.get(ev.eventId);
    if (!event) continue;
    const key = monthKey(new Date(event.eventDate));
    const point = byMonth.get(key);
    if (!point) continue;
    point.revenue += ev.revenueValue ?? 0;
    if (includeDirectExpense) {
      point.expense += ev.expenseValue ?? 0;
    }
    point.profit = point.revenue - point.expense;
  }

  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function getAllTimeTotals(
  events: Event[],
  eventValues: EventValue[],
): FinancialTotals {
  const ids = new Set(events.map((e) => e.id));
  return calculateTotalsByEventIds(ids, eventValues);
}

/** סדרת חודשים עם סכומים מצטברים (ריצה) עד כל חודש */
export function getCumulativeMonthlySeries(
  events: Event[],
  eventValues: EventValue[],
  maxMonths = 12,
): CumulativeMonthlyPoint[] {
  const monthly = getMonthlySeriesForEvents(events, eventValues);
  const slice = monthly.slice(-maxMonths);
  let cumRevenue = 0;
  let cumExpense = 0;
  return slice.map((m) => {
    cumRevenue += m.revenue;
    cumExpense += m.expense;
    return {
      ...m,
      cumRevenue,
      cumExpense,
      cumProfit: cumRevenue - cumExpense,
    };
  });
}

export function mergeFinancialTotals(
  eventTotals: FinancialTotals,
  monthlyExpenseTotal: number,
  expenseMode: ExpenseTrackingMode,
): FinancialTotals {
  const directExpense = includesDirectExpenses(expenseMode) ? eventTotals.expense : 0;
  const monthlyExpense = includesMonthlyExpenses(expenseMode) ? monthlyExpenseTotal : 0;
  const expense = directExpense + monthlyExpense;
  return {
    revenue: eventTotals.revenue,
    expense,
    profit: eventTotals.revenue - expense,
    directExpense,
    monthlyExpense,
  };
}

export function getChartValue(point: MonthlyPoint, metric: ChartMetric): number {
  return point[metric];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('he-IL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}
