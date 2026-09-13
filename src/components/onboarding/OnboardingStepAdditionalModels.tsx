import { FormEvent, useState } from 'react';
import {
  resolveSupportingModelPrompts,
  shouldUseContextualSupportingModelFlow,
} from '../../config/supportingModelPresentationConfig';
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

  const promptInput = { mode, presetId, clarificationChoiceId, primaryModel };
  const contextualPrompts = resolveSupportingModelPrompts(promptInput);
  const useContextualFlow = shouldUseContextualSupportingModelFlow(promptInput);

  const [showFullPicker, setShowFullPicker] = useState(
    primaryModel === 'hybrid' || !useContextualFlow,
  );

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

  const handlePromptAccept = (targetModel: OperatingModel) => {
    if (!additionalModels.includes(targetModel)) {
      onToggle(targetModel);
    }
  };

  const handlePromptDecline = (targetModel: OperatingModel) => {
    if (additionalModels.includes(targetModel)) {
      onToggle(targetModel);
    }
  };

  if (showFullPicker) {
    return (
      <form onSubmit={handleSubmit} className="onboarding-panel">
        {primaryModel === 'hybrid' && (
          <>
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
            <p className="field-hint onboarding-hybrid-hint">
              בחר/י לפחות שני סוגי עבודה שמתאימים לעסק שלך.
            </p>
          </>
        )}

        {!useContextualFlow && primaryModel !== 'hybrid' && (
          <p className="field-hint onboarding-additional-intro">
            יש עוד דרכים שבהן העסק שלך עובד? אפשר להוסיף — או להמשיך בלי.
          </p>
        )}

        <div className="onboarding-model-grid onboarding-model-grid--compact">
          {additionalOptions.map((opt) => {
            const recommended = isRecommendedAdditionalModel(recommendation, opt.id);
            const hint = resolveAdditionalHint(recommendation, opt.id);
            const title =
              opt.id === 'hybrid' ? opt.titleHe : WORKING_STYLE_LABELS_HE[opt.id];

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

        <div className="onboarding-actions onboarding-actions--split">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (useContextualFlow && primaryModel !== 'hybrid') {
                setShowFullPicker(false);
              } else {
                onBack();
              }
            }}
          >
            → חזרה
          </button>
          <div className="onboarding-actions__end">
            {primaryModel !== 'hybrid' && (
              <button type="button" className="btn btn-ghost" onClick={onSkip}>
                המשך בלי להוסיף
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={primaryModel === 'hybrid' && additionalModels.length < 2}
            >
              המשך
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="onboarding-panel">
      {contextualPrompts.map((prompt) => {
        const selected = additionalModels.includes(prompt.targetModel);
        return (
          <div key={prompt.targetModel} className="onboarding-contextual-prompt card">
            <p className="onboarding-contextual-prompt__question">{prompt.questionHe}</p>
            <p className="onboarding-contextual-prompt__value">{prompt.valueExplanationHe}</p>
            <div className="onboarding-contextual-prompt__actions">
              <button
                type="button"
                className={`btn ${selected ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handlePromptAccept(prompt.targetModel)}
              >
                {prompt.acceptLabelHe}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => handlePromptDecline(prompt.targetModel)}
              >
                {prompt.declineLabelHe}
              </button>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        className="btn btn-ghost onboarding-alt-action onboarding-contextual-prompt__more"
        onClick={() => setShowFullPicker(true)}
      >
        העסק שלי עובד בצורה נוספת
      </button>

      <div className="onboarding-actions onboarding-actions--split">
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

/** Whether the full supporting-model picker is visible (for tests). */
export function isFullSupportingModelPickerVisible(
  showFullPicker: boolean,
): boolean {
  return showFullPicker;
}
