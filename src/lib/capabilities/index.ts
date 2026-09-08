export {
  assertCapabilityProfileIsLightweight,
  canEnableCapabilityInProfile,
  createEmptyCapabilityProfile,
  getCapabilityConfigurationStatus,
  isCapabilityActiveForBusiness,
  isCapabilityGatingActive,
  normalizeCapabilityProfile,
  resolveCapabilityProfileMode,
  resolveConfiguredCapabilityKeys,
  resolveEnabledCapabilityKeys,
  resolveIncompleteCapabilityKeys,
  type CapabilityProfileMode,
} from './legacy';

export {
  canNewlyEnableCapability,
  filterToUserExposableKeys,
  isCapabilityReadinessUserExposable,
  isCapabilityUserExposable,
} from './readiness';

export {
  getRecommendedCapabilityReadiness,
  resolveArchitecturalRecommendedCapabilities,
  resolveCapabilityRecommendationSets,
  resolveEffectiveRecommendedCapabilities,
  resolveModelLevelCapabilityBaseline,
  resolveRecommendedCapabilities,
  type CapabilityRecommendationInput,
  type CapabilityRecommendationSets,
  type CapabilityRecommendationSource,
  type RecommendedCapabilityItem,
  type ResolvedCapabilityRecommendations,
} from './recommend';

export {
  resolveCapabilityConfiguration,
  resolveCapabilityConfigurationFromWorkspace,
  type ResolvedCapabilityConfiguration,
} from './resolve';
