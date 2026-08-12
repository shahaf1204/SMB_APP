import { FormEvent, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CategoryCustomizeList } from './CategoryCustomizeList';
import { CategoryFormPreview } from './CategoryFormPreview';
import { CategorySimpleConfig } from './CategorySimpleConfig';
import type { OnboardingCategoryDraft } from '../../types/onboarding';
import type { OperatingModel } from '../../types/workspace';

export function OnboardingStepCategories({
  categories,
  removedRecommendations,
  businessType,
  operatingModel,
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
  onReorder: (fromIndex: number, toIndex: number) => void;
  onUpdate: (key: string, patch: Partial<OnboardingCategoryDraft>) => void;
  onRemove: (key: string) => void;
  onRestore: (key: string) => void;
  onReset: () => void;
  onAdd: (draft: Omit<OnboardingCategoryDraft, 'sortOrder'>) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showAddInSimple, setShowAddInSimple] = useState(false);

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
          <ArrowRight size={16} aria-hidden /> חזרה להגדרה פשוטה
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
            המשך לסיכום
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
      <CategorySimpleConfig
        categories={categories}
        businessType={businessType}
        operatingModel={operatingModel}
        onToggle={handleToggle}
        onAddClick={() => setShowAddInSimple(true)}
        onOpenAdvanced={() => setAdvancedMode(true)}
      />
      {showAddInSimple && (
        <CategoryCustomizeList
          categories={categories}
          removedRecommendations={removedRecommendations}
          onReorder={onReorder}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onRestore={onRestore}
          onReset={onReset}
          onAdd={(draft) => {
            onAdd(draft);
            setShowAddInSimple(false);
          }}
          addOnly
        />
      )}
      <div className="onboarding-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          → חזרה
        </button>
        <button type="submit" className="btn btn-primary">
          המשך לסיכום
        </button>
      </div>
    </form>
  );
}
