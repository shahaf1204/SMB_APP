import { getCapabilityEntry } from '../../config/capabilityRegistry';
import {
  BUSINESS_SETUP_FEATURE_LIST_THRESHOLD,
  getBusinessSetupFeatureLabelHe,
  resolveBusinessSetupWorkspaceSummary,
} from '../../config/businessSetupPresentationConfig';
import type {
  CapabilityKey,
  StoredBusinessCapabilityProfile,
} from '../../types/businessArchitecture';
import type { OperatingModel } from '../../types/workspace';
import {
  createEmptyCapabilityProfile,
  normalizeCapabilityProfile,
  resolveEnabledCapabilityKeys,
} from '../capabilities';
import { resolveConfigurationStatusOnEnable } from '../capabilities/configurationRequirement';
import { canNewlyEnableCapability } from '../capabilities/readiness';
import { resolveEffectiveRecommendedCapabilities } from '../capabilities/recommend';

/**
 * Phase 2B: no dedicated configuration editors yet.
 * Required capabilities without honest UI must not be activated.
 */
export function hasBusinessSetupConfigurationUI(_key: CapabilityKey): boolean {
  return false;
}

export interface BusinessSetupPresentationInput {
  businessTypePresetId?: string;
  primaryOperatingModel: OperatingModel;
  additionalOperatingModels: OperatingModel[];
  /** Optional features the user turned off among visible toggles */
  disabledFeatureKeys?: readonly CapabilityKey[];
}

export interface BusinessSetupProfileInput extends BusinessSetupPresentationInput {
  /** Edit mode: merge into existing explicit profile */
  isEditMode?: boolean;
  existingCapabilityProfile?: StoredBusinessCapabilityProfile;
}

export interface BusinessSetupFeaturePresentation {
  key: CapabilityKey;
  labelHe: string;
  /** configurationRequirement=none — shown as chip when visible; not optional enhancements */
  essential: boolean;
  removable: boolean;
  /** Rendered in the setup UI (consent surface) */
  visible: boolean;
  /** Toggle state for visible optional features */
  selected: boolean;
  /** Eligible for new activation — visible essential, or visible optional that stayed selected */
  confirmed: boolean;
}

export interface BusinessSetupPresentation {
  summary: ReturnType<typeof resolveBusinessSetupWorkspaceSummary>;
  features: BusinessSetupFeaturePresentation[];
  showFeatureList: boolean;
  emphasizeSummaryOnly: boolean;
  effectiveKeys: CapabilityKey[];
  /** Keys the setup step owns on save (visible in UI) */
  managedKeys: CapabilityKey[];
  /** Keys with user consent for new activation */
  confirmedKeys: CapabilityKey[];
}

/**
 * Essential setup features (Phase 2B.1):
 * - configurationRequirement `none` (usable without business-level setup blob)
 * - NOT optional enhancements (e.g. appointment.reminders stays removable)
 * - When visible as chips, continuing setup counts as consent
 * - When hidden (summary-only), they are NOT auto-activated — recommendation ≠ consent
 */
function isEssentialFeature(key: CapabilityKey): boolean {
  return getCapabilityEntry(key).configurationRequirement === 'none';
}

function isRemovableFeature(key: CapabilityKey): boolean {
  return getCapabilityEntry(key).configurationRequirement === 'optional';
}

function shouldActivateInProfile(key: CapabilityKey): boolean {
  if (!canNewlyEnableCapability(key)) return false;
  const requirement = getCapabilityEntry(key).configurationRequirement;
  if (requirement === 'required' && !hasBusinessSetupConfigurationUI(key)) {
    return false;
  }
  return true;
}

function resolveFeatureVisibility(
  features: BusinessSetupFeaturePresentation[],
  emphasizeSummaryOnly: boolean,
): BusinessSetupFeaturePresentation[] {
  if (emphasizeSummaryOnly) {
    return features.map((f) => ({ ...f, visible: false, confirmed: false }));
  }

  return features.map((f) => {
    const visible = true;
    let confirmed = false;
    if (f.essential) {
      confirmed = true;
    } else if (f.removable) {
      confirmed = f.selected;
    }
    return { ...f, visible, confirmed };
  });
}

function resolvePresentationFeatures(
  input: BusinessSetupPresentationInput,
): BusinessSetupFeaturePresentation[] {
  const effective = resolveEffectiveRecommendedCapabilities({
    businessType: input.businessTypePresetId,
    primaryOperatingModel: input.primaryOperatingModel,
    additionalOperatingModels: input.additionalOperatingModels,
  });

  const disabled = new Set(input.disabledFeatureKeys ?? []);

  return effective.keys.map((key) => {
    const essential = isEssentialFeature(key);
    const removable = isRemovableFeature(key);
    const selected = !disabled.has(key);
    return {
      key,
      labelHe: getBusinessSetupFeatureLabelHe(key),
      essential,
      removable,
      visible: false,
      selected: removable ? selected : true,
      confirmed: false,
    };
  });
}

