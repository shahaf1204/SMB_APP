import type { Business } from '../../types/models';
import type { PackageWorkspaceSettings } from '../../types/workspace';
import { resolveWorkspaceConfig } from '../workspace';

export const PACKAGE_DASHBOARD_DEFAULTS = {
  lowSessionsThreshold: 3,
  expiringDaysThreshold: 14,
} as const;

export interface ResolvedPackageDashboardConfig {
  lowSessionsThreshold: number;
  expiringDaysThreshold: number;
}

/** Resolve package dashboard thresholds from workspace config with defaults. */
export function resolvePackageDashboardConfig(
  business: Business | null,
): ResolvedPackageDashboardConfig {
  const ws = resolveWorkspaceConfig(business);
  const overrides: PackageWorkspaceSettings | undefined =
    ws?.workspace.packageSettings;

  return {
    lowSessionsThreshold:
      overrides?.lowSessionsThreshold ?? PACKAGE_DASHBOARD_DEFAULTS.lowSessionsThreshold,
    expiringDaysThreshold:
      overrides?.expiringDaysThreshold ?? PACKAGE_DASHBOARD_DEFAULTS.expiringDaysThreshold,
  };
}

/** Deep link to pack session registration — always scoped to a specific package (engagement). */
export function logSessionRoute(engagementId: string, clientKey?: string): string {
  const params = new URLSearchParams({ action: 'log-session' });
  if (clientKey) params.set('client', clientKey);
  return `/engagements/${engagementId}?${params.toString()}`;
}

export function isPackagePrimaryWorkspace(business: Business | null): boolean {
  const ws = resolveWorkspaceConfig(business);
  return ws?.workspace.primaryOperatingModel === 'package';
}
