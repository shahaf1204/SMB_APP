import { FormEvent } from 'react';
import {
  getOperatingModelDefinition,
  operatingModelTitleHe,
  WORKFLOW_STAGE_LABELS_HE,
} from '../../config/operatingModelConfig';
import { ONBOARDING_MODEL_CONTENT } from '../../config/onboardingModelContent';
import { ONBOARDING_BUSINESS_TYPE_PRESETS } from '../../data/businessTypePresets';
import type { OnboardingCategoryDraft } from '../../types/onboarding';
import type { OperatingModel } from '../../types/workspace';

export function OnboardingStepReview({
  name,
  businessTypeLabel,
  primaryModel,
  additionalModels,
  categories,
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
  const primaryDef = getOperatingModelDefinition(primaryModel);
  const preview = ONBOARDING_MODEL_CONTENT[primaryModel].preview;
  const enabledCount = categories.filter((c) => c.enabled).length;
  const workflowStages = primaryDef.workflowStageIds
    .slice(0, 4)
    .map((id) => WORKFLOW_STAGE_LABELS_HE[id] ?? id)
    .join(' / ');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onFinish();
  };

  return (
    <form onSubmit={handleSubmit} className="onboarding-panel">
      <div className="onboarding-review card">
        <dl className="onboarding-review-list">
          <div>
            <dt>שם העסק</dt>
            <dd>{name}</dd>
          </div>
          <div>
            <dt>סוג העסק</dt>
            <dd>{businessTypeLabel}</dd>
          </div>
          <div>
            <dt>צורת עבודה ראשית</dt>
            <dd>{primaryDef.titleHe}</dd>
          </div>
          {additionalModels.length > 0 && (
            <div>
              <dt>צורות עבודה נוספות</dt>
              <dd>{additionalModels.map(operatingModelTitleHe).join(' · ')}</dd>
            </div>
          )}
          <div>
            <dt>קטגוריות פעילות</dt>
            <dd>{enabledCount}</dd>
          </div>
        </dl>
      </div>

      <div className="onboarding-review-preview card">
        <p className="onboarding-review-preview__title">כך האפליקציה תותאם אליך</p>
        <ul className="onboarding-review-preview__list">
          <li><strong>דשבורד:</strong> {preview.dashboard}</li>
          <li><strong>כפתור ראשי:</strong> {preview.primaryAction}</li>
          <li><strong>תצוגה:</strong> {preview.view}</li>
          {workflowStages && (
            <li><strong>תהליך:</strong> {workflowStages}</li>
          )}
          <li><strong>כרטיס פעילות:</strong> {primaryDef.defaultTerminology.activitySingular}</li>
        </ul>
      </div>

      <div className="onboarding-actions onboarding-actions--split">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          חזרה לעריכה
        </button>
        <button type="submit" className="btn btn-primary onboarding-cta-inline">
          כניסה לעסק שלי
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
