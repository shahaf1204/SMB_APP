import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { OnboardingStepAdditionalModels } from '../components/onboarding/OnboardingStepAdditionalModels';
import { OnboardingStepCategories } from '../components/onboarding/OnboardingStepCategories';
import { OnboardingStepIdentity } from '../components/onboarding/OnboardingStepIdentity';
import { OnboardingStepPrimaryModel } from '../components/onboarding/OnboardingStepPrimaryModel';
import {
  OnboardingStepReview,
  resolveBusinessTypeLabel,
} from '../components/onboarding/OnboardingStepReview';
import { buildWorkspaceFromOnboarding } from '../components/workspace/OperatingModelSettings';
import { ONBOARDING_BUSINESS_TYPE_PRESETS } from '../data/businessTypePresets';
import {
  mergeDraftWithRecommendations,
  onboardingDraftsToCategoryDefs,
  resolveRecommendedCategories,
  templatesToOnboardingDrafts,
} from '../lib/categories/resolveRecommendedCategories';
import {
  clearOnboardingDraft,
  createDefaultDraft,
  loadOnboardingDraft,
  saveOnboardingDraft,
} from '../lib/onboarding/draftStorage';
import { normalizeEnabledModels, syncWorkModelsFromWorkspace } from '../lib/workspace';
import { useAppStore } from '../store/useAppStore';
import type { OnboardingCategoryDraft, OnboardingDraft } from '../types/onboarding';
import type { OperatingModel } from '../types/workspace';
import '../components/onboarding/onboarding.css';

const STEP_TITLES: Record<OnboardingDraft['step'], { title: string; subtitle: string }> = {
  1: {
    title: 'בואו נכיר את העסק שלך',
    subtitle:
      'כמה פרטים קצרים יעזרו לנו להתאים את האפליקציה בדיוק לצורת העבודה שלך.',
  },
  2: {
    title: 'איך רוב העבודה בעסק שלך מתנהלת?',
    subtitle:
      'הבחירה תתאים את הפעילויות, הדשבורד, הטפסים והמעקב לצורת העבודה שלך. תמיד אפשר לשנות אחר כך.',
  },
  3: {
    title: 'האם יש עוד צורות עבודה בעסק שלך?',
    subtitle:
      'אפשר להוסיף מודלים נוספים עכשיו, או לדלג ולשנות זאת בהמשך בהגדרות.',
  },
  4: {
    title: 'התאמנו לך קטגוריות התחלה',
    subtitle:
      'אלו השדות שיופיעו בפעילויות שלך. אפשר להסיר, לערוך או להוסיף כל קטגוריה לפי הצרכים של העסק.',
  },
  5: {
    title: 'העסק שלך מוכן',
    subtitle: 'סיכום קצר לפני הכניסה — תמיד אפשר לערוך בהגדרות.',
  },
};

function enabledModels(primary: OperatingModel, additional: OperatingModel[]): OperatingModel[] {
  return normalizeEnabledModels(primary, additional);
}

