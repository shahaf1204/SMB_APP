import { ChevronLeft, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/finance';
import {
  currentMonthKey,
  formatMonthLabel,
  includesMonthlyExpenses,
  resolveExpenseTrackingMode,
  sumMonthlyExpensesForMonth,
} from '../lib/monthlyExpenses';
import { useAppStore } from '../store/useAppStore';

/** Persistent entry to monthly expenses — shown on Activities when relevant. */
export function MonthlyExpensesBar() {
  const business = useAppStore((s) => s.business);
  const monthlyExpenses = useAppStore((s) => s.monthlyExpenses ?? []);

  const expenseMode = resolveExpenseTrackingMode(business);
  if (!includesMonthlyExpenses(expenseMode)) return null;

  const monthKey = currentMonthKey();
  const monthTotal = sumMonthlyExpensesForMonth(monthlyExpenses, monthKey);
  const monthLabel = formatMonthLabel(monthKey);

  return (
    <Link to="/settings/monthly-expenses" className="activities-monthly-expenses-bar card">
      <span className="activities-monthly-expenses-bar-icon" aria-hidden>
        <Receipt size={20} strokeWidth={2} />
      </span>
      <span className="activities-monthly-expenses-bar-body">
        <strong>הוצאות חודשיות</strong>
        <span className="activities-monthly-expenses-bar-meta">
          {monthLabel}
          {monthTotal > 0
            ? ` · ${formatCurrency(monthTotal)}`
            : ' · עדיין לא דווחו — לחצו להוספה'}
        </span>
      </span>
      <ChevronLeft size={20} className="activities-monthly-expenses-bar-chevron" aria-hidden />
    </Link>
  );
}