export function resolveBusinessSetupPresentation(
  input: BusinessSetupPresentationInput,
): BusinessSetupPresentation {
  const rawFeatures = resolvePresentationFeatures(input);
  const emphasizeSummaryOnly = rawFeatures.length < BUSINESS_SETUP_FEATURE_LIST_THRESHOLD;
  const features = resolveFeatureVisibility(rawFeatures, emphasizeSummaryOnly);

  const summary = resolveBusinessSetupWorkspaceSummary({
    businessTypePresetId: input.businessTypePresetId,
    primaryOperatingModel: input.primaryOperatingModel,
    additionalOperatingModels: input.additionalOperatingModels,
  });

  const managedKeys = features.filter((f) => f.visible).map((f) => f.key);
  const confirmedKeys = features.filter((f) => f.confirmed).map((f) => f.key);

  return {
    summary,
    features,
    showFeatureList: features.length > 0 && !emphasizeSummaryOnly,
    emphasizeSummaryOnly,
    effectiveKeys: features.map((f) => f.key),
    managedKeys,
    confirmedKeys,
  };
}

/** Managed visible optional keys disabled relative to existing profile (edit init). */
export function resolveDefaultDisabledFeatureKeys(
  input: BusinessSetupPresentationInput & {
    existingCapabilityProfile?: StoredBusinessCapabilityProfile;
  },
): CapabilityKey[] {
  const presentation = resolveBusinessSetupPresentation(input);
  if (!input.existingCapabilityProfile) return [];

  const enabled = new Set(resolveEnabledCapabilityKeys(input.existingCapabilityProfile));
  return presentation.features
    .filter((f) => f.visible && f.removable && !enabled.has(f.key))
    .map((f) => f.key);
}

function applyConfirmedKeysToProfile(
  profile: StoredBusinessCapabilityProfile,
  confirmedKeys: readonly CapabilityKey[],
): void {
  for (const key of confirmedKeys) {
    if (!shouldActivateInProfile(key)) continue;
    profile.activation[key] = 'enabled';
    profile.configurationStatus[key] = resolveConfigurationStatusOnEnable(key);
  }
}

function clearManagedKey(profile: StoredBusinessCapabilityProfile, key: CapabilityKey): void {
  delete profile.activation[key];
  delete profile.configurationStatus[key];
}

/**
 * Merge setup-managed keys into an existing profile.
 * Out-of-scope keys (not visible / not managed by this setup UI) are preserved unchanged.
 */
export function mergeSetupIntoExistingProfile(
  existing: StoredBusinessCapabilityProfile,
  presentation: BusinessSetupPresentation,
): StoredBusinessCapabilityProfile {
  const profile = normalizeCapabilityProfile(existing) ?? createEmptyCapabilityProfile();
  const managedSet = new Set(presentation.managedKeys);
  const confirmedSet = new Set(presentation.confirmedKeys);

  for (const key of managedSet) {
    if (confirmedSet.has(key) && shouldActivateInProfile(key)) {
      const wasEnabled = profile.activation[key] === 'enabled';
      profile.activation[key] = 'enabled';
      if (!wasEnabled) {
        profile.configurationStatus[key] = resolveConfigurationStatusOnEnable(key);
      }
    } else {
      clearManagedKey(profile, key);
    }
  }

  return profile;
}

/**
 * Build or merge capability profile from onboarding setup.
 * New business: only visible confirmed keys. Hidden optional recommendations are NOT activated.
 * Edit business: preserve out-of-scope existing state; update managed keys only.
 * Returns undefined for new business when nothing was confirmed (legacy behavior until explicit activation).
 */
export function buildCapabilityProfileFromSetup(
  input: BusinessSetupProfileInput,
): StoredBusinessCapabilityProfile | undefined {
  const presentation = resolveBusinessSetupPresentation(input);

  if (input.isEditMode && input.existingCapabilityProfile) {
    return mergeSetupIntoExistingProfile(input.existingCapabilityProfile, presentation);
  }

  const profile = createEmptyCapabilityProfile();
  applyConfirmedKeysToProfile(profile, presentation.confirmedKeys);

  if (resolveEnabledCapabilityKeys(profile).length === 0) {
    return undefined;
  }

  return profile;
}

export function toggleSetupFeatureDisabled(
  disabledKeys: readonly CapabilityKey[],
  key: CapabilityKey,
  enabled: boolean,
): CapabilityKey[] {
  const set = new Set(disabledKeys);
  if (enabled) {
    set.delete(key);
  } else {
    set.add(key);
  }
  return [...set];
}

/** Whether setup UI exposes a key (for tests / diagnostics). */
export function isSetupKeyVisible(
  input: BusinessSetupPresentationInput,
  key: CapabilityKey,
): boolean {
  return resolveBusinessSetupPresentation(input).features.some(
    (f) => f.key === key && f.visible,
  );
}
