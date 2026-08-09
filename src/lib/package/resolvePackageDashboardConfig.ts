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

/** Deep link to the existing pack session registration flow on engagement detail. */
export function logSessionRoute(engagementId: string): string {
  return `/engagements/${engagementId}?action=log-session`;
}

export function isPackagePrimaryWorkspace(business: Business | null): boolean {
  const ws = resolveWorkspaceConfig(business);
  return ws?.workspace.primaryOperatingModel === 'package';
}
