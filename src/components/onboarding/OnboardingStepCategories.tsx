import { FormEvent, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CategoryCustomizeList } from './CategoryCustomizeList';
import { CategoryFormPreview } from './CategoryFormPreview';
import { CategorySimpleConfig } from './CategorySimpleConfig';
import {
  resolveFieldPreviewPresentation,
  shouldOpenFieldCustomizationOnEdit,
} from '../../lib/onboarding/fieldPreviewPresentation';
import type { OnboardingCategoryDraft } from '../../types/onboarding';
import type { OperatingModel } from '../../types/workspace';

export function OnboardingStepCategories({
  categories,
  removedRecommendations,
  businessType,
  operatingModel,
  isEditMode = false,
  onReorder,
  onUpdate,
  onRemove,
  onRestore,
  onReset,
  onAdd,
  onBack,
  onSubmit,
}: {
  categories: OnboardingCategoryDraft[];
  removedRecommendations: OnboardingCategoryDraft[];
  businessType?: string;
  operatingModel: OperatingModel;
  isEditMode?: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onUpdate: (key: string, patch: Partial<OnboardingCategoryDraft>) => void;
  onRemove: (key: string) => void;
  onRestore: (key: string) => void;
  onReset: () => void;
  onAdd: (draft: Omit<OnboardingCategoryDraft, 'sortOrder'>) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const preview = resolveFieldPreviewPresentation({
    categories,
    businessType,
    operatingModel,
  });

  const [customizationMode, setCustomizationMode] = useState(
    isEditMode && shouldOpenFieldCustomizationOnEdit(categories),
  );
  const [advancedMode, setAdvancedMode] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleToggle = (key: string, enabled: boolean) => {
    if (enabled) onRestore(key);
    else onRemove(key);
  };

  if (advancedMode) {
    return (
      <form onSubmit={handleSubmit} className="onboarding-panel">
        <button
          type="button"
          className="btn btn-ghost field-config-back-simple"
          onClick={() => setAdvancedMode(false)}
        >
          <ArrowRight size={16} aria-hidden /> חזרה
        </button>
        <CategoryCustomizeList
          categories={categories}
          removedRecommendations={removedRecommendations}
          onReorder={onReorder}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onRestore={onRestore}
          onReset={onReset}
          onAdd={onAdd}
        />
        <div className="onboarding-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            → חזרה
          </button>
          <button type="submit" className="btn btn-primary">
            המשך
          </button>
        </div>
      </form>
    );
  }

  if (customizationMode) {
    return (
      <form onSubmit={handleSubmit} className="onboarding-panel">
        <button
          type="button"
          className="btn btn-ghost field-config-back-simple"
          onClick={() => setCustomizationMode(false)}
        >
          <ArrowRight size={16} aria-hidden /> חזרה לתצוגה המקדימה
        </button>
        <CategorySimpleConfig
          categories={categories}
          businessType={businessType}
          operatingModel={operatingModel}
          onToggle={handleToggle}
          onAddClick={() => setAdvancedMode(true)}
          onOpenAdvanced={() => setAdvancedMode(true)}
        />
        <div className="onboarding-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            → חזרה
          </button>
          <button type="submit" className="btn btn-primary">
            המשך
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="onboarding-panel">
      <CategoryFormPreview
        categories={categories}
        businessType={businessType}
        operatingModel={operatingModel}
      />

      {preview.alsoSavingLabels.length > 0 && (
        <div className="onboarding-field-also-saving card">
          <p className="onboarding-field-also-saving__title">נשמור גם:</p>
          <p className="onboarding-field-also-saving__list">
            {preview.alsoSavingLabels.join(' · ')}
          </p>
        </div>
      )}

      {preview.hasCustomizationSurface && (
        <button
          type="button"
          className="btn btn-ghost onboarding-alt-action"
          onClick={() => setCustomizationMode(true)}
        >
          רוצה לשנות את הפרטים?
        </button>
      )}

      <div className="onboarding-actions onboarding-actions--split">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          → חזרה
        </button>
        <button type="submit" className="btn btn-primary onboarding-cta-inline">
          נראה טוב
        </button>
      </div>
    </form>
  );
}

/** Whether detailed field controls are shown (for tests). */
export function isFieldCustomizationModeVisible(customizationMode: boolean): boolean {
  return customizationMode;
}
