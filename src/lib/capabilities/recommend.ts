import {
  ADDITIONAL_MODEL_CAPABILITY_EXTENSIONS,
  BUSINESS_TYPE_PRIMARY_CAPABILITY_RECOMMENDATIONS,
  isRecommendableOperatingModel,
  PRIMARY_MODEL_CAPABILITY_BASELINE,
  resolvePrimaryCapabilityBaseline,
} from '../../config/businessTypeCapabilityRecommendations';
import { getCapabilityEntry } from '../../config/capabilityRegistry';
import type { CapabilityKey } from '../../types/businessArchitecture';
import type { OperatingModel } from '../../types/workspace';
import {
  filterToUserExposableItems,
  filterToUserExposableKeys,
} from './readiness';

export type CapabilityRecommendationSource =
  | 'primary_baseline'
  | 'business_type'
  | 'additional_model'
  | 'hybrid_legacy';

export interface RecommendedCapabilityItem {
  key: CapabilityKey;
  source: CapabilityRecommendationSource;
}

export interface CapabilityRecommendationInput {
  businessType?: string;
  primaryOperatingModel: OperatingModel;
  /** Supporting models — excludes primary and hybrid */
  additionalOperatingModels?: OperatingModel[];
  /** When primary is hybrid (legacy), union baselines from these enabled models */
  enabledOperatingModels?: OperatingModel[];
}

export interface ResolvedCapabilityRecommendations {
  primaryOperatingModel: OperatingModel;
  businessType?: string;
  additionalOperatingModels: OperatingModel[];
  items: RecommendedCapabilityItem[];
  keys: CapabilityKey[];
}

/** Architectural potential + effective user-facing recommendation sets. */
export interface CapabilityRecommendationSets {
  /** Ideal future configuration from business type + models (includes planned). */
  architectural: ResolvedCapabilityRecommendations;
  /** Honest recommendations for Phase 2B / user configuration (excludes planned). */
  effective: ResolvedCapabilityRecommendations;
}

function dedupeKeys(items: RecommendedCapabilityItem[]): RecommendedCapabilityItem[] {
  const seen = new Set<CapabilityKey>();
  const out: RecommendedCapabilityItem[] = [];
  for (const item of items) {
    if (seen.has(item.key)) continue;
    seen.add(item.key);
    out.push(item);
  }
  return out;
}

function hasBusinessTypeOverride(
  businessType: string | undefined,
  primary: RecommendableOperatingModel,
): boolean {
  if (!businessType?.trim()) return false;
  const override = BUSINESS_TYPE_PRIMARY_CAPABILITY_RECOMMENDATIONS[businessType]?.[primary];
  return Boolean(override && override.length > 0);
}

type RecommendableOperatingModel = Exclude<OperatingModel, 'hybrid'>;

function buildRecommendationResult(
  input: CapabilityRecommendationInput,
  items: RecommendedCapabilityItem[],
): ResolvedCapabilityRecommendations {
  const additionalModels = resolveAdditionalModels(
    input.primaryOperatingModel,
    input.additionalOperatingModels,
    input.enabledOperatingModels,
  );
  const deduped = dedupeKeys(items);
  return {
    primaryOperatingModel: input.primaryOperatingModel,
    businessType: input.businessType,
    additionalOperatingModels: additionalModels,
    items: deduped,
    keys: deduped.map((i) => i.key),
  };
}

function resolveHybridLegacyRecommendations(
  enabledModels: OperatingModel[],
  businessType?: string,
): RecommendedCapabilityItem[] {
  const models = enabledModels.filter(isRecommendableOperatingModel);
  const items: RecommendedCapabilityItem[] = [];
  for (const model of models) {
    for (const key of resolvePrimaryCapabilityBaseline(model, businessType)) {
      items.push({ key, source: 'hybrid_legacy' });
    }
  }
  return dedupeKeys(items);
}

function resolveAdditionalModels(
  primary: OperatingModel,
  additional: OperatingModel[] | undefined,
  enabled: OperatingModel[] | undefined,
): OperatingModel[] {
  const combined = [...(additional ?? []), ...(enabled ?? [])];
  return [...new Set(combined.filter((m) => m !== primary && m !== 'hybrid'))];
}

function resolveArchitecturalItems(input: CapabilityRecommendationInput): RecommendedCapabilityItem[] {
  const { primaryOperatingModel, businessType } = input;
  const additionalModels = resolveAdditionalModels(
    primaryOperatingModel,
    input.additionalOperatingModels,
    input.enabledOperatingModels,
  );

  if (primaryOperatingModel === 'hybrid') {
    const enabledForHybrid =
      input.enabledOperatingModels?.filter(isRecommendableOperatingModel) ??
      additionalModels.filter(isRecommendableOperatingModel);
    return resolveHybridLegacyRecommendations(enabledForHybrid, businessType);
  }

  const primarySource: CapabilityRecommendationSource = hasBusinessTypeOverride(
    businessType,
    primaryOperatingModel,
  )
    ? 'business_type'
    : 'primary_baseline';

    const items: RecommendedCapabilityItem[] = resolvePrimaryCapabilityBaseline(
      primaryOperatingModel,
      businessType,
    ).map((key) => ({
    key,
    source: primarySource,
  }));

  for (const model of additionalModels) {
    if (!isRecommendableOperatingModel(model) || model === primaryOperatingModel) {
      continue;
    }
    for (const key of ADDITIONAL_MODEL_CAPABILITY_EXTENSIONS[model]) {
      items.push({ key, source: 'additional_model' });
    }
  }

  return dedupeKeys(items);
}

/**
 * Resolve architectural recommendation potential (includes planned capabilities).
 */
export function resolveArchitecturalRecommendedCapabilities(
  input: CapabilityRecommendationInput,
): ResolvedCapabilityRecommendations {
  return buildRecommendationResult(input, resolveArchitecturalItems(input));
}

/**
 * Resolve effective user-facing recommendations — excludes planned capabilities centrally.
 */
export function resolveEffectiveRecommendedCapabilities(
  input: CapabilityRecommendationInput,
): ResolvedCapabilityRecommendations {
  const architectural = resolveArchitecturalRecommendedCapabilities(input);
  const effectiveItems = filterToUserExposableItems(architectural.items);
  return {
    ...architectural,
    items: effectiveItems,
    keys: filterToUserExposableKeys(architectural.keys),
  };
}

/** Returns both architectural and effective recommendation sets. */
export function resolveCapabilityRecommendationSets(
  input: CapabilityRecommendationInput,
): CapabilityRecommendationSets {
  const architectural = resolveArchitecturalRecommendedCapabilities(input);
  const effectiveItems = filterToUserExposableItems(architectural.items);
  return {
    architectural,
    effective: {
      ...architectural,
      items: effectiveItems,
      keys: filterToUserExposableKeys(architectural.keys),
    },
  };
}

/**
 * User-facing recommendations for Phase 2B — excludes planned capabilities.
 */
export function resolveRecommendedCapabilities(
  input: CapabilityRecommendationInput,
): ResolvedCapabilityRecommendations {
  return resolveEffectiveRecommendedCapabilities(input);
}

/** Model-level baseline keys only (ignores business-type overrides). Architectural layer. */
export function resolveModelLevelCapabilityBaseline(
  primary: RecommendableOperatingModel,
): readonly CapabilityKey[] {
  return PRIMARY_MODEL_CAPABILITY_BASELINE[primary];
}

export function getRecommendedCapabilityReadiness(key: CapabilityKey) {
  return getCapabilityEntry(key).readiness;
}
