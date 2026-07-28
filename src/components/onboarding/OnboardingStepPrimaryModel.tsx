import { FormEvent } from 'react';
import { OPERATING_MODEL_ONBOARDING_OPTIONS } from '../../config/operatingModelConfig';
import type { OperatingModel } from '../../types/workspace';
import { OperatingModelSelectCard } from './OperatingModelSelectCard';

export function OnboardingStepPrimaryModel({
  primaryModel,
  onSelect,
  onBack,
  onSubmit,
}: {
  primaryModel: OperatingModel;
  onSelect: (model: OperatingModel) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="onboarding-panel">
      <div className="onboarding-model-grid">
        {OPERATING_MODEL_ONBOARDING_OPTIONS.map((opt) => (
          <OperatingModelSelectCard
            key={opt.id}
            modelId={opt.id}
            icon={opt.icon}
            title={opt.titleHe}
            description={opt.descriptionHe}
            selected={primaryModel === opt.id}
            onSelect={() => onSelect(opt.id)}
          />
        ))}
      </div>
      <div className="onboarding-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          → חזרה
        </button>
        <button type="submit" className="btn btn-primary onboarding-cta-inline">
          המשך
        </button>
      </div>
    </form>
  );
}
