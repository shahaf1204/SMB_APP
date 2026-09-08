import { getCapabilityEntry } from '../../config/capabilityRegistry';
import type { CapabilityKey, CapabilityReadiness } from '../../types/businessArchitecture';
import type { RecommendedCapabilityItem } from './recommend';

/** Whether readiness permits user-facing recommendation or new enablement. */
export function isCapabilityReadinessUserExposable(readiness: CapabilityReadiness): boolean {
  return readiness === 'available' || readiness === 'partial';
}

export function isCapabilityUserExposable(key: CapabilityKey): boolean {
  return isCapabilityReadinessUserExposable(getCapabilityEntry(key).readiness);
}

/** Planned capabilities may exist in architecture but must not be user-recommended or newly enabled. */
export function canNewlyEnableCapability(key: CapabilityKey): boolean {
  return isCapabilityUserExposable(key);
}

export function filterToUserExposableKeys(keys: readonly CapabilityKey[]): CapabilityKey[] {
  return keys.filter(isCapabilityUserExposable);
}

export function filterToUserExposableItems(
  items: readonly RecommendedCapabilityItem[],
): RecommendedCapabilityItem[] {
  return items.filter((item) => isCapabilityUserExposable(item.key));
}
