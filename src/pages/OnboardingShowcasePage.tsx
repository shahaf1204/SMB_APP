import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { OnboardingStepAdditionalModels } from '../components/onboarding/OnboardingStepAdditionalModels';
import { OnboardingStepCategories } from '../components/onboarding/OnboardingStepCategories';
import { OnboardingStepIdentity } from '../components/onboarding/OnboardingStepIdentity';
import { OnboardingStepPrimaryModel } from '../components/onboarding/OnboardingStepPrimaryModel';
import { OnboardingStepReview, resolveBusinessTypeLabel } from '../components/onboarding/OnboardingStepReview';
import {
  mergeDraftWithRecommendations,
  resolveRecommendedCategories,
  templatesToOnboardingDrafts,
} from '../lib/categories/resolveRecommendedCategories';
import { createDefaultDraft } from '../lib/onboarding/draftStorage';
import { normalizeEnabledModels } from '../lib/workspace';
import type { OnboardingCategoryDraft, OnboardingDraft } from '../types/onboarding';
import '../components/onboarding/onboarding.css';

const STEP_META: Record<OnboardingDraft['step'], { title: string; subtitle: string }> = {
  1: { title: 'בואו נכיר את העסק שלך', subtitle: 'תצוגה מבודדת — לא נשמר לעסק' },
  2: { title: 'איך רוב העבודה בעסק שלך מתנהלת?', subtitle: 'תצוגה מבודדת' },
  3: { title: 'האם יש עוד צורות עבודה?', subtitle: 'תצוגה מבודדת' },
  4: { title: 'קטגוריות התחלה', subtitle: 'תצוגה מבודדת' },
  5: { title: 'סיכום', subtitle: 'תצוגה מבודדת' },
};

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
    if (step === 4) next.categories = recompute(next);
    setDraft(next);
  };

  const meta = STEP_META[draft.step];

  return (
    <div className="page onboarding-page">
      <Link to="/dev/design-system" className="back-link">← Design system</Link>
      <p className="field-hint" style={{ marginBottom: '0.75rem' }}>
        תצוגת פיתוח — שינויים לא נשמרים לעסק
      </p>
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
            setDraft({
              ...draft,
              presetId,
              mode: presetId === '__other__' ? 'custom' : 'list',
            })
          }
          onCustomTypeChange={(customType) => setDraft({ ...draft, customType })}
          onSubmit={() => go(2)}
        />
      )}
      {draft.step === 2 && (
        <OnboardingStepPrimaryModel
          primaryModel={draft.primaryModel}
          onSelect={(primaryModel) => setDraft({ ...draft, primaryModel })}
          onBack={() => go(1)}
          onSubmit={() => go(3)}
        />
      )}
      {draft.step === 3 && (
        <OnboardingStepAdditionalModels
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
        <OnboardingStepCategories
          categories={draft.categories}
          removedRecommendations={draft.categories.filter((c) => !c.enabled && c.source !== 'manual')}
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
          onBack={() => go(3)}
          onSubmit={() => go(5)}
        />
      )}
      {draft.step === 5 && (
        <OnboardingStepReview
          name={draft.name || 'סטודיו לדוגמה'}
          businessTypeLabel={resolveBusinessTypeLabel(draft.mode, draft.presetId, draft.customType)}
          primaryModel={draft.primaryModel}
          additionalModels={draft.additionalModels}
          categories={draft.categories}
          onBack={() => go(4)}
          onFinish={() => go(1, createDefaultDraft())}
        />
      )}
    </div>
  );
}
