import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { useAppStore } from '../store/useAppStore';
import type { MetricRole, ValueType } from '../types/models';

const VALUE_TYPE_LABELS: Record<ValueType, string> = {
  text: 'טקסט',
  number: 'מספר',
  date: 'תאריך',
  duration: 'שעה',
};

const METRIC_LABELS: Record<MetricRole, string> = {
  revenue: 'הכנסה',
  expense: 'הוצאה',
  neutral: 'כללי',
};

export function CategoriesPage() {
  const categories = useAppStore((s) => s.categories);
  const addCategory = useAppStore((s) => s.addCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);

  const [name, setName] = useState('');
  const [valueType, setValueType] = useState<ValueType>('text');
  const [metricRole, setMetricRole] = useState<MetricRole>('neutral');
  const [showForm, setShowForm] = useState(false);

  const active = categories.filter((c) => c.isActive);
  const inactive = categories.filter((c) => !c.isActive);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory({ name: name.trim(), valueType, metricRole });
    setName('');
    setShowForm(false);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings" className="back-link">
          ← הגדרות
        </Link>
        <h1 className="page-title">קטגוריות</h1>
        <p className="page-subtitle">הגדרת שדות מותאמים לעסק שלך</p>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem' }}>
          {active.map((c) => (
            <li key={c.id} className="card" style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <strong>{c.name}</strong>
                  <p
                    style={{
                      margin: '0.25rem 0 0',
                      fontSize: '0.85rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {VALUE_TYPE_LABELS[c.valueType]} · {METRIC_LABELS[c.metricRole]}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ minHeight: 36, padding: '0 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => deleteCategory(c.id)}
                >
                  מחק
                </button>
              </div>
            </li>
          ))}
        </ul>

        {inactive.length > 0 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            {inactive.length} קטגוריות מושבתות (בשימוש באירועים קיימים)
          </p>
        )}

        {showForm ? (
          <form onSubmit={handleAdd} className="card">
            <div className="field">
              <label htmlFor="cat-name">שם קטגוריה</label>
              <input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="vtype">סוג נתון</label>
              <select
                id="vtype"
                value={valueType}
                onChange={(e) => setValueType(e.target.value as ValueType)}
              >
                {(Object.keys(VALUE_TYPE_LABELS) as ValueType[]).map((k) => (
                  <option key={k} value={k}>
                    {VALUE_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="mrole">תפקיד מדד</label>
              <select
                id="mrole"
                value={metricRole}
                onChange={(e) => setMetricRole(e.target.value as MetricRole)}
              >
                {(Object.keys(METRIC_LABELS) as MetricRole[]).map((k) => (
                  <option key={k} value={k}>
                    {METRIC_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                שמור
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setShowForm(false)}
              >
                ביטול
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
            + הוספת קטגוריה
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
