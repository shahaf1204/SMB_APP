import { getCapabilityEntry } from '../../config/capabilityRegistry';
import type {
  CapabilityActivation,
  CapabilityConfigurationRequirement,
  CapabilityConfigurationStatus,
  CapabilityKey,
} from '../../types/businessArchitecture';

/**
 * Default configuration status when a capability is newly enabled.
 * Does not mutate existing profiles — for profile creation and normalization defaults.
 */
export function resolveInitialConfigurationStatus(
  key: CapabilityKey,
): CapabilityConfigurationStatus {
  const requirement = getCapabilityEntry(key).configurationRequirement;
  switch (requirement) {
    case 'none':
    case 'optional':
      return 'not_required';
    case 'required':
      return 'incomplete';
  }
}

/**
 * Configuration status to apply when enabling a capability in a new profile entry.
 */
export function resolveConfigurationStatusOnEnable(
  key: CapabilityKey,
): CapabilityConfigurationStatus {
  return resolveInitialConfigurationStatus(key);
}

const VALID_STATUSES: CapabilityConfigurationStatus[] = [
  'not_required',
  'incomplete',
  'configured',
];

function isValidStatus(value: unknown): value is CapabilityConfigurationStatus {
  return VALID_STATUSES.includes(value as CapabilityConfigurationStatus);
}

/**
 * Normalize a stored configuration status for an enabled capability.
 * Preserves explicit valid statuses; coerces nonsensical combinations.
 */
export function normalizeConfigurationStatusForCapability(
  key: CapabilityKey,
  activation: CapabilityActivation,
  storedStatus: CapabilityConfigurationStatus | undefined,
): CapabilityConfigurationStatus | undefined {
  if (activation !== 'enabled') return undefined;

  const requirement = getCapabilityEntry(key).configurationRequirement;
  const fallback = resolveInitialConfigurationStatus(key);

  if (!storedStatus) {
    return fallback;
  }

  if (!isValidStatus(storedStatus)) {
    return fallback;
  }

  if (requirement === 'none') {
    if (storedStatus === 'incomplete') return 'not_required';
    return storedStatus;
  }

  if (requirement === 'optional') {
    if (storedStatus === 'incomplete') return 'not_required';
    return storedStatus;
  }

  // required
  if (storedStatus === 'not_required') return 'incomplete';
  return storedStatus;
}

export function getCapabilityConfigurationRequirement(
  key: CapabilityKey,
): CapabilityConfigurationRequirement {
  return getCapabilityEntry(key).configurationRequirement;
}

/**
 * Future Attention boundary (not implemented):
 * enabled + configurationRequirement=required + configurationStatus=incomplete
 * may become actionable. none/optional without extra config must not auto-create Attention.
 */
export function isPotentiallyActionableIncompleteConfiguration(
  key: CapabilityKey,
  activation: CapabilityActivation,
  configurationStatus: CapabilityConfigurationStatus | undefined,
): boolean {
  if (activation !== 'enabled') return false;
  const requirement = getCapabilityEntry(key).configurationRequirement;
  return requirement === 'required' && configurationStatus === 'incomplete';
}
