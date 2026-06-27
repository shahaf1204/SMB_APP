import { FormEvent, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import {
  MONTHLY_EXPENSE_CATEGORIES,
  monthlyExpenseCategoryLabel,
} from '../data/monthlyExpenseCategories';
import { formatCurrency } from '../lib/finance';
import {
  currentMonthKey,
  expensesForMonth,
  formatMonthLabel,
  includesMonthlyExpenses,
  resolveExpenseTrackingMode,
  shiftMonthKey,
  sumMonthlyExpensesForMonth,
} from '../lib/monthlyExpenses';
import { useAppStore } from '../store/useAppStore';
import type { MonthlyExpenseCategoryId } from '../types/models';

export function MonthlyExpensesPage() {
  const business = useAppStore((s) => s.business)!;
  const monthlyExpenses = useAppStore((s) => s.monthlyExpenses);
  const addMonthlyExpense = useAppStore((s) => s.addMonthlyExpense);
  const deleteMonthlyExpense = useAppStore((s) => s.deleteMonthlyExpense);

  const expenseMode = resolveExpenseTrackingMode(business);
  const [month, setMonth] = useState(() => currentMonthKey());
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<MonthlyExpenseCategoryId>('rent');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const monthItems = useMemo(
    () => expensesForMonth(monthlyExpenses, month),
    [monthlyExpenses, month],
  );
  const monthTotal = useMemo(
    () => sumMonthlyExpensesForMonth(monthlyExpenses, month),
    [monthlyExpenses, month],
  );

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const parsed = Number(amount.replace(/[^\d.]/g, ''));
    if (!parsed || parsed <= 0) return;
    addMonthlyExpense({
      month,
      category,
      amount: parsed,
      notes: notes.trim(),
    });
    setAmount('');
    setNotes('');
    setShowForm(false);
  };

  if (!includesMonthlyExpenses(expenseMode)) {
    return (
      <div className="app-shell">
        <div className="page">
          <Link to="/settings/business" className="back-link">
            ← העסק שלי
          </Link>
          <h1 className="page-title">הוצאות חודשיות</h1>
          <div className="card">
            <p>
              מצב המעקב שלך הוא &quot;לפי פעילות&quot; בלבד. כדי לדווח הוצאות חודשיות, עדכנו
              את ההגדרה ב
              <Link to="/settings/business"> העסק שלי → מעקב הוצאות</Link>.
            </p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/activities" className="back-link">
          ← פעילויות
        </Link>
        <h1 className="page-title">הוצאות חודשיות</h1>
        <p className="page-subtitle">
          הוצאות כלליות של העסק — לא מחולקות לפעילות בודדת
        </p>

        <div className="month-picker card">
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            aria-label="חודש קודם"
            onClick={() => setMonth((m) => shiftMonthKey(m, -1))}
          >
            <ChevronRight size={20} />
          </button>
          <div className="month-picker-label">
            <Receipt size={18} aria-hidden />
            <strong>{formatMonthLabel(month)}</strong>
          </div>
          <button
            type="button"
            className="btn btn-icon btn-ghost"
            aria-label="חודש הבא"
            onClick={() => setMonth((m) => shiftMonthKey(m, 1))}
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="monthly-expense-total card">
          <span className="kpi-card-label">סה״כ הוצאות בחודש</span>
          <span className="kpi-card-value">{formatCurrency(monthTotal)}</span>
        </div>

        {monthItems.length === 0 ? (
          <p className="empty-state empty-state--compact">
            עדיין לא דווחו הוצאות ל{formatMonthLabel(month)}
          </p>
        ) : (
          <ul className="monthly-expense-list">
            {monthItems.map((item) => (
              <li key={item.id} className="card monthly-expense-item">
                <div>
                  <strong>{monthlyExpenseCategoryLabel(item.category)}</strong>
                  {item.notes && (
                    <p className="monthly-expense-notes">{item.notes}</p>
                  )}
                </div>
                <div className="monthly-expense-item-end">
                  <span className="monthly-expense-amount">
                    {formatCurrency(item.amount)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => deleteMonthlyExpense(item.id)}
                  >
                    מחק
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {showForm ? (
          <form onSubmit={handleAdd} className="card">
            <div className="field">
              <label htmlFor="exp-cat">קטגוריה</label>
              <select
                id="exp-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as MonthlyExpenseCategoryId)}
              >
                {MONTHLY_EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="exp-amount">סכום (₪)</label>
              <input
                id="exp-amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="exp-notes">הערה (אופציונלי)</label>
              <input
                id="exp-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="למשל: מנוי Canva"
              />
            </div>
            <div className="wizard-nav-row">
              <button type="submit" className="btn btn-primary">
                שמור
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowForm(false)}
              >
                ביטול
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            + הוספת הוצאה ל{formatMonthLabel(month)}
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
