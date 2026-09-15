import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  NEW_USER_ONBOARDING_PICKER_OPTIONS,
  resolveBusinessTypeOperatingRecommendation,
  resolveEffectiveOperatingRecommendation,
  WORKING_STYLE_LABELS_HE,
  type RecommendableOperatingModel,
} from '../../config/businessTypeRecommendationConfig';
import { getOperatingModelDefinition, HYBRID_OPERATING_MODEL } from '../../config/operatingModelConfig';
import type { PrimaryModelSelectionSource } from '../../types/onboarding';
import type { OperatingModel } from '../../types/workspace';
import {
  defaultShowAlternativePicker,
  resolvePrimaryStepPresentation,
} from '../../lib/onboarding/primaryStepPresentation';
import { OperatingModelSelectCard } from './OperatingModelSelectCard';

const RECOMMENDED_FOR_YOU_BADGE = 'מומלץ עבורך';
const RECOMMENDED_FOR_YOU_WITH_CHECK = 'מומלץ עבורך ✓';
const YOUR_CHOICE_BADGE = 'הבחירה שלך ✓';

function primaryModelTitleHe(model: OperatingModel): string {
  if (model === 'hybrid') return getOperatingModelDefinition(model).titleHe;
  return WORKING_STYLE_LABELS_HE[model as RecommendableOperatingModel];
}

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
  allowLegacyHybridInPicker?: boolean;
  onAcceptRecommendation: (model: OperatingModel) => void;
  onSelectManual: (model: OperatingModel) => void;
  onClarificationChoice: (choiceId: string, primaryModel: OperatingModel) => void;
  onContinueConfirmed: () => void;
  onBack: () => void;
}) {
  const resolved = resolveBusinessTypeOperatingRecommendation(mode, presetId);
  const effective = resolveEffectiveOperatingRecommendation(mode, presetId, clarificationChoiceId);

  const [showAlternativePicker, setShowAlternativePicker] = useState(() =>
    defaultShowAlternativePicker(mode, presetId, primaryModelSource),
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
    setShowAlternativePicker(defaultShowAlternativePicker(mode, presetId, primaryModelSource));
    if (primaryModelSource === 'manual') {
      setPickerSelection(primaryModel);
    } else {
      setPickerSelection(null);
    }
  }, [recommendationKey, mode, presetId, primaryModelSource, primaryModel]);

  const presentation = resolvePrimaryStepPresentation({
    mode,
    presetId,
    clarificationChoiceId,
    selectedPrimaryModel: primaryModel,
    primaryModelSource,
    primaryModelConfirmed,
    showAlternativePicker,
  });

  const recommendedPrimary = presentation.recommendedPrimaryModel;
  const isFollowingRecommendation = presentation.isFollowingRecommendation;
  const hasManualOverride = presentation.hasManualOverride;

  const pickerOptions = useMemo(() => {
    if (allowLegacyHybridInPicker) {
      return [...NEW_USER_ONBOARDING_PICKER_OPTIONS, HYBRID_OPERATING_MODEL];
    }
    return NEW_USER_ONBOARDING_PICKER_OPTIONS;
  }, [allowLegacyHybridInPicker]);

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

  const handleSwitchToRecommendation = (e: FormEvent) => {
    e.preventDefault();
    if (!recommendedPrimary) return;
    onAcceptRecommendation(recommendedPrimary);
  };

  if (presentation.view === 'dual_recommended_selected' && recommendedPrimary && hasManualOverride) {
    const recommendedDef = getOperatingModelDefinition(recommendedPrimary);
    const selectedDef = getOperatingModelDefinition(primaryModel);
    const recommendedTitle = primaryModelTitleHe(recommendedPrimary);
    const selectedTitle = primaryModelTitleHe(primaryModel);
    const explanationHe =
      effective.kind === 'recommended' ? effective.recommendation.explanationHe : recommendedDef.descriptionHe;

    return (
      <form onSubmit={handleConfirmedContinue} className="onboarding-panel">
        <div className="onboarding-primary-dual">
          <OperatingModelSelectCard
            modelId={recommendedPrimary}
            icon={recommendedDef.icon}
            title={recommendedTitle}
            description={explanationHe}
            selected={primaryModel === recommendedPrimary}
            locked
            onSelect={() => {}}
            expandable={false}
            badge={RECOMMENDED_FOR_YOU_BADGE}
          />
          <OperatingModelSelectCard
            modelId={primaryModel}
            icon={selectedDef.icon}
            title={selectedTitle}
            description={selectedDef.descriptionHe}
            selected
            locked
            onSelect={() => {}}
            expandable={false}
            confirmedBadge={YOUR_CHOICE_BADGE}
          />
        </div>
        <div className="onboarding-actions onboarding-actions--recommendation">
          <button type="submit" className="btn btn-primary onboarding-cta-inline">
            להמשיך עם הבחירה שלי
          </button>
          <button
            type="button"
            className="btn btn-secondary onboarding-cta-inline"
            onClick={(e) => void handleSwitchToRecommendation(e)}
          >
            לעבור להמלצה
          </button>
          <button
            type="button"
            className="btn btn-ghost onboarding-alt-action"
            onClick={handleShowAlternative}
          >
            העסק שלי עובד אחרת
          </button>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            → חזרה
          </button>
        </div>
      </form>
    );
  }

  if (presentation.view === 'confirmed_single') {
    const modelDef = getOperatingModelDefinition(primaryModel);
    const title =
      primaryModel === 'hybrid'
        ? modelDef.titleHe
        : WORKING_STYLE_LABELS_HE[primaryModel as keyof typeof WORKING_STYLE_LABELS_HE];
    const showMatchingRecommendationBadge = isFollowingRecommendation;

    return (
      <form onSubmit={handleConfirmedContinue} className="onboarding-panel">
        <div className="onboarding-recommendation">
          <OperatingModelSelectCard
            modelId={primaryModel}
            icon={modelDef.icon}
            title={title}
            description={
              effective.kind === 'recommended' && showMatchingRecommendationBadge
                ? effective.recommendation.explanationHe
                : modelDef.descriptionHe
            }
            selected
            locked
            onSelect={() => {}}
            expandable={false}
            badge={
              showMatchingRecommendationBadge ? RECOMMENDED_FOR_YOU_WITH_CHECK : undefined
            }
            confirmedBadge={
              showMatchingRecommendationBadge ? undefined : 'נבחר ✓'
            }
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
            העסק שלי עובד אחרת
          </button>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            → חזרה
          </button>
        </div>
      </form>
    );
  }

  if (presentation.view === 'clarification' && resolved.kind === 'clarification') {
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
            העסק שלי עובד אחרת
          </button>
        </div>
      </div>
    );
  }

  if (presentation.view === 'recommendation_first' && effective.kind === 'recommended') {
    const { recommendedPrimary: recPrimary, explanationHe } = effective.recommendation;
    const modelDef = getOperatingModelDefinition(recPrimary);

    return (
      <form onSubmit={handleAccept} className="onboarding-panel">
        <div className="onboarding-recommendation">
          <OperatingModelSelectCard
            modelId={recPrimary}
            icon={modelDef.icon}
            title={primaryModelTitleHe(recPrimary)}
            description={explanationHe}
            selected
            locked
            onSelect={() => {}}
            expandable={false}
            badge={RECOMMENDED_FOR_YOU_WITH_CHECK}
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
            העסק שלי עובד אחרת
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
      {recommendedPrimary && (
        <div className="onboarding-recommendation onboarding-recommendation--hint">
          <OperatingModelSelectCard
            modelId={recommendedPrimary}
            icon={getOperatingModelDefinition(recommendedPrimary).icon}
            title={primaryModelTitleHe(recommendedPrimary)}
            description={
              effective.kind === 'recommended'
                ? effective.recommendation.explanationHe
                : getOperatingModelDefinition(recommendedPrimary).descriptionHe
            }
            selected={false}
            locked
            onSelect={() => {}}
            expandable={false}
            badge={RECOMMENDED_FOR_YOU_BADGE}
          />
        </div>
      )}
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
            confirmedBadge={
              pickerSelection === opt.id && opt.id === primaryModel ? YOUR_CHOICE_BADGE : undefined
            }
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
              : recommendedPrimary
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
