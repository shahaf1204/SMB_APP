import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { OnboardingStepAdditionalModels } from '../components/onboarding/OnboardingStepAdditionalModels';
import { OnboardingStepBusinessSetup } from '../components/onboarding/OnboardingStepBusinessSetup';
import { OnboardingStepCategories } from '../components/onboarding/OnboardingStepCategories';
import { OnboardingStepIdentity } from '../components/onboarding/OnboardingStepIdentity';
import { OnboardingStepPrimaryModel } from '../components/onboarding/OnboardingStepPrimaryModel';
import { OnboardingStepReview, resolveBusinessTypeLabel } from '../components/onboarding/OnboardingStepReview';
import { resolveBusinessTypeOperatingRecommendation } from '../config/businessTypeRecommendationConfig';
import {
  mergeDraftWithRecommendations,
  resolveRecommendedCategories,
  templatesToOnboardingDrafts,
} from '../lib/categories/resolveRecommendedCategories';
import { createDefaultDraft } from '../lib/onboarding/draftStorage';
import { toggleSetupFeatureDisabled } from '../lib/onboarding/businessSetup';
import {
  acceptRecommendedPrimaryModel,
  applyBusinessTypeChangeToDraft,
  applyClarificationChoiceToDraft,
  selectManualPrimaryModel,
  shouldShowConfirmedRecommendation,
} from '../lib/onboarding/primaryModelDraft';
import { normalizeEnabledModels } from '../lib/workspace';
import type { CapabilityKey } from '../types/businessArchitecture';
import type { OnboardingCategoryDraft, OnboardingDraft } from '../types/onboarding';
import '../components/onboarding/onboarding.css';

const STEP_META: Record<OnboardingDraft['step'], { title: string; subtitle: string }> = {
  1: { title: 'בואו נכיר את העסק שלך', subtitle: 'תצוגה מבודדת — לא נשמר לעסק' },
  2: { title: 'כך נראה שהכי נכון לנהל את העסק שלך', subtitle: 'תצוגה מבודדת' },
  3: { title: 'האם יש עוד צורות עבודה?', subtitle: 'תצוגה מבודדת' },
  4: { title: 'התאמת סביבת העבודה', subtitle: 'תצוגה מבודדת' },
  5: { title: 'קטגוריות התחלה', subtitle: 'תצוגה מבודדת' },
  6: { title: 'סיכום', subtitle: 'תצוגה מבודדת' },
};

const SHOWCASE_PRESETS: Array<{
  id: string;
  label: string;
  patch: Partial<OnboardingDraft>;
}> = [
  {
    id: 'beauty',
    label: 'Beauty + Appointment',
    patch: {
      presetId: 'beauty',
      mode: 'list',
      primaryModel: 'appointment',
      additionalModels: [],
      primaryModelConfirmed: true,
      primaryModelSource: 'recommended',
    },
  },
  {
    id: 'tutor',
    label: 'Tutor + Appointment + Package',
    patch: {
      presetId: 'tutor',
      mode: 'list',
      primaryModel: 'appointment',
      additionalModels: ['package'],
      primaryModelConfirmed: true,
      primaryModelSource: 'recommended',
    },
  },
  {
    id: 'photographer',
    label: 'Photographer + Event + Project',
    patch: {
      presetId: 'photographer',
      mode: 'list',
      primaryModel: 'event',
      additionalModels: ['project'],
      primaryModelConfirmed: true,
      primaryModelSource: 'recommended',
    },
  },
  {
    id: 'custom',
    label: 'Custom fallback',
    patch: {
      presetId: '__other__',
      mode: 'custom',
      customType: 'עסק מותאם',
      primaryModel: 'appointment',
      additionalModels: [],
      primaryModelConfirmed: true,
      primaryModelSource: 'manual',
    },
  },
];

function resolveStep2Meta(draft: OnboardingDraft) {
  const resolved = resolveBusinessTypeOperatingRecommendation(draft.mode, draft.presetId);
  if (resolved.kind === 'fallback' || draft.primaryModelSource === 'manual') {
    return {
      title: 'ספרי לנו איך רוב העבודה שלך מתנהלת',
      subtitle: 'תצוגה מבודדת',
    };
  }
  if (
    resolved.kind === 'clarification' &&
    !draft.clarificationChoiceId &&
    !draft.primaryModelConfirmed
  ) {
    return {
      title: resolved.clarification.questionHe,
      subtitle: 'תצוגה מבודדת',
    };
  }
  if (
    shouldShowConfirmedRecommendation(
      draft.primaryModelConfirmed,
      draft.primaryModelSource,
      false,
    )
  ) {
    return { title: 'כך בחרת לנהל את רוב העבודה', subtitle: 'תצוגה מבודדת' };
  }
  return STEP_META[2];
}

