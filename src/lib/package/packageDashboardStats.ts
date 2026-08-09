import { activeEngagements, packProgress } from '../engagements';
import { dateStringInPeriod } from '../engagementFinance';
import { isInvoiceOverdue } from '../invoices';
import type {
  Engagement,
  EngagementSession,
  Invoice,
} from '../../types/models';
import type { ResolvedPackageDashboardConfig } from './resolvePackageDashboardConfig';

export interface PackageOperationalStats {
  activePackages: number;
  remainingSessions: number;
  sessionsUsedThisMonth: number;
  packagesExpiringSoon: number;
}

function daysUntil(iso: string, todayIso: string): number {
  const target = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const today = new Date(`${todayIso.slice(0, 10)}T12:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function isPackExpired(engagement: Engagement, todayIso: string): boolean {
  if (!engagement.packExpiresAt) return false;
  return engagement.packExpiresAt.slice(0, 10) < todayIso;
}

export { isPackExpired };

export function isPackExpiringSoon(
  engagement: Engagement,
  todayIso: string,
  expiringDaysThreshold: number,
): boolean {
  if (!engagement.packExpiresAt) return false;
  const days = daysUntil(engagement.packExpiresAt.slice(0, 10), todayIso);
  return days <= expiringDaysThreshold;
}

export function isPackLowRemaining(
  engagement: Engagement,
  lowSessionsThreshold: number,
): boolean {
  const { remaining, total } = packProgress(engagement);
  return total > 0 && remaining > 0 && remaining <= lowSessionsThreshold;
}

export function hasPackPaymentOverdue(
  engagementId: string,
  invoices: Invoice[],
): boolean {
  return invoices
    .filter((inv) => inv.engagementId === engagementId)
    .some(isInvoiceOverdue);
}

export function packNeedsAttention(
  engagement: Engagement,
  config: ResolvedPackageDashboardConfig,
  invoices: Invoice[],
  todayIso: string,
): boolean {
  if (engagement.status !== 'active') return false;
  if (isPackExpired(engagement, todayIso)) return true;
  if (hasPackPaymentOverdue(engagement.id, invoices)) return true;
  if (isPackLowRemaining(engagement, config.lowSessionsThreshold)) return true;
  if (isPackExpiringSoon(engagement, todayIso, config.expiringDaysThreshold)) return true;
  return false;
}

export function computePackageOperationalStats(
  engagements: Engagement[],
  sessions: EngagementSession[],
  config: ResolvedPackageDashboardConfig,
  todayIso: string,
): PackageOperationalStats {
  const activePacks = activeEngagements(engagements).filter(
    (e) => e.kind === 'session_pack',
  );

  let remainingSessions = 0;
  let packagesExpiringSoon = 0;

  for (const pack of activePacks) {
    remainingSessions += packProgress(pack).remaining;
    if (isPackExpiringSoon(pack, todayIso, config.expiringDaysThreshold)) {
      packagesExpiringSoon += 1;
    }
  }

  const packIds = new Set(activePacks.map((p) => p.id));
  const sessionsUsedThisMonth = sessions.filter(
    (s) => packIds.has(s.engagementId) && dateStringInPeriod(s.date, 'thisMonth'),
  ).length;

  return {
    activePackages: activePacks.length,
    remainingSessions,
    sessionsUsedThisMonth,
    packagesExpiringSoon,
  };
}

export type PackageDashboardSectionId =
  | 'nearly_depleted'
  | 'expiring_soon'
  | 'active'
  | 'completed';

export interface PackageDashboardSectionDefinition {
  id: PackageDashboardSectionId;
  title: string;
}

export const PACKAGE_DASHBOARD_SECTIONS: PackageDashboardSectionDefinition[] = [
  { id: 'nearly_depleted', title: 'כרטיסיות קרובות לסיום' },
  { id: 'expiring_soon', title: 'עומדות לפוג' },
  { id: 'active', title: 'כרטיסיות פעילות' },
  { id: 'completed', title: 'הסתיימו' },
];

export function assignPackToDashboardSection(
  engagement: Engagement,
  config: ResolvedPackageDashboardConfig,
  todayIso: string,
): PackageDashboardSectionId {
  if (engagement.status === 'completed') return 'completed';

  const { remaining, total } = packProgress(engagement);
  if (total > 0 && remaining === 0) return 'completed';

  if (engagement.status !== 'active') return 'completed';

  if (isPackLowRemaining(engagement, config.lowSessionsThreshold)) {
    return 'nearly_depleted';
  }

  if (isPackExpiringSoon(engagement, todayIso, config.expiringDaysThreshold)) {
    return 'expiring_soon';
  }

  if (isPackExpired(engagement, todayIso)) {
    return 'expiring_soon';
  }

  return 'active';
}

export function groupPackageDashboardSections(
  engagements: Engagement[],
  config: ResolvedPackageDashboardConfig,
  todayIso: string,
): Map<PackageDashboardSectionId, Engagement[]> {
  const map = new Map<PackageDashboardSectionId, Engagement[]>();
  for (const section of PACKAGE_DASHBOARD_SECTIONS) {
    map.set(section.id, []);
  }

  const packs = engagements.filter((e) => e.kind === 'session_pack');

  for (const pack of packs) {
    const sectionId = assignPackToDashboardSection(pack, config, todayIso);
    map.get(sectionId)!.push(pack);
  }

  for (const [, list] of map) {
    list.sort((a, b) => a.title.localeCompare(b.title, 'he'));
  }

  return map;
}
