import type {
  Business,
  ExpenseTrackingMode,
  MonthlyExpense,
  PeriodFilter,
} from '../types/models';
import { getPeriodRange } from './period';

export function resolveExpenseTrackingMode(business: Business | null): ExpenseTrackingMode {
  return business?.expenseTrackingMode ?? 'both';
}

export function includesDirectExpenses(mode: ExpenseTrackingMode): boolean {
  return mode === 'per_activity' || mode === 'both';
}

export function includesMonthlyExpenses(mode: ExpenseTrackingMode): boolean {
  return mode === 'monthly' || mode === 'both';
}

function monthBounds(monthKey: string): { start: Date; end: Date } {
  const [y, m] = monthKey.split('-').map(Number);
  return {
    start: new Date(y, m - 1, 1),
    end: new Date(y, m, 0, 23, 59, 59, 999),
  };
}

export function monthKeyInPeriod(
  monthKey: string,
  filter: PeriodFilter,
  now = new Date(),
): boolean {
  const range = getPeriodRange(filter, now);
  const { start: monthStart, end: monthEnd } = monthBounds(monthKey);

  if (range.futureOnly) {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    return monthEnd >= today;
  }
  if (range.start && monthEnd < range.start) return false;
  if (range.end && monthStart > range.end) return false;
  return true;
}

export function currentMonthKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function sumMonthlyExpensesInPeriod(
  expenses: MonthlyExpense[],
  filter: PeriodFilter,
  now = new Date(),
): number {
  return expenses
    .filter((e) => monthKeyInPeriod(e.month, filter, now))
    .reduce((sum, e) => sum + e.amount, 0);
}

export function sumMonthlyExpensesForMonth(
  expenses: MonthlyExpense[],
  monthKey: string,
): number {
  return expenses
    .filter((e) => e.month === monthKey)
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Aggregate overhead by YYYY-MM for chart merge. */
export function overheadByMonth(expenses: MonthlyExpense[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.month, (map.get(e.month) ?? 0) + e.amount);
  }
  return map;
}

export function expensesForMonth(
  expenses: MonthlyExpense[],
  monthKey: string,
): MonthlyExpense[] {
  return expenses
    .filter((e) => e.month === monthKey)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
