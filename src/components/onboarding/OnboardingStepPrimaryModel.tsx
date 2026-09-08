import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  NEW_USER_ONBOARDING_PICKER_OPTIONS,
  resolveBusinessTypeOperatingRecommendation,
  resolveEffectiveOperatingRecommendation,
  WORKING_STYLE_LABELS_HE,
} from '../../config/businessTypeRecommendationConfig';
import { getOperatingModelDefinition, HYBRID_OPERATING_MODEL } from '../../config/operatingModelConfig';
import type { PrimaryModelSelectionSource } from '../../types/onboarding';
import type { OperatingModel } from '../../types/workspace';
import {
  shouldShowClarification,
  shouldShowConfirmedRecommendation,
  shouldShowRecommendationFirst,
} from '../../lib/onboarding/primaryModelDraft';
import { OperatingModelSelectCard } from './OperatingModelSelectCard';

export function OnboardingStepPrimaryModel({
  mode,
  presetId,
  primaryModel,
  primaryModelConfirmed,
  primaryModelSource,
  clarificationChoiceId,
  allowLegacyHybridInPicker,
  onAcceptRecommendation,
  onSelectManual,
  onClarificationChoice,
  onContinueConfirmed,
  onBack,
}: {
  mode: 'list' | 'custom';
  presetId: string;
  primaryModel: OperatingModel;
  primaryModelConfirmed: boolean;
  primaryModelSource: PrimaryModelSelectionSource;
  clarificationChoiceId?: string;
  /** Edit mode only — existing hybrid primary may remain selectable */
  allowLegacyHybridInPicker?: boolean;
  onAcceptRecommendation: (model: OperatingModel) => void;
  onSelectManual: (model: OperatingModel) => void;
  onClarificationChoice: (choiceId: string, primaryModel: OperatingModel) => void;
  onContinueConfirmed: () => void;
  onBack: () => void;
}) {
  const resolved = resolveBusinessTypeOperatingRecommendation(mode, presetId);
  const effective = resolveEffectiveOperatingRecommendation(mode, presetId, clarificationChoiceId);

  const [showAlternativePicker, setShowAlternativePicker] = useState(
    primaryModelSource === 'manual' || resolved.kind === 'fallback',
  );
  const [pickerSelection, setPickerSelection] = useState<OperatingModel | null>(
    primaryModelSource === 'manual' ? primaryModel : null,
  );

  const recommendationKey = useMemo(() => {
    if (resolved.kind === 'clarification') {
      return `${resolved.clarification.businessTypePresetId}:${clarificationChoiceId ?? 'pending'}`;
    }
    if (resolved.kind === 'recommended') {
      return resolved.recommendation.businessTypePresetId;
    }
    return 'fallback';
  }, [resolved, clarificationChoiceId]);

  useEffect(() => {
    if (resolved.kind === 'fallback') {
      setShowAlternativePicker(true);
      return;
    }
    if (primaryModelSource === 'manual') {
      setShowAlternativePicker(true);
      return;
    }
    setShowAlternativePicker(false);
    setPickerSelection(null);
  }, [recommendationKey, resolved.kind, primaryModelSource]);

  const pickerOptions = useMemo(() => {
    if (allowLegacyHybridInPicker) {
      return [...NEW_USER_ONBOARDING_PICKER_OPTIONS, HYBRID_OPERATING_MODEL];
    }
    return NEW_USER_ONBOARDING_PICKER_OPTIONS;
  }, [allowLegacyHybridInPicker]);

  const showConfirmed = shouldShowConfirmedRecommendation(
    primaryModelConfirmed,
    primaryModelSource,
    showAlternativePicker,
  );
  const showClarification = shouldShowClarification(
    resolved,
    clarificationChoiceId,
    primaryModelSource,
    showAlternativePicker,
    primaryModelConfirmed,
  );
  const showRecommendation = shouldShowRecommendationFirst(
    effective,
    primaryModelSource,
    showAlternativePicker,
    primaryModelConfirmed,
  );

  const handleAccept = (e: FormEvent) => {
    e.preventDefault();
    if (effective.kind !== 'recommended') return;
    onAcceptRecommendation(effective.recommendation.recommendedPrimary);
  };

  const handleConfirmedContinue = (e: FormEvent) => {
    e.preventDefault();
    onContinueConfirmed();
  };

  const handlePickerSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!pickerSelection) return;
    onSelectManual(pickerSelection);
  };

  const handleShowAlternative = () => {
    setShowAlternativePicker(true);
  };

  const handleCancelAlternative = () => {
    setShowAlternativePicker(false);
    if (primaryModelSource === 'manual') {
      setPickerSelection(primaryModel);
    }
  };

  if (showConfirmed) {
    const modelDef = getOperatingModelDefinition(primaryModel);
    const title =
      primaryModel === 'hybrid'
        ? modelDef.titleHe
        : WORKING_STYLE_LABELS_HE[primaryModel as keyof typeof WORKING_STYLE_LABELS_HE];

    return (
      <form onSubmit={handleConfirmedContinue} className="onboarding-panel">
        <div className="onboarding-recommendation">
          <OperatingModelSelectCard
            modelId={primaryModel}
            icon={modelDef.icon}
            title={title}
            description={modelDef.descriptionHe}
            selected
            locked
            onSelect={() => {}}
            expandable={false}
            confirmedBadge="נבחר ✓"
          />
        </div>
        <div className="onboarding-actions onboarding-actions--recommendation">
          <button type="submit" className="btn btn-primary onboarding-cta-inline">
            המשך
          </button>
          <button
            type="button"
            className="btn btn-ghost onboarding-alt-action"
            onClick={handleShowAlternative}
          >
            אני רוצה לבחור דרך עבודה אחרת
          </button>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            → חזרה
          </button>
        </div>
      </form>
    );
  }

  if (showClarification && resolved.kind === 'clarification') {
    return (
      <div className="onboarding-panel">
        <p className="onboarding-clarification-question">{resolved.clarification.questionHe}</p>
        <div className="onboarding-clarification-options">
          {resolved.clarification.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="onboarding-clarification-option"
              onClick={() =>
                onClarificationChoice(option.id, option.recommendation.recommendedPrimary)
              }
            >
              {option.labelHe}
            </button>
          ))}
        </div>
        <div className="onboarding-actions">
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            → חזרה
          </button>
          <button
            type="button"
            className="btn btn-ghost onboarding-alt-action"
            onClick={handleShowAlternative}
          >
            אני עובדת אחרת
          </button>
        </div>
      </div>
    );
  }

  if (showRecommendation && effective.kind === 'recommended') {
    const { recommendedPrimary, explanationHe } = effective.recommendation;
    const modelDef = getOperatingModelDefinition(recommendedPrimary);

    return (
      <form onSubmit={handleAccept} className="onboarding-panel">
        <div className="onboarding-recommendation">
          <OperatingModelSelectCard
            modelId={recommendedPrimary}
            icon={modelDef.icon}
            title={WORKING_STYLE_LABELS_HE[recommendedPrimary]}
            description={explanationHe}
            selected
            locked
            onSelect={() => {}}
            expandable={false}
          />
        </div>
        <div className="onboarding-actions onboarding-actions--recommendation">
          <button type="submit" className="btn btn-primary onboarding-cta-inline">
            המשך עם ההמלצה
          </button>
          <button
            type="button"
            className="btn btn-ghost onboarding-alt-action"
            onClick={handleShowAlternative}
          >
            אני עובדת אחרת
          </button>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            → חזרה
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handlePickerSubmit} className="onboarding-panel">
      <div className="onboarding-model-grid">
        {pickerOptions.map((opt) => (
          <OperatingModelSelectCard
            key={opt.id}
            modelId={opt.id}
            icon={opt.icon}
            title={
              opt.id === 'hybrid'
                ? opt.titleHe
                : WORKING_STYLE_LABELS_HE[opt.id]
            }
            description={opt.descriptionHe}
            selected={pickerSelection === opt.id}
            onSelect={() => setPickerSelection(opt.id)}
            expandable={opt.id !== 'hybrid'}
          />
        ))}
      </div>
      <div className="onboarding-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={
            primaryModelConfirmed && primaryModelSource === 'recommended'
              ? handleCancelAlternative
              : onBack
          }
        >
          → חזרה
        </button>
        <button
          type="submit"
          className="btn btn-primary onboarding-cta-inline"
          disabled={!pickerSelection}
        >
          המשך
        </button>
      </div>
    </form>
  );
}
