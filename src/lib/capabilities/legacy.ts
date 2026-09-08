import type {
  CapabilityActivation,
  CapabilityConfigurationStatus,
  CapabilityKey,
  LegacyCapabilityActivation,
  StoredBusinessCapabilityProfile,
} from '../../types/businessArchitecture';
import type { BusinessWorkspaceConfig } from '../../types/workspace';
import {
  normalizeConfigurationStatusForCapability,
  resolveInitialConfigurationStatus,
} from './configurationRequirement';
import { canNewlyEnableCapability } from './readiness';

export type CapabilityProfileMode = 'legacy' | 'explicit';

interface LegacyStoredBusinessCapabilityProfileV1 {
  version: 1;
  enabled: Partial<Record<CapabilityKey, LegacyCapabilityActivation>>;
  updatedAt?: string;
}

/**
 * Legacy businesses without an explicit profile preserve all existing behavior.
 * Future capability gating applies only when a profile is present.
 */
export function resolveCapabilityProfileMode(
  workspace: Pick<BusinessWorkspaceConfig, 'capabilityProfile'> | null | undefined,
): CapabilityProfileMode {
  return workspace?.capabilityProfile ? 'explicit' : 'legacy';
}

export function isCapabilityGatingActive(
  workspace: Pick<BusinessWorkspaceConfig, 'capabilityProfile'> | null | undefined,
): boolean {
  return resolveCapabilityProfileMode(workspace) === 'explicit';
}

function normalizeV1Profile(
  candidate: LegacyStoredBusinessCapabilityProfileV1,
): StoredBusinessCapabilityProfile | undefined {
  if (!candidate.enabled || typeof candidate.enabled !== 'object') return undefined;

  const activation: Partial<Record<CapabilityKey, CapabilityActivation>> = {};
  const configurationStatus: Partial<
    Record<CapabilityKey, CapabilityConfigurationStatus>
  > = {};

  for (const [key, value] of Object.entries(candidate.enabled)) {
    const capabilityKey = key as CapabilityKey;
    if (value === 'disabled') {
      activation[capabilityKey] = 'disabled';
      continue;
    }
    if (value === 'enabled') {
      activation[capabilityKey] = 'enabled';
      configurationStatus[capabilityKey] = resolveInitialConfigurationStatus(capabilityKey);
      continue;
    }
    if (value === 'configured') {
      activation[capabilityKey] = 'enabled';
      configurationStatus[capabilityKey] = 'configured';
    }
  }

  return {
    version: 2,
    activation,
    configurationStatus,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : undefined,
  };
}

function normalizeV2Profile(
  candidate: StoredBusinessCapabilityProfile,
): StoredBusinessCapabilityProfile | undefined {
  if (!candidate.activation || typeof candidate.activation !== 'object') return undefined;

  const activation: Partial<Record<CapabilityKey, CapabilityActivation>> = {};
  const configurationStatus: Partial<
    Record<CapabilityKey, CapabilityConfigurationStatus>
  > = {};

  for (const [key, value] of Object.entries(candidate.activation)) {
    if (value === 'disabled' || value === 'enabled') {
      activation[key as CapabilityKey] = value;
    }
  }

  if (candidate.configurationStatus && typeof candidate.configurationStatus === 'object') {
    for (const [key, value] of Object.entries(candidate.configurationStatus)) {
      if (
        value === 'not_required' ||
        value === 'incomplete' ||
        value === 'configured'
      ) {
        configurationStatus[key as CapabilityKey] = value;
      }
    }
  }

  for (const key of Object.keys(activation) as CapabilityKey[]) {
    if (activation[key] === 'enabled') {
      configurationStatus[key] = normalizeConfigurationStatusForCapability(
        key,
        'enabled',
        configurationStatus[key],
      );
    }
  }

  return {
    version: 2,
    activation,
    configurationStatus,
    updatedAt:
      typeof candidate.updatedAt === 'string' ? candidate.updatedAt : undefined,
  };
}

/** Normalize v1 or v2 snapshot shapes to v2 runtime profile. */
export function normalizeCapabilityProfile(
  raw: unknown,
): StoredBusinessCapabilityProfile | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const candidate = raw as { version?: number };
  if (candidate.version === 1) {
    return normalizeV1Profile(raw as LegacyStoredBusinessCapabilityProfileV1);
  }
  if (candidate.version === 2) {
    return normalizeV2Profile(raw as StoredBusinessCapabilityProfile);
  }
  return undefined;
}

export function createEmptyCapabilityProfile(
  updatedAt?: string,
): StoredBusinessCapabilityProfile {
  return {
    version: 2,
    activation: {},
    configurationStatus: {},
    updatedAt: updatedAt ?? new Date().toISOString(),
  };
}

export function resolveEnabledCapabilityKeys(
  profile: StoredBusinessCapabilityProfile | undefined,
): CapabilityKey[] {
  if (!profile) return [];
  return (Object.entries(profile.activation) as Array<[CapabilityKey, CapabilityActivation]>)
    .filter(([, activation]) => activation === 'enabled')
    .map(([key]) => key);
}

export function resolveIncompleteCapabilityKeys(
  profile: StoredBusinessCapabilityProfile | undefined,
): CapabilityKey[] {
  if (!profile) return [];
  return resolveEnabledCapabilityKeys(profile).filter(
    (key) => profile.configurationStatus[key] === 'incomplete',
  );
}

export function resolveConfiguredCapabilityKeys(
  profile: StoredBusinessCapabilityProfile | undefined,
): CapabilityKey[] {
  if (!profile) return [];
  return resolveEnabledCapabilityKeys(profile).filter(
    (key) => profile.configurationStatus[key] === 'configured',
  );
}

/**
 * Whether a capability may be newly enabled (blocks planned capabilities).
 */
export function canEnableCapabilityInProfile(key: CapabilityKey): boolean {
  return canNewlyEnableCapability(key);
}

/**
 * Whether a capability is active for the business.
 * Legacy mode: always true (no gating). Explicit profile: only enabled keys.
 */
export function isCapabilityActiveForBusiness(
  key: CapabilityKey,
  workspace: Pick<BusinessWorkspaceConfig, 'capabilityProfile'> | null | undefined,
): boolean {
  if (!isCapabilityGatingActive(workspace)) {
    return true;
  }
  return workspace?.capabilityProfile?.activation[key] === 'enabled';
}

export function getCapabilityConfigurationStatus(
  key: CapabilityKey,
  profile: StoredBusinessCapabilityProfile | undefined,
): CapabilityConfigurationStatus | undefined {
  if (!profile || profile.activation[key] !== 'enabled') return undefined;
  const stored = profile.configurationStatus[key];
  return (
    normalizeConfigurationStatusForCapability(key, 'enabled', stored) ??
    resolveInitialConfigurationStatus(key)
  );
}

/** Lightweight guard — profile must not store capability payload data. */
export function assertCapabilityProfileIsLightweight(
  profile: StoredBusinessCapabilityProfile,
): boolean {
  const keys = Object.keys(profile);
  return (
    keys.every((k) =>
      ['version', 'activation', 'configurationStatus', 'updatedAt'].includes(k),
    ) &&
    typeof profile.activation === 'object' &&
    typeof profile.configurationStatus === 'object'
  );
}
