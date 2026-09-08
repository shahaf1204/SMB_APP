import { FormEvent } from 'react';
import {
  getAdditionalModelHintHe,
  isRecommendedAdditionalModel,
  resolveEffectiveOperatingRecommendation,
  WORKING_STYLE_LABELS_HE,
  type BusinessTypeOperatingRecommendation,
} from '../../config/businessTypeRecommendationConfig';
import {
  getOperatingModelDefinition,
  OPERATING_MODEL_ADDITIONAL_OPTIONS,
  OPERATING_MODEL_ONBOARDING_OPTIONS,
} from '../../config/operatingModelConfig';
import type { OperatingModel } from '../../types/workspace';
import { OperatingModelSelectCard } from './OperatingModelSelectCard';

function resolveAdditionalHint(
  recommendation: BusinessTypeOperatingRecommendation | undefined,
  model: OperatingModel,
): string | undefined {
  if (!recommendation || model === 'hybrid') return undefined;
  if (!isRecommendedAdditionalModel(recommendation, model)) return undefined;
  return getAdditionalModelHintHe(recommendation, model);
}

export function OnboardingStepAdditionalModels({
  mode,
  presetId,
  clarificationChoiceId,
  primaryModel,
  additionalModels,
  onToggle,
  onBack,
  onSkip,
  onSubmit,
}: {
  mode: 'list' | 'custom';
  presetId: string;
  clarificationChoiceId?: string;
  primaryModel: OperatingModel;
  additionalModels: OperatingModel[];
  onToggle: (model: OperatingModel) => void;
  onBack: () => void;
  onSkip: () => void;
  onSubmit: () => void;
}) {
  const primaryDef = getOperatingModelDefinition(primaryModel);
  const resolved = resolveEffectiveOperatingRecommendation(mode, presetId, clarificationChoiceId);
  const recommendation =
    resolved.kind === 'recommended' ? resolved.recommendation : undefined;

  const primaryTitle =
    primaryModel === 'hybrid'
      ? primaryDef.titleHe
      : WORKING_STYLE_LABELS_HE[primaryModel];

  const additionalOptions =
    primaryModel === 'hybrid'
      ? OPERATING_MODEL_ONBOARDING_OPTIONS.filter((o) => o.id !== 'hybrid')
      : OPERATING_MODEL_ADDITIONAL_OPTIONS.filter((o) => o.id !== primaryModel);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (primaryModel === 'hybrid' && additionalModels.length < 2) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="onboarding-panel">
      <div className="onboarding-primary-lock card">
        <p className="onboarding-primary-lock__label">כך בחרת לנהל את רוב העבודה</p>
        <OperatingModelSelectCard
          modelId={primaryDef.id}
          icon={primaryDef.icon}
          title={primaryTitle}
          description={primaryDef.descriptionHe}
          selected
          locked
          onSelect={() => {}}
          expandable={false}
        />
      </div>

      {primaryModel === 'hybrid' && (
        <p className="field-hint onboarding-hybrid-hint">
          בחר/י לפחות שני סוגי עבודה שמתאימים לעסק שלך.
        </p>
      )}

      {primaryModel !== 'hybrid' && additionalOptions.length > 0 && (
        <p className="field-hint onboarding-additional-intro">
          יש עוד דרכים שבהן העסק שלך עובד? אפשר להוסיף — או לדלג ולשנות בהמשך.
        </p>
      )}

      {additionalOptions.length > 0 && (
        <div className="onboarding-model-grid onboarding-model-grid--compact">
          {additionalOptions.map((opt) => {
            const recommended = isRecommendedAdditionalModel(recommendation, opt.id);
            const hint = resolveAdditionalHint(recommendation, opt.id);
            const title =
              opt.id === 'hybrid'
                ? opt.titleHe
                : WORKING_STYLE_LABELS_HE[opt.id];

            return (
              <OperatingModelSelectCard
                key={opt.id}
                modelId={opt.id}
                icon={opt.icon}
                title={title}
                description={hint ?? opt.descriptionHe}
                selected={additionalModels.includes(opt.id)}
                onSelect={() => onToggle(opt.id)}
                expandable={false}
                badge={recommended ? 'מומלץ' : undefined}
              />
            );
          })}
        </div>
      )}

      <div className="onboarding-actions onboarding-actions--split">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          → חזרה
        </button>
        <div className="onboarding-actions__end">
          {primaryModel !== 'hybrid' && (
            <button type="button" className="btn btn-ghost" onClick={onSkip}>
              לא עכשיו
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={primaryModel === 'hybrid' && additionalModels.length < 2}
          >
            המשך לקטגוריות
          </button>
        </div>
      </div>
    </form>
  );
}
