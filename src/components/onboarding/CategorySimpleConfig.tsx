import { ChevronDown, Plus, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { partitionDraftsForOnboarding } from '../../lib/activityForm/resolveActivityFormSchema';
import type { OnboardingCategoryDraft } from '../../types/onboarding';
import type { OperatingModel } from '../../types/workspace';

export function CategorySimpleConfig({
  categories,
  businessType,
  operatingModel,
  onToggle,
  onAddClick,
  onOpenAdvanced,
}: {
  categories: OnboardingCategoryDraft[];
  businessType?: string;
  operatingModel: OperatingModel;
  onToggle: (key: string, enabled: boolean) => void;
  onAddClick: () => void;
  onOpenAdvanced: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  const partition = useMemo(
    () =>
      partitionDraftsForOnboarding(categories, {
        businessType,
        operatingModel,
      }),
    [categories, businessType, operatingModel],
  );

  return (
    <div className="field-config-simple">
      <section className="field-config-block">
        <div className="field-config-block__head">
          <h3 className="field-config-block__title">שדות בסיסיים</h3>
          <span className="field-config-badge">שדות בסיסיים</span>
        </div>
        <p className="field-config-core-summary">
          {partition.coreSummaryLabels.join(' · ')}
        </p>
        <p className="field-hint field-config-core-hint">
          תמיד כלולים בטופס — לא ניתן להסיר
        </p>
      </section>

      {partition.recommended.length > 0 && (
        <section className="field-config-block">
          <h3 className="field-config-block__title">{partition.recommendedTitle}</h3>
          <ul className="field-config-toggle-list">
            {partition.recommended.map((cat) => (
              <li key={cat.key}>
                <label className="field-config-toggle-row">
                  <span className="field-config-toggle-row__label">{cat.name}</span>
                  <input
                    type="checkbox"
                    className="field-config-toggle"
                    checked={cat.enabled}
                    onChange={(e) => onToggle(cat.key, e.target.checked)}
                    aria-label={`${cat.enabled ? 'הסר' : 'הוסף'} ${cat.name}`}
                  />
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      {partition.more.length > 0 && (
        <section className="field-config-block field-config-block--collapsible">
          <button
            type="button"
            className="field-config-collapse-trigger"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
          >
            <span>עוד שדות</span>
            <ChevronDown
              size={18}
              className={`field-config-collapse-icon ${moreOpen ? 'field-config-collapse-icon--open' : ''}`}
              aria-hidden
            />
          </button>
          {moreOpen && (
            <ul className="field-config-toggle-list">
              {partition.more.map((cat) => (
                <li key={cat.key}>
                  <label className="field-config-toggle-row">
                    <span className="field-config-toggle-row__label">{cat.name}</span>
                    <input
                      type="checkbox"
                      className="field-config-toggle"
                      checked={cat.enabled}
                      onChange={(e) => onToggle(cat.key, e.target.checked)}
                      aria-label={`${cat.enabled ? 'הסר' : 'הוסף'} ${cat.name}`}
                    />
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="field-config-simple-actions">
        <button type="button" className="btn btn-ghost field-config-add-btn" onClick={onAddClick}>
          <Plus size={16} aria-hidden /> הוספת שדה מותאם אישית
        </button>
        <button type="button" className="btn btn-ghost" onClick={onOpenAdvanced}>
          <Settings2 size={16} aria-hidden /> עריכת סדר ושדות
        </button>
      </div>
    </div>
  );
}
