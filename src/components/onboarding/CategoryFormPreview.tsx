import { ONBOARDING_FORM_BUILTIN_FIELDS } from '../../config/onboardingModelContent';
import type { OnboardingCategoryDraft } from '../../types/onboarding';

const TYPE_LABELS = {
  text: 'טקסט',
  number: 'מספר',
  date: 'תאריך',
  duration: 'שעה',
};

export function CategoryFormPreview({
  categories,
}: {
  categories: OnboardingCategoryDraft[];
}) {
  const enabled = categories.filter((c) => c.enabled).slice(0, 5);
  const rows = [
    ...ONBOARDING_FORM_BUILTIN_FIELDS.map((f) => ({
      key: `builtin-${f.label}`,
      label: f.label,
      type: f.type,
    })),
    ...enabled.map((c) => ({
      key: c.key,
      label: c.name,
      type: c.valueType,
    })),
  ].slice(0, 5);

  return (
    <div className="onboarding-form-preview card" aria-label="תצוגה מקדימה של טופס יצירת פעילות">
      <p className="onboarding-form-preview__title">כך ייראה טופס יצירת הפעילות שלך</p>
      <div className="onboarding-form-preview__fields">
        {rows.map((row) => (
          <div key={row.key} className="onboarding-form-preview__field">
            <span className="onboarding-form-preview__label">{row.label}</span>
            <span className="onboarding-form-preview__input" aria-hidden />
            <span className="onboarding-form-preview__type">
              {TYPE_LABELS[row.type as keyof typeof TYPE_LABELS] ?? row.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
