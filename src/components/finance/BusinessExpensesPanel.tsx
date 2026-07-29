import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Receipt, Repeat } from 'lucide-react';
import {
  MONTHLY_EXPENSE_CATEGORIES,
  monthlyExpenseCategoryLabel,
} from '../../data/monthlyExpenseCategories';
import { formatCurrency } from '../../lib/finance';
import {
  currentMonthKey,
  EXPENSE_FREQUENCY_LABELS,
  EXPENSE_SCOPE_LABELS,
  expensesForMonth,
  formatMonthLabel,
  includesMonthlyExpenses,
  oneTimeExpenses,
  recurringExpenseTemplates,
  resolveExpenseTrackingMode,
  shiftMonthKey,
  sumMonthlyExpensesForMonth,
} from '../../lib/monthlyExpenses';
import { useAppStore } from '../../store/useAppStore';
import type {
  ExpenseFrequency,
  ExpenseScope,
  MonthlyExpenseCategoryId,
} from '../../types/models';

interface BusinessExpensesPanelProps {
  openFormOnMount?: boolean;
}

export function BusinessExpensesPanel({ openFormOnMount = false }: BusinessExpensesPanelProps) {
  const business = useAppStore((s) => s.business)!;
  const events = useAppStore((s) => s.events);
  const monthlyExpenses = useAppStore((s) => s.monthlyExpenses);
  const addMonthlyExpense = useAppStore((s) => s.addMonthlyExpense);
  const updateMonthlyExpense = useAppStore((s) => s.updateMonthlyExpense);
  const deleteMonthlyExpense = useAppStore((s) => s.deleteMonthlyExpense);

  const expenseMode = resolveExpenseTrackingMode(business);
  const [month, setMonth] = useState(() => currentMonthKey());
  const [showForm, setShowForm] = useState(openFormOnMount);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MonthlyExpenseCategoryId>('rent');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [supplier, setSupplier] = useState('');
  const [scope, setScope] = useState<ExpenseScope>('general_business');
  const [frequency, setFrequency] = useState<ExpenseFrequency>('one_time');
  const [recurrenceDay, setRecurrenceDay] = useState('1');
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    if (openFormOnMount) setShowForm(true);
  }, [openFormOnMount]);

  const monthItems = useMemo(
    () => expensesForMonth(monthlyExpenses, month),
    [monthlyExpenses, month],
  );
  const monthTotal = useMemo(
    () => sumMonthlyExpensesForMonth(monthlyExpenses, month),
    [monthlyExpenses, month],
  );
  const recurring = useMemo(
    () => recurringExpenseTemplates(monthlyExpenses),
    [monthlyExpenses],
  );
  const recentOneTime = useMemo(
    () => oneTimeExpenses(monthlyExpenses).slice(0, 12),
    [monthlyExpenses],
  );

  const resetForm = () => {
    setName('');
    setAmount('');
    setNotes('');
    setSupplier('');
    setScope('general_business');
    setFrequency('one_time');
    setRecurrenceDay('1');
    setEventId('');
    setCategory('rent');
  };

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const parsed = Number(amount.replace(/[^\d.]/g, ''));
    if (!parsed || parsed <= 0) return;

    const displayName = name.trim() || monthlyExpenseCategoryLabel(category);
    const isRecurring = frequency === 'monthly_recurring';

    addMonthlyExpense({
      name: displayName,
      category,
      amount: parsed,
      notes: notes.trim(),
      supplier: supplier.trim() || undefined,
      scope,
      frequency,
      month: isRecurring ? undefined : month,
      expenseDate: isRecurring ? undefined : `${month}-01`,
      recurrenceDay: isRecurring ? Number(recurrenceDay) || 1 : undefined,
      eventId: scope === 'activity_specific' && eventId ? eventId : undefined,
      isActive: isRecurring ? true : undefined,
    });

    resetForm();
    setShowForm(false);
  };

  if (!includesMonthlyExpenses(expenseMode)) {
    return (
      <div className="card">
        <p>
          מצב המעקב שלך הוא &quot;לפי פעילות&quot; בלבד. כדי לדווח הוצאות עסקיות, עדכנו את
          ההגדרה ב
          <Link to="/settings/business"> העסק שלי → מעקב הוצאות</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="business-expenses-panel">
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

      {recurring.length > 0 && (
        <section className="business-expenses-section">
          <h2 className="section-title-sm">הוצאות חודשיות קבועות</h2>
          <ul className="monthly-expense-list">
            {recurring.map((item) => (
              <li key={item.id} className="card monthly-expense-item">
                <div>
                  <strong>{item.name ?? monthlyExpenseCategoryLabel(item.category)}</strong>
                  <span className="recurring-badge">
                    <Repeat size={12} aria-hidden /> חודשית
                  </span>
                  {item.recurrenceDay && (
                    <p className="monthly-expense-notes">יום {item.recurrenceDay} בחודש</p>
                  )}
                  {item.supplier && (
                    <p className="monthly-expense-notes">{item.supplier}</p>
                  )}
                </div>
                <div className="monthly-expense-item-end">
                  <span className="monthly-expense-amount">{formatCurrency(item.amount)}</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => updateMonthlyExpense(item.id, { isActive: false })}
                  >
                    השבתה
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="business-expenses-section">
        <h2 className="section-title-sm">הוצאות ב{formatMonthLabel(month)}</h2>
        {monthItems.length === 0 ? (
          <p className="empty-state empty-state--compact">
            עדיין לא דווחו הוצאות ל{formatMonthLabel(month)}
          </p>
        ) : (
          <ul className="monthly-expense-list">
            {monthItems.map((item) => (
              <li key={item.id} className="card monthly-expense-item">
                <div>
                  <strong>{item.name ?? monthlyExpenseCategoryLabel(item.category)}</strong>
                  {item.scope === 'activity_specific' && (
                    <span className="recurring-badge">משויכת לפעילות</span>
                  )}
                  {item.notes && <p className="monthly-expense-notes">{item.notes}</p>}
                </div>
                <div className="monthly-expense-item-end">
                  <span className="monthly-expense-amount">{formatCurrency(item.amount)}</span>
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
      </section>

      {recentOneTime.length > monthItems.length && (
        <section className="business-expenses-section">
          <h2 className="section-title-sm">הוצאות חד־פעמיות אחרונות</h2>
          <ul className="monthly-expense-list monthly-expense-list--compact">
            {recentOneTime
              .filter((item) => item.month !== month)
              .slice(0, 6)
              .map((item) => (
                <li key={`recent-${item.id}`} className="card monthly-expense-item">
                  <div>
                    <strong>{item.name ?? monthlyExpenseCategoryLabel(item.category)}</strong>
                    <p className="monthly-expense-notes">
                      {item.month ? formatMonthLabel(item.month) : '—'}
                    </p>
                  </div>
                  <span className="monthly-expense-amount">{formatCurrency(item.amount)}</span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {showForm ? (
        <form onSubmit={handleAdd} className="card business-expense-form">
          <h2 className="section-title-sm">הוצאה חדשה</h2>
          <div className="field">
            <label htmlFor="exp-name">שם ההוצאה</label>
            <input
              id="exp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: שכירות, Canva"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="exp-scope">סוג</label>
              <select
                id="exp-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as ExpenseScope)}
              >
                {(Object.entries(EXPENSE_SCOPE_LABELS) as [ExpenseScope, string][]).map(
                  ([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="field">
              <label htmlFor="exp-frequency">תדירות</label>
              <select
                id="exp-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ExpenseFrequency)}
              >
                {(Object.entries(EXPENSE_FREQUENCY_LABELS) as [ExpenseFrequency, string][]).map(
                  ([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
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
          {frequency === 'monthly_recurring' && (
            <div className="field">
              <label htmlFor="exp-recurrence-day">יום בחודש</label>
              <input
                id="exp-recurrence-day"
                type="number"
                min="1"
                max="28"
                value={recurrenceDay}
                onChange={(e) => setRecurrenceDay(e.target.value)}
              />
            </div>
          )}
          {scope === 'activity_specific' && (
            <div className="field">
              <label htmlFor="exp-event">פעילות (אופציונלי)</label>
              <select id="exp-event" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">ללא קישור</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="exp-supplier">ספק (אופציונלי)</label>
            <input
              id="exp-supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="exp-notes">הערות (אופציונלי)</label>
            <input id="exp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="wizard-nav-row">
            <button type="submit" className="btn btn-primary">
              שמור
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              ביטול
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
          + הוצאה חדשה
        </button>
      )}
    </div>
  );
}
