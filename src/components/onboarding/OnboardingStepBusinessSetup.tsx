import { FormEvent, useMemo, useState } from 'react';
import {
  AUTOMATION_SETUP_ADJUST_PROMPT_HE,
  AUTOMATION_SETUP_FIELDS_BRIDGE_HE,
  BUSINESS_SETUP_LOW_FEATURE_COPY_HE,
  resolvePreparedWorkspaceHighlights,
} from '../../config/businessSetupPresentationConfig';
import { resolveBusinessSetupPresentation } from '../../lib/onboarding/businessSetup';
import type { CapabilityKey } from '../../types/businessArchitecture';
import type { OperatingModel } from '../../types/workspace';

export function OnboardingStepBusinessSetup({
  businessTypePresetId,
  primaryModel,
  additionalModels,
  disabledFeatureKeys,
  onToggleFeature,
  onBack,
  onSubmit,
}: {
  businessTypePresetId?: string;
  primaryModel: OperatingModel;
  additionalModels: OperatingModel[];
  disabledFeatureKeys: CapabilityKey[];
  onToggleFeature: (key: CapabilityKey, enabled: boolean) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const presentation = useMemo(
    () =>
      resolveBusinessSetupPresentation({
        businessTypePresetId,
        primaryOperatingModel: primaryModel,
        additionalOperatingModels: additionalModels,
        disabledFeatureKeys,
      }),
    [additionalModels, businessTypePresetId, disabledFeatureKeys, primaryModel],
  );

  const preparedHighlights = useMemo(
    () =>
      resolvePreparedWorkspaceHighlights({
        businessTypePresetId,
        primaryOperatingModel: primaryModel,
        additionalOperatingModels: additionalModels,
      }),
    [additionalModels, businessTypePresetId, primaryModel],
  );

  const optionalFeatures = presentation.features.filter((f) => f.removable && f.visible);
  const hasAdjustableOptions = optionalFeatures.length > 0;

  const [showAdjustments, setShowAdjustments] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="onboarding-panel">
      <div className="onboarding-setup-summary card">
        <p className="onboarding-setup-summary__headline">{presentation.summary.headlineHe}</p>
        <ul className="onboarding-setup-prepared-list">
          {preparedHighlights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      {presentation.emphasizeSummaryOnly && (
        <p className="onboarding-setup-bridge">{BUSINESS_SETUP_LOW_FEATURE_COPY_HE}</p>
      )}

      {hasAdjustableOptions && !showAdjustments && (
        <button
          type="button"
          className="btn btn-ghost onboarding-alt-action"
          onClick={() => setShowAdjustments(true)}
        >
          {AUTOMATION_SETUP_ADJUST_PROMPT_HE}
        </button>
      )}

      {hasAdjustableOptions && showAdjustments && (
        <section className="onboarding-setup-features">
          <h2 className="onboarding-setup-features__title">אפשר לכוונן</h2>
          <p className="onboarding-setup-features__hint">
            אפשר לכבות אפשרויות שלא רלוונטיות כרגע
          </p>
          <ul className="onboarding-setup-feature-toggles">
            {optionalFeatures.map((feature) => (
              <li key={feature.key}>
                <label className="onboarding-setup-toggle">
                  <input
                    type="checkbox"
                    checked={feature.selected}
                    onChange={(e) => onToggleFeature(feature.key, e.target.checked)}
                  />
                  <span className="onboarding-setup-toggle__label">{feature.labelHe}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="onboarding-setup-bridge onboarding-setup-bridge--muted">
        {AUTOMATION_SETUP_FIELDS_BRIDGE_HE}
      </p>

      <div className="onboarding-actions onboarding-actions--split">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          חזרה
        </button>
        <button type="submit" className="btn btn-primary onboarding-cta-inline">
          נראה טוב, המשך
        </button>
      </div>
    </form>
  );
}
