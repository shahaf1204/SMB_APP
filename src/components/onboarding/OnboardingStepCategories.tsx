import { FormEvent } from 'react';
import { CategoryCustomizeList } from './CategoryCustomizeList';
import { CategoryFormPreview } from './CategoryFormPreview';
import type { OnboardingCategoryDraft } from '../../types/onboarding';

export function OnboardingStepCategories({
  categories,
  removedRecommendations,
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
  onReorder: (fromIndex: number, toIndex: number) => void;
  onUpdate: (key: string, patch: Partial<OnboardingCategoryDraft>) => void;
  onRemove: (key: string) => void;
  onRestore: (key: string) => void;
  onReset: () => void;
  onAdd: (draft: Omit<OnboardingCategoryDraft, 'sortOrder'>) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="onboarding-panel">
      <CategoryFormPreview categories={categories} />
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
