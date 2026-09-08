import { resolveBusinessTypeOperatingRecommendation } from '../../config/businessTypeRecommendationConfig';
import type { CapabilityKey, StoredBusinessCapabilityProfile } from '../../types/businessArchitecture';
import type { OnboardingDraft } from '../../types/onboarding';
import { resolveDefaultDisabledFeatureKeys } from './businessSetup';
import { resolvePlaceholderPrimaryModel } from './primaryModelDraft';

const DRAFT_KEY = 'smb-onboarding-draft';

interface LegacyOnboardingDraftV1 extends Omit<OnboardingDraft, 'version' | 'step'> {
  version: 1;
  step: 1 | 2 | 3 | 4 | 5;
}

function migrateDraftVersion(parsed: LegacyOnboardingDraftV1 | OnboardingDraft): OnboardingDraft {
  if (parsed.version === 2) return parsed;

  const step = parsed.step >= 4 ? ((parsed.step + 1) as OnboardingDraft['step']) : parsed.step;
  return {
    ...parsed,
    version: 2,
    step,
    setupDisabledFeatures: [],
  };
}

function normalizeOnboardingDraft(parsed: OnboardingDraft | LegacyOnboardingDraftV1): OnboardingDraft {
  const migrated = parsed.version === 1 ? migrateDraftVersion(parsed) : parsed;
  const resolved = resolveBusinessTypeOperatingRecommendation(migrated.mode, migrated.presetId);
  const legacyConfirmed =
    migrated.primaryModelConfirmed ??
    (migrated.step > 2 ? true : undefined);
  const legacySource =
    migrated.primaryModelSource ??
    (migrated.step > 2 ? 'manual' : 'none');

  return {
    ...migrated,
    primaryModelConfirmed: legacyConfirmed ?? false,
    primaryModelSource: legacySource,
    primaryModel:
      legacyConfirmed === false && migrated.primaryModelSource == null
        ? resolvePlaceholderPrimaryModel(resolved)
        : migrated.primaryModel,
    setupDisabledFeatures: migrated.setupDisabledFeatures ?? [],
  };
}

export function loadOnboardingDraft(userId?: string | null): OnboardingDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY}:${userId ?? 'guest'}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingDraft | LegacyOnboardingDraftV1;
    if (parsed.version !== 1 && parsed.version !== 2) return null;
    return normalizeOnboardingDraft(parsed);
  } catch {
    return null;
  }
}

export function saveOnboardingDraft(draft: OnboardingDraft, userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      `${DRAFT_KEY}:${userId ?? 'guest'}`,
      JSON.stringify({ ...draft, version: 2, updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* quota exceeded — non-fatal */
  }
}

export function clearOnboardingDraft(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${DRAFT_KEY}:${userId ?? 'guest'}`);
}

export function createDefaultDraft(): OnboardingDraft {
  const mode = 'list';
  const presetId = 'freelance';
  const resolved = resolveBusinessTypeOperatingRecommendation(mode, presetId);
  return {
    version: 2,
    step: 1,
    name: '',
    mode,
    presetId,
    customType: '',
    primaryModel: resolvePlaceholderPrimaryModel(resolved),
    additionalModels: [],
    primaryModelConfirmed: false,
    primaryModelSource: 'none',
    setupDisabledFeatures: [],
    categories: [],
    updatedAt: new Date().toISOString(),
  };
}

/** Initialize setup disabled keys from an existing capability profile (edit mode). */
export function initializeSetupDisabledFromProfile(
  draft: OnboardingDraft,
  presetId: string | undefined,
  existingProfile: StoredBusinessCapabilityProfile | undefined,
): CapabilityKey[] {
  if (!existingProfile) return draft.setupDisabledFeatures ?? [];
  return resolveDefaultDisabledFeatureKeys({
    businessTypePresetId: presetId,
    primaryOperatingModel: draft.primaryModel,
    additionalOperatingModels: draft.additionalModels,
    existingCapabilityProfile: existingProfile,
  });
}
