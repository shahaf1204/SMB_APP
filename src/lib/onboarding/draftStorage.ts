import { resolveBusinessTypeOperatingRecommendation } from '../../config/businessTypeRecommendationConfig';
import type { OnboardingDraft } from '../../types/onboarding';
import { resolvePlaceholderPrimaryModel } from './primaryModelDraft';

const DRAFT_KEY = 'smb-onboarding-draft';

function normalizeOnboardingDraft(parsed: OnboardingDraft): OnboardingDraft {
  const resolved = resolveBusinessTypeOperatingRecommendation(parsed.mode, parsed.presetId);
  const legacyConfirmed =
    parsed.primaryModelConfirmed ??
    (parsed.step > 2 ? true : undefined);
  const legacySource =
    parsed.primaryModelSource ??
    (parsed.step > 2 ? 'manual' : 'none');

  return {
    ...parsed,
    primaryModelConfirmed: legacyConfirmed ?? false,
    primaryModelSource: legacySource,
    primaryModel:
      legacyConfirmed === false && parsed.primaryModelSource == null
        ? resolvePlaceholderPrimaryModel(resolved)
        : parsed.primaryModel,
  };
}

export function loadOnboardingDraft(userId?: string | null): OnboardingDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY}:${userId ?? 'guest'}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingDraft;
    if (parsed.version !== 1) return null;
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
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
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
    version: 1,
    step: 1,
    name: '',
    mode,
    presetId,
    customType: '',
    primaryModel: resolvePlaceholderPrimaryModel(resolved),
    additionalModels: [],
    primaryModelConfirmed: false,
    primaryModelSource: 'none',
    categories: [],
    updatedAt: new Date().toISOString(),
  };
}
