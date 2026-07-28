import { FormEvent } from 'react';
import {
  getOperatingModelDefinition,
  OPERATING_MODEL_ADDITIONAL_OPTIONS,
  OPERATING_MODEL_ONBOARDING_OPTIONS,
} from '../../config/operatingModelConfig';
import type { OperatingModel } from '../../types/workspace';
import { OperatingModelSelectCard } from './OperatingModelSelectCard';

export function OnboardingStepAdditionalModels({
  primaryModel,
  additionalModels,
  onToggle,
  onBack,
  onSkip,
  onSubmit,
}: {
  primaryModel: OperatingModel;
  additionalModels: OperatingModel[];
  onToggle: (model: OperatingModel) => void;
  onBack: () => void;
  onSkip: () => void;
  onSubmit: () => void;
}) {
  const primaryDef = getOperatingModelDefinition(primaryModel);

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
        <p className="onboarding-primary-lock__label">מודל העבודה הראשי שלך</p>
        <OperatingModelSelectCard
          modelId={primaryDef.id}
          icon={primaryDef.icon}
          title={primaryDef.titleHe}
          description={primaryDef.descriptionHe}
          selected
          locked
          onSelect={() => {}}
          expandable={false}
        />
      </div>

      {primaryModel === 'hybrid' && (
        <p className="field-hint onboarding-hybrid-hint">
          בחר/י לפחות שני מודלים שמתאימים לעסק שלך.
        </p>
      )}

      {additionalOptions.length > 0 && (
        <div className="onboarding-model-grid onboarding-model-grid--compact">
          {additionalOptions.map((opt) => (
            <OperatingModelSelectCard
              key={opt.id}
              modelId={opt.id}
              icon={opt.icon}
              title={opt.titleHe}
              description={opt.descriptionHe}
              selected={additionalModels.includes(opt.id)}
              onSelect={() => onToggle(opt.id)}
              expandable={false}
            />
          ))}
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
