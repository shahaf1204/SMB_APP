import { useMemo } from 'react';
import {
  buildOnboardingPreviewRows,
  resolveActivityFormSchemaFromDrafts,
} from '../../lib/activityForm/resolveActivityFormSchema';
import type { OnboardingCategoryDraft } from '../../types/onboarding';
import type { OperatingModel } from '../../types/workspace';

export function CategoryFormPreview({
  categories,
  businessType,
  operatingModel,
}: {
  categories: OnboardingCategoryDraft[];
  businessType?: string;
  operatingModel: OperatingModel;
}) {
  const rows = useMemo(() => {
    const schema = resolveActivityFormSchemaFromDrafts({
      drafts: categories,
      businessType,
      operatingModel,
    });
    return buildOnboardingPreviewRows(schema, { businessType, operatingModel });
  }, [categories, businessType, operatingModel]);

  return (
    <div className="onboarding-form-preview" aria-label="תצוגה מקדימה של טופס יצירת פעילות">
      <p className="onboarding-form-preview__title">כך ייראה הטופס שלך</p>
      <div className="onboarding-form-preview__fields">
        {rows.map((row) => (
          <div key={row.key} className="onboarding-form-preview__field">
            <span className="onboarding-form-preview__label">{row.label}</span>
            <span className="onboarding-form-preview__value" aria-hidden>
              {row.example}
            </span>
          </div>
        ))}
      </div>
      <p className="onboarding-form-preview__note">תצוגה מקדימה בלבד</p>
    </div>
  );
}
