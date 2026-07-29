import type {
  Business,
  ExpenseTrackingMode,
  MonthlyExpense,
  PeriodFilter,
} from '../types/models';
import { monthlyExpenseCategoryLabel } from '../data/monthlyExpenseCategories';
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

/**
 * Recurring expense templates (frequency monthly_recurring) are stored as rules only.
 * They are NOT auto-materialized into monthly rows on page load — avoids duplicate totals.
 * Profit/KPI sums use one-time rows with a month key, or legacy rows without frequency.
 */
export function normalizeMonthlyExpense(expense: MonthlyExpense): MonthlyExpense {
  const frequency = expense.frequency ?? 'one_time';
  const scope = expense.scope ?? 'general_business';
  return {
    ...expense,
    frequency,
    scope,
    name: expense.name?.trim() || monthlyExpenseCategoryLabel(expense.category),
    isActive: expense.isActive ?? true,
  };
}

export function migrateMonthlyExpenses(expenses: MonthlyExpense[]): MonthlyExpense[] {
  return expenses.map(normalizeMonthlyExpense);
}

/** Rows that contribute to overhead totals (general business, one-time with month). */
export function isOverheadExpenseRow(expense: MonthlyExpense): boolean {
  const normalized = normalizeMonthlyExpense(expense);
  if (normalized.scope === 'activity_specific') return false;
  if (normalized.frequency === 'monthly_recurring') return false;
  return Boolean(normalized.month);
}

export function isRecurringExpenseTemplate(expense: MonthlyExpense): boolean {
  return normalizeMonthlyExpense(expense).frequency === 'monthly_recurring';
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
    .filter(isOverheadExpenseRow)
    .filter((e) => e.month && monthKeyInPeriod(e.month, filter, now))
    .reduce((sum, e) => sum + e.amount, 0);
}

export function sumMonthlyExpensesForMonth(
  expenses: MonthlyExpense[],
  monthKey: string,
): number {
  return expenses
    .filter(isOverheadExpenseRow)
    .filter((e) => e.month === monthKey)
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Aggregate overhead by YYYY-MM for chart merge. */
export function overheadByMonth(expenses: MonthlyExpense[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of expenses.filter(isOverheadExpenseRow)) {
    if (!e.month) continue;
    map.set(e.month, (map.get(e.month) ?? 0) + e.amount);
  }
  return map;
}

export function expensesForMonth(
  expenses: MonthlyExpense[],
  monthKey: string,
): MonthlyExpense[] {
  return expenses
    .filter((e) => !isRecurringExpenseTemplate(e))
    .filter((e) => e.month === monthKey)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function recurringExpenseTemplates(expenses: MonthlyExpense[]): MonthlyExpense[] {
  return expenses
    .filter(isRecurringExpenseTemplate)
    .filter((e) => normalizeMonthlyExpense(e).isActive !== false)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function oneTimeExpenses(expenses: MonthlyExpense[]): MonthlyExpense[] {
  return expenses
    .filter((e) => !isRecurringExpenseTemplate(e))
    .sort((a, b) => (b.month ?? '').localeCompare(a.month ?? ''));
}

export const EXPENSE_SCOPE_LABELS: Record<'general_business' | 'activity_specific', string> = {
  general_business: 'הוצאה כללית לעסק',
  activity_specific: 'הוצאה המשויכת לפעילות',
};

export const EXPENSE_FREQUENCY_LABELS: Record<'one_time' | 'monthly_recurring', string> = {
  one_time: 'הוצאה חד־פעמית',
  monthly_recurring: 'הוצאה חודשית קבועה',
};
