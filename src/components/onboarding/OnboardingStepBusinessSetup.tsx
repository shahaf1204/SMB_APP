import { FormEvent, useMemo } from 'react';
import {
  BUSINESS_SETUP_FIELDS_BRIDGE_HE,
  BUSINESS_SETUP_LOW_FEATURE_COPY_HE,
} from '../../config/businessSetupPresentationConfig';
import {
  resolveBusinessSetupPresentation,
} from '../../lib/onboarding/businessSetup';
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

  const essentialFeatures = presentation.features.filter((f) => f.essential);
  const optionalFeatures = presentation.features.filter((f) => f.removable);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="onboarding-panel">
      <div className="onboarding-setup-summary card">
        <p className="onboarding-setup-summary__headline">{presentation.summary.headlineHe}</p>
        <p className="onboarding-setup-summary__body">{presentation.summary.bodyHe}</p>
      </div>

      {presentation.emphasizeSummaryOnly ? (
        <p className="onboarding-setup-bridge">{BUSINESS_SETUP_LOW_FEATURE_COPY_HE}</p>
      ) : (
        presentation.showFeatureList && (
          <div className="onboarding-setup-features">
            {essentialFeatures.length > 0 && (
              <section className="onboarding-setup-features__group">
                <h2 className="onboarding-setup-features__title">מה המערכת תפעיל עבורך</h2>
                <ul className="onboarding-setup-feature-chips" aria-label="יכולות פעילות">
                  {essentialFeatures.map((feature) => (
                    <li
                      key={feature.key}
                      className="onboarding-setup-feature-chip onboarding-setup-feature-chip--essential"
                    >
                      {feature.labelHe}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {optionalFeatures.length > 0 && (
              <section className="onboarding-setup-features__group">
                <h2 className="onboarding-setup-features__title">מומלץ גם</h2>
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
                          onChange={(e) =>
                            onToggleFeature(
                              feature.key,
                              e.target.checked,
                            )
                          }
                        />
                        <span className="onboarding-setup-toggle__label">{feature.labelHe}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )
      )}

      <p className="onboarding-setup-bridge onboarding-setup-bridge--muted">
        {BUSINESS_SETUP_FIELDS_BRIDGE_HE}
      </p>

      <div className="onboarding-actions onboarding-actions--split">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          חזרה
        </button>
        <button type="submit" className="btn btn-primary onboarding-cta-inline">
          המשך
        </button>
      </div>
    </form>
  );
}
