import { FormEvent, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { sortCategories } from '../lib/categories';
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
  const reorderCategories = useAppStore((s) => s.reorderCategories);
  const moveCategory = useAppStore((s) => s.moveCategory);

  const [name, setName] = useState('');
  const [valueType, setValueType] = useState<ValueType>('text');
  const [metricRole, setMetricRole] = useState<MetricRole>('neutral');
  const [showForm, setShowForm] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const active = useMemo(
    () => sortCategories(categories.filter((c) => c.isActive)),
    [categories],
  );
  const inactive = useMemo(
    () => sortCategories(categories.filter((c) => !c.isActive)),
    [categories],
  );

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCategory({ name: name.trim(), valueType, metricRole });
    setName('');
    setShowForm(false);
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const ids = active.map((c) => c.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) {
      setDragId(null);
      return;
    }
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, dragId);
    reorderCategories(ids);
    setDragId(null);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings" className="back-link">
          ← הגדרות
        </Link>
        <h1 className="page-title">קטגוריות</h1>
        <p className="page-subtitle">הגדרת שדות מותאמים לעסק שלך — גררו או השתמשו בחצים לשינוי סדר</p>

        {active.length > 0 && (
          <ul className="category-reorder-list">
            {active.map((c, index) => (
              <li
                key={c.id}
                className={`card category-reorder-item ${dragId === c.id ? 'category-reorder-item--dragging' : ''}`}
                draggable
                onDragStart={() => setDragId(c.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(c.id)}
              >
                <span className="category-reorder-grip" aria-hidden>
                  <GripVertical size={18} strokeWidth={2} />
                </span>
                <div className="category-reorder-body">
                  <strong>{c.name}</strong>
                  <p className="category-reorder-meta">
                    {VALUE_TYPE_LABELS[c.valueType]} · {METRIC_LABELS[c.metricRole]}
                  </p>
                </div>
                <div className="category-reorder-actions">
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    aria-label="הזז למעלה"
                    disabled={index === 0}
                    onClick={() => moveCategory(c.id, 'up')}
                  >
                    <ChevronUp size={18} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    aria-label="הזז למטה"
                    disabled={index === active.length - 1}
                    onClick={() => moveCategory(c.id, 'down')}
                  >
                    <ChevronDown size={18} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm category-reorder-delete"
                    onClick={() => deleteCategory(c.id)}
                  >
                    מחק
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {inactive.length > 0 && (
          <p className="category-inactive-note">
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
            <div className="wizard-nav-row">
              <button type="submit" className="btn btn-primary">
                שמור
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
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
