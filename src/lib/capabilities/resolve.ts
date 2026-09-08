import type {
  CapabilityKey,
  StoredBusinessCapabilityProfile,
} from '../../types/businessArchitecture';
import type { BusinessWorkspaceConfig } from '../../types/workspace';
import {
  isCapabilityActiveForBusiness,
  normalizeCapabilityProfile,
  resolveEnabledCapabilityKeys,
  type CapabilityProfileMode,
} from './legacy';
import {
  resolveCapabilityRecommendationSets,
  type CapabilityRecommendationInput,
  type CapabilityRecommendationSets,
  type ResolvedCapabilityRecommendations,
} from './recommend';

export interface ResolvedCapabilityConfiguration {
  mode: CapabilityProfileMode;
  gatingActive: boolean;
  /** Ideal future configuration potential (includes planned). */
  architecturalRecommendations: ResolvedCapabilityRecommendations;
  /** Honest user-facing recommendations (excludes planned). */
  recommendations: ResolvedCapabilityRecommendations;
  /** Alias for effective recommendation keys */
  recommendedKeys: CapabilityKey[];
  architecturalRecommendedKeys: CapabilityKey[];
  enabledKeys: CapabilityKey[];
  capabilityProfile: StoredBusinessCapabilityProfile | undefined;
  isRecommended(key: CapabilityKey): boolean;
  isArchitecturallyRecommended(key: CapabilityKey): boolean;
  isEnabled(key: CapabilityKey): boolean;
  isActive(key: CapabilityKey): boolean;
}

export function resolveCapabilityConfigurationFromWorkspace(
  workspace: BusinessWorkspaceConfig | null | undefined,
  businessTypeOverride?: string,
): ResolvedCapabilityConfiguration | null {
  if (!workspace) return null;

  const businessType = businessTypeOverride ?? workspace.businessType;
  const additionalOperatingModels = workspace.enabledOperatingModels.filter(
    (m) => m !== workspace.primaryOperatingModel && m !== 'hybrid',
  );

  return resolveCapabilityConfiguration({
    businessType,
    primaryOperatingModel: workspace.primaryOperatingModel,
    additionalOperatingModels,
    enabledOperatingModels: workspace.enabledOperatingModels,
    capabilityProfile: workspace.capabilityProfile,
  });
}

export function resolveCapabilityConfiguration(
  input: CapabilityRecommendationInput & {
    capabilityProfile?: StoredBusinessCapabilityProfile | undefined;
  },
): ResolvedCapabilityConfiguration {
  const recommendationSets = resolveCapabilityRecommendationSets(input);
  const capabilityProfile = input.capabilityProfile
    ? normalizeCapabilityProfile(input.capabilityProfile)
    : undefined;
  const recommendedKeys = recommendationSets.effective.keys;
  const architecturalRecommendedKeys = recommendationSets.architectural.keys;
  const enabledKeys = resolveEnabledCapabilityKeys(capabilityProfile);
  const mode = capabilityProfile ? 'explicit' : 'legacy';
  const gatingActive = mode === 'explicit';

  const recommendedSet = new Set(recommendedKeys);
  const architecturalSet = new Set(architecturalRecommendedKeys);
  const enabledSet = new Set(enabledKeys);
  const workspaceRef = { capabilityProfile };

  return {
    mode,
    gatingActive,
    architecturalRecommendations: recommendationSets.architectural,
    recommendations: recommendationSets.effective,
    recommendedKeys,
    architecturalRecommendedKeys,
    enabledKeys,
    capabilityProfile,
    isRecommended: (key) => recommendedSet.has(key),
    isArchitecturallyRecommended: (key) => architecturalSet.has(key),
    isEnabled: (key) => enabledSet.has(key),
    isActive: (key) => isCapabilityActiveForBusiness(key, workspaceRef),
  };
}

export type { CapabilityRecommendationSets };