function resolvePresetId(mode: OnboardingDraft['mode'], presetId: string): string | undefined {
  if (mode === 'custom' || presetId === '__other__') return undefined;
  return presetId;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get('mode') === 'edit';

  const user = useAppStore((s) => s.user);
  const business = useAppStore((s) => s.business);
  const createBusiness = useAppStore((s) => s.createBusiness);
  const completeBusinessSetup = useAppStore((s) => s.completeBusinessSetup);

  useEffect(() => {
    if (!editMode && business?.workspace?.onboardingCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [business, editMode, navigate]);

  const [draft, setDraft] = useState<OnboardingDraft>(() => {
    const saved = loadOnboardingDraft(user?.id);
    if (saved) return saved;
    const base = createDefaultDraft();
    if (business && editMode) {
      const ws = business.workspace;
      return {
        ...base,
        name: business.name,
        mode: business.isGeneric || !business.presetId ? 'custom' : 'list',
        presetId: business.presetId ?? 'freelance',
        customType: business.businessType,
        primaryModel: ws?.primaryOperatingModel ?? 'event',
        additionalModels:
          ws?.enabledOperatingModels.filter((m) => m !== ws.primaryOperatingModel) ?? [],
        step: 1,
      };
    }
    return base;
  });

  const persist = useCallback(
    (next: OnboardingDraft) => {
      setDraft(next);
      saveOnboardingDraft(next, user?.id);
    },
    [user?.id],
  );

  const recomputeCategories = useCallback(
    (d: OnboardingDraft): OnboardingCategoryDraft[] => {
      const presetId = resolvePresetId(d.mode, d.presetId);
      const enabled = enabledModels(d.primaryModel, d.additionalModels);
      const templates = resolveRecommendedCategories({
        presetId,
        businessType: presetId,
        primaryOperatingModel: d.primaryModel,
        enabledOperatingModels: enabled,
      });
      const fresh = templatesToOnboardingDrafts(templates);
      return d.categories.length
        ? mergeDraftWithRecommendations(d.categories, templates)
        : fresh;
    },
    [],
  );

  const goStep = (step: OnboardingDraft['step'], patch: Partial<OnboardingDraft> = {}) => {
    const next = { ...draft, ...patch, step };
    if (step === 4 && (!next.categories.length || patch.primaryModel || patch.additionalModels || patch.presetId)) {
      next.categories = recomputeCategories(next);
    }
    persist(next);
  };

  const businessTypeLabel = resolveBusinessTypeLabel(draft.mode, draft.presetId, draft.customType);

  const removedRecommendations = useMemo(
    () => draft.categories.filter((c) => !c.enabled && c.source !== 'manual'),
    [draft.categories],
  );

  const handleFinish = () => {
    const presetId = resolvePresetId(draft.mode, draft.presetId);
    const enabled = enabledModels(draft.primaryModel, draft.additionalModels);
    const workspace = buildWorkspaceFromOnboarding(
      draft.primaryModel,
      enabled,
      presetId,
    );

    const workModels = syncWorkModelsFromWorkspace(workspace);
    const categoryDefs = onboardingDraftsToCategoryDefs('pending', draft.categories);

    if (editMode && business) {
      completeBusinessSetup({
        name: draft.name.trim(),
        businessType: businessTypeLabel,
        isGeneric: draft.mode === 'custom' || draft.presetId === '__other__',
        businessTypeFromList: draft.mode === 'list' && draft.presetId !== '__other__',
        presetId,
        workModels,
        workspace,
        categoryDefs,
        mergeCategories: true,
      });
      clearOnboardingDraft(user?.id);
      navigate('/dashboard', { replace: true });
      return;
    }

    if (draft.mode === 'list' && draft.presetId !== '__other__') {
      const presetDef = ONBOARDING_BUSINESS_TYPE_PRESETS.find((p) => p.id === draft.presetId)!;
      createBusiness({
        name: draft.name.trim(),
        businessType: presetDef.label,
        isGeneric: false,
        businessTypeFromList: true,
        presetId: presetDef.id,
        workModels,
        workspace,
        categoryDefs,
      });
    } else {
      createBusiness({
        name: draft.name.trim(),
        businessType: draft.customType.trim(),
        isGeneric: true,
        businessTypeFromList: false,
        workModels,
        workspace,
        categoryDefs,
      });
    }
    clearOnboardingDraft(user?.id);
    navigate('/dashboard');
  };

  const { title, subtitle } = STEP_TITLES[draft.step];

  return (
    <div className="page onboarding-page">
      <OnboardingProgress step={draft.step} />
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{subtitle}</p>

      {draft.step === 1 && (
        <OnboardingStepIdentity
          name={draft.name}
          mode={draft.mode}
          presetId={draft.presetId}
          customType={draft.customType}
          onNameChange={(name) => persist({ ...draft, name })}
          onModeChange={(mode) => persist({ ...draft, mode })}
          onPresetChange={(presetId) => {
            if (presetId === '__other__') {
              persist({ ...draft, presetId, mode: 'custom' });
            } else {
              persist({ ...draft, presetId, mode: 'list' });
            }
          }}
          onCustomTypeChange={(customType) => persist({ ...draft, customType })}
          onSubmit={() => goStep(2)}
        />
      )}

      {draft.step === 2 && (
        <OnboardingStepPrimaryModel
          primaryModel={draft.primaryModel}
          onSelect={(primaryModel) => {
            const additionalModels =
              primaryModel !== 'hybrid'
                ? draft.additionalModels.filter((m) => m !== primaryModel)
                : [];
            persist({ ...draft, primaryModel, additionalModels });
          }}
          onBack={() => goStep(1)}
          onSubmit={() => goStep(3)}
        />
      )}

      {draft.step === 3 && (
        <OnboardingStepAdditionalModels
          primaryModel={draft.primaryModel}
          additionalModels={draft.additionalModels}
          onToggle={(model) => {
            if (draft.primaryModel !== 'hybrid' && model === draft.primaryModel) return;
            const additionalModels = draft.additionalModels.includes(model)
              ? draft.additionalModels.filter((m) => m !== model)
              : [...draft.additionalModels, model];
            persist({ ...draft, additionalModels });
          }}
          onBack={() => goStep(2)}
          onSkip={() => goStep(4, { additionalModels: [] })}
          onSubmit={() => goStep(4)}
        />
      )}

      {draft.step === 4 && (
        <OnboardingStepCategories
          categories={draft.categories}
          removedRecommendations={removedRecommendations}
          onReorder={(from, to) => {
            const enabled = draft.categories
              .filter((c) => c.enabled)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            const reordered = [...enabled];
            const [item] = reordered.splice(from, 1);
            reordered.splice(to, 0, item);
            const orderMap = new Map(reordered.map((c, i) => [c.key, i]));
            persist({
              ...draft,
              categories: draft.categories.map((c) => ({
                ...c,
                sortOrder: orderMap.has(c.key) ? orderMap.get(c.key)! : c.sortOrder + 1000,
              })),
            });
          }}
          onUpdate={(key, patch) =>
            persist({
              ...draft,
              categories: draft.categories.map((c) =>
                c.key === key ? { ...c, ...patch } : c,
              ),
            })
          }
          onRemove={(key) =>
            persist({
              ...draft,
              categories: draft.categories.map((c) =>
                c.key === key ? { ...c, enabled: false } : c,
              ),
            })
          }
          onRestore={(key) =>
            persist({
              ...draft,
              categories: draft.categories.map((c) =>
                c.key === key ? { ...c, enabled: true } : c,
              ),
            })
          }
          onReset={() =>
            persist({
              ...draft,
              categories: recomputeCategories({ ...draft, categories: [] }),
            })
          }
          onAdd={(item) =>
            persist({
              ...draft,
              categories: [
                ...draft.categories,
                { ...item, sortOrder: draft.categories.length },
              ],
            })
          }
          onBack={() => goStep(3)}
          onSubmit={() => goStep(5)}
        />
      )}

      {draft.step === 5 && (
        <OnboardingStepReview
          name={draft.name}
          businessTypeLabel={businessTypeLabel}
          primaryModel={draft.primaryModel}
          additionalModels={draft.additionalModels}
          categories={draft.categories}
          onBack={() => goStep(4)}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}
