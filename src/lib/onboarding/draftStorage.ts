import type { OnboardingDraft } from '../../types/onboarding';

const DRAFT_KEY = 'smb-onboarding-draft';

export function loadOnboardingDraft(userId?: string | null): OnboardingDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY}:${userId ?? 'guest'}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingDraft;
    if (parsed.version !== 1) return null;
    return parsed;
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
  return {
    version: 1,
    step: 1,
    name: '',
    mode: 'list',
    presetId: 'freelance',
    customType: '',
    primaryModel: 'event',
    additionalModels: [],
    categories: [],
    updatedAt: new Date().toISOString(),
  };
}
