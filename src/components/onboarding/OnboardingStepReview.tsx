import { FormEvent } from 'react';
import { resolveOnboardingReviewContent } from '../../config/onboardingReviewContent';
import type { OnboardingCategoryDraft } from '../../types/onboarding';
import type { OperatingModel } from '../../types/workspace';
import { ONBOARDING_BUSINESS_TYPE_PRESETS } from '../../data/businessTypePresets';

export function OnboardingStepReview({
  name,
  businessTypeLabel,
  primaryModel,
  additionalModels: _additionalModels,
  categories: _categories,
  onBack,
  onFinish,
}: {
  name: string;
  businessTypeLabel: string;
  primaryModel: OperatingModel;
  additionalModels: OperatingModel[];
  categories: OnboardingCategoryDraft[];
  onBack: () => void;
  onFinish: () => void;
}) {
  const content = resolveOnboardingReviewContent(primaryModel);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onFinish();
  };

  return (
    <form onSubmit={handleSubmit} className="onboarding-panel">
      <div className="onboarding-ready card">
        <p className="onboarding-ready__title">{content.readyTitleHe}</p>
        <p className="onboarding-ready__subtitle">{content.readySubtitleHe}</p>
        <p className="onboarding-ready__business-name">{name}</p>
        <p className="onboarding-ready__business-type">{businessTypeLabel}</p>
      </div>

      <ul className="onboarding-ready-value-list">
        {content.valueBulletsHe.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>

      <div className="onboarding-actions onboarding-actions--split">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          חזרה לעריכה
        </button>
        <button type="submit" className="btn btn-primary onboarding-cta-inline">
          {content.primaryActionLabelHe}
        </button>
      </div>
    </form>
  );
}

export function resolveBusinessTypeLabel(
  mode: 'list' | 'custom',
  presetId: string,
  customType: string,
): string {
  if (mode === 'custom' || presetId === '__other__') return customType.trim();
  return ONBOARDING_BUSINESS_TYPE_PRESETS.find((p) => p.id === presetId)?.label ?? customType;
}
