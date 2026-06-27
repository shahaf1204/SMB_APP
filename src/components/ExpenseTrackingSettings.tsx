import type { ExpenseTrackingMode } from '../types/models';
import { EXPENSE_TRACKING_MODE_OPTIONS } from '../data/monthlyExpenseCategories';
import { useAppStore } from '../store/useAppStore';

export function ExpenseTrackingSettings() {
  const business = useAppStore((s) => s.business);
  const updateExpenseTrackingMode = useAppStore((s) => s.updateExpenseTrackingMode);
  const mode = business?.expenseTrackingMode ?? 'both';

  return (
    <section className="card expense-tracking-settings">
      <h2 className="section-title-sm">מעקב הוצאות</h2>
      <p className="field-hint" style={{ marginTop: 0 }}>
        בחרו איך לדווח הוצאות — כך שהמספרים בדשבורד ישקפו את המציאות
      </p>
      <ul className="expense-mode-list">
        {EXPENSE_TRACKING_MODE_OPTIONS.map((opt) => (
          <li key={opt.id}>
            <button
              type="button"
              className={`expense-mode-btn ${mode === opt.id ? 'expense-mode-btn--on' : ''}`}
              onClick={() => updateExpenseTrackingMode(opt.id as ExpenseTrackingMode)}
            >
              <strong>{opt.label}</strong>
              <span>{opt.desc}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