/** Dev-only onboarding preview — isolated state, no store writes */
export function OnboardingShowcasePage() {
  const [draft, setDraft] = useState<OnboardingDraft>(createDefaultDraft);

  const recompute = (d: OnboardingDraft): OnboardingCategoryDraft[] => {
    const presetId = d.mode === 'custom' || d.presetId === '__other__' ? undefined : d.presetId;
    const enabled = normalizeEnabledModels(d.primaryModel, d.additionalModels);
    const templates = resolveRecommendedCategories({
      presetId,
      primaryOperatingModel: d.primaryModel,
      enabledOperatingModels: enabled,
    });
    return d.categories.length
      ? mergeDraftWithRecommendations(d.categories, templates)
      : templatesToOnboardingDrafts(templates);
  };

  const go = (step: OnboardingDraft['step'], patch: Partial<OnboardingDraft> = {}) => {
    const next = { ...draft, ...patch, step };
    if (step === 5) next.categories = recompute(next);
    setDraft(next);
  };

  const loadPreset = (preset: (typeof SHOWCASE_PRESETS)[number]) => {
    setDraft({
      ...createDefaultDraft(),
      name: 'סטודיו לדוגמה',
      step: 4,
      setupDisabledFeatures: [],
      ...preset.patch,
    });
  };

  const meta = draft.step === 2 ? resolveStep2Meta(draft) : STEP_META[draft.step];

  return (
    <div className="page onboarding-page">
      <Link to="/dev/design-system" className="back-link">← Design system</Link>
      <p className="field-hint" style={{ marginBottom: '0.75rem' }}>
        תצוגת פיתוח — שינויים לא נשמרים לעסק
      </p>
      <div className="onboarding-actions__end" style={{ marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {SHOWCASE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => loadPreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <OnboardingProgress step={draft.step} />
      <h1 className="page-title">{meta.title}</h1>
      <p className="page-subtitle">{meta.subtitle}</p>

      {draft.step === 1 && (
        <OnboardingStepIdentity
          name={draft.name}
          mode={draft.mode}
          presetId={draft.presetId}
          customType={draft.customType}
          onNameChange={(name) => setDraft({ ...draft, name })}
          onModeChange={(mode) => setDraft({ ...draft, mode })}
          onPresetChange={(presetId) =>
            setDraft(
              applyBusinessTypeChangeToDraft(
                draft,
                presetId,
                presetId === '__other__' ? 'custom' : 'list',
              ),
            )
          }
          onCustomTypeChange={(customType) => setDraft({ ...draft, customType })}
          onSubmit={() => go(2)}
        />
      )}
      {draft.step === 2 && (
        <OnboardingStepPrimaryModel
          mode={draft.mode}
          presetId={draft.presetId}
          primaryModel={draft.primaryModel}
          primaryModelConfirmed={draft.primaryModelConfirmed}
          primaryModelSource={draft.primaryModelSource}
          clarificationChoiceId={draft.clarificationChoiceId}
          onAcceptRecommendation={(primaryModel) =>
            go(3, acceptRecommendedPrimaryModel(draft, primaryModel))
          }
          onSelectManual={(primaryModel) => go(3, selectManualPrimaryModel(draft, primaryModel))}
          onClarificationChoice={(choiceId, primaryModel) =>
            setDraft(applyClarificationChoiceToDraft(draft, choiceId, primaryModel))
          }
          onContinueConfirmed={() => go(3)}
          onBack={() => go(1)}
        />
      )}
      {draft.step === 3 && (
        <OnboardingStepAdditionalModels
          mode={draft.mode}
          presetId={draft.presetId}
          clarificationChoiceId={draft.clarificationChoiceId}
          primaryModel={draft.primaryModel}
          additionalModels={draft.additionalModels}
          onToggle={(model) => {
            const additionalModels = draft.additionalModels.includes(model)
              ? draft.additionalModels.filter((m) => m !== model)
              : [...draft.additionalModels, model];
            setDraft({ ...draft, additionalModels });
          }}
          onBack={() => go(2)}
          onSkip={() => go(4, { additionalModels: [] })}
          onSubmit={() => go(4)}
        />
      )}
      {draft.step === 4 && (
        <OnboardingStepBusinessSetup
          businessTypePresetId={draft.presetId !== '__other__' ? draft.presetId : undefined}
          primaryModel={draft.primaryModel}
          additionalModels={draft.additionalModels}
          disabledFeatureKeys={draft.setupDisabledFeatures ?? []}
          onToggleFeature={(key: CapabilityKey, enabled) =>
            setDraft({
              ...draft,
              setupDisabledFeatures: toggleSetupFeatureDisabled(
                draft.setupDisabledFeatures ?? [],
                key,
                enabled,
              ),
            })
          }
          onBack={() => go(3)}
          onSubmit={() => go(5, { categories: recompute(draft) })}
        />
      )}
      {draft.step === 5 && (
        <OnboardingStepCategories
          categories={draft.categories}
          removedRecommendations={draft.categories.filter((c) => !c.enabled && c.source !== 'manual')}
          businessType={draft.presetId !== '__other__' ? draft.presetId : undefined}
          operatingModel={draft.primaryModel}
          onReorder={() => {}}
          onUpdate={(key, patch) =>
            setDraft({
              ...draft,
              categories: draft.categories.map((c) => (c.key === key ? { ...c, ...patch } : c)),
            })
          }
          onRemove={(key) =>
            setDraft({
              ...draft,
              categories: draft.categories.map((c) =>
                c.key === key ? { ...c, enabled: false } : c,
              ),
            })
          }
          onRestore={(key) =>
            setDraft({
              ...draft,
              categories: draft.categories.map((c) =>
                c.key === key ? { ...c, enabled: true } : c,
              ),
            })
          }
          onReset={() => setDraft({ ...draft, categories: recompute({ ...draft, categories: [] }) })}
          onAdd={(item) =>
            setDraft({
              ...draft,
              categories: [...draft.categories, { ...item, sortOrder: draft.categories.length }],
            })
          }
          onBack={() => go(4)}
          onSubmit={() => go(6)}
        />
      )}
      {draft.step === 6 && (
        <OnboardingStepReview
          name={draft.name || 'סטודיו לדוגמה'}
          businessTypeLabel={resolveBusinessTypeLabel(draft.mode, draft.presetId, draft.customType)}
          primaryModel={draft.primaryModel}
          additionalModels={draft.additionalModels}
          categories={draft.categories}
          onBack={() => go(5)}
          onFinish={() => go(1, createDefaultDraft())}
        />
      )}
    </div>
  );
}
