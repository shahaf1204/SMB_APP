import { FormEvent, useState } from 'react';
import { GripVertical, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { CATEGORY_SOURCE_BADGE_HE } from '../../config/categoryTemplates';
import type { OnboardingCategoryDraft } from '../../types/onboarding';
import type { MetricRole, ValueType } from '../../types/models';

const VALUE_TYPES: ValueType[] = ['text', 'number', 'date', 'duration'];
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

export function CategoryCustomizeList({
  categories,
  removedRecommendations,
  onReorder,
  onUpdate,
  onRemove,
  onRestore,
  onReset,
  onAdd,
}: {
  categories: OnboardingCategoryDraft[];
  removedRecommendations: OnboardingCategoryDraft[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onUpdate: (key: string, patch: Partial<OnboardingCategoryDraft>) => void;
  onRemove: (key: string) => void;
  onRestore: (key: string) => void;
  onReset: () => void;
  onAdd: (draft: Omit<OnboardingCategoryDraft, 'sortOrder'>) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ValueType>('text');
  const [newMetric, setNewMetric] = useState<MetricRole>('neutral');

  const enabled = [...categories]
    .filter((c) => c.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleDrop = (targetIndex: number) => {
    if (dragIndex == null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    onReorder(dragIndex, targetIndex);
    setDragIndex(null);
  };

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd({
      key: `manual-${Date.now()}`,
      name: newName.trim(),
      valueType: newType,
      metricRole: newMetric,
      source: 'manual',
      isProtected: false,
      isRequired: false,
      enabled: true,
    });
    setNewName('');
    setNewType('text');
    setNewMetric('neutral');
    setShowAdd(false);
  };

  return (
    <div className="onboarding-categories">
      <ul className="onboarding-category-list">
        {enabled.map((cat, index) => (
          <li
            key={cat.key}
            className={`onboarding-category-row card ${dragIndex === index ? 'onboarding-category-row--dragging' : ''}`}
            draggable={!cat.isProtected}
            onDragStart={() => setDragIndex(index)}
            onDragEnd={() => setDragIndex(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
          >
            <span className="onboarding-category-grip" aria-hidden>
              <GripVertical size={18} strokeWidth={2} />
            </span>
            <div className="onboarding-category-body">
              {editKey === cat.key ? (
                <input
                  className="onboarding-category-edit-input"
                  value={cat.name}
                  onChange={(e) => onUpdate(cat.key, { name: e.target.value })}
                  onBlur={() => setEditKey(null)}
                  autoFocus
                  aria-label="עריכת שם קטגוריה"
                />
              ) : (
                <strong>{cat.name}</strong>
              )}
              <div className="onboarding-category-meta">
                <span>{VALUE_TYPE_LABELS[cat.valueType]}</span>
                {cat.valueType === 'number' && (
                  <span> · {METRIC_LABELS[cat.metricRole]}</span>
                )}
                <span className={`onboarding-category-badge onboarding-category-badge--${cat.source}`}>
                  {CATEGORY_SOURCE_BADGE_HE[cat.source]}
                </span>
              </div>
              {cat.isProtected && (
                <p className="onboarding-category-protected-hint">
                  שדה בסיסי — נדרש לתפקוד המערכת
                </p>
              )}
            </div>
            <div className="onboarding-category-actions">
              <button
                type="button"
                className="btn btn-icon btn-ghost"
                aria-label={`עריכת ${cat.name}`}
                onClick={() => setEditKey(cat.key)}
              >
                <Pencil size={16} />
              </button>
              {cat.valueType === 'number' && !cat.isProtected && (
                <select
                  className="onboarding-category-metric-select"
                  value={cat.metricRole}
                  aria-label="תפקיד מetric"
                  onChange={(e) =>
                    onUpdate(cat.key, { metricRole: e.target.value as MetricRole })
                  }
                >
                  <option value="neutral">כללי</option>
                  <option value="revenue">הכנסה</option>
                  <option value="expense">הוצאה</option>
                </select>
              )}
              {!cat.isProtected && (
                <button
                  type="button"
                  className="btn btn-icon btn-ghost"
                  aria-label={`הסרת ${cat.name}`}
                  onClick={() => onRemove(cat.key)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {removedRecommendations.length > 0 && (
        <div className="onboarding-category-removed">
          <p className="field-hint">המלצות שהוסרו</p>
          <div className="onboarding-category-removed-chips">
            {removedRecommendations.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className="chip"
                onClick={() => onRestore(cat.key)}
              >
                + {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="onboarding-category-toolbar">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowAdd((v) => !v)}
        >
          <Plus size={16} aria-hidden /> הוספת קטגוריה
        </button>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          <RotateCcw size={16} aria-hidden /> איפוס להמלצות
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="onboarding-category-add card">
          <div className="field">
            <label htmlFor="new-cat-name">שם הקטגוריה</label>
            <input
              id="new-cat-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="new-cat-type">סוג הערך</label>
              <select
                id="new-cat-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value as ValueType)}
              >
                {VALUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {VALUE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            {newType === 'number' && (
              <div className="field">
                <label htmlFor="new-cat-metric">תפקיד</label>
                <select
                  id="new-cat-metric"
                  value={newMetric}
                  onChange={(e) => setNewMetric(e.target.value as MetricRole)}
                >
                  <option value="neutral">כללי</option>
                  <option value="revenue">הכנסה</option>
                  <option value="expense">הוצאה</option>
                </select>
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            הוספה
          </button>
        </form>
      )}
    </div>
  );
}
