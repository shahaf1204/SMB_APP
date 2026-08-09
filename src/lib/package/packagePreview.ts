import { formatDate } from '../finance';
import { packProgress } from '../engagements';
import type { Engagement } from '../../types/models';
import type { PackageListItem } from './packageClientList';
import type { ResolvedPackageDashboardConfig } from './resolvePackageDashboardConfig';
import { isPackExpiringSoon, isPackLowRemaining } from './packageDashboardStats';

export interface PackagePreviewItem {
  engagementId: string;
  clientName: string;
  packageName: string;
  usageLabel: string;
  progressPercent: number | null;
  contextLabel?: string;
}

function daysUntil(iso: string, todayIso: string): number {
  const target = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const today = new Date(`${todayIso.slice(0, 10)}T12:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export const PACKAGE_DASHBOARD_PREVIEW_LIMIT = 3;

export function toPreviewItem(
  engagement: Engagement,
  _config: ResolvedPackageDashboardConfig,
  todayIso: string,
  mode: 'low_remaining' | 'expiring_soon',
): PackagePreviewItem {
  const { used, total, remaining } = packProgress(engagement);
  const usageLabel = total > 0 ? `נותרו ${remaining} מתוך ${total}` : '—';

  let contextLabel: string | undefined;
  if (mode === 'expiring_soon' && engagement.packExpiresAt) {
    const days = daysUntil(engagement.packExpiresAt.slice(0, 10), todayIso);
    if (days < 0) contextLabel = 'פגה';
    else if (days <= 14) contextLabel = `פגה בעוד ${days} ימים`;
    else contextLabel = `בתוקף עד ${formatDate(engagement.packExpiresAt)}`;
  }

  return {
    engagementId: engagement.id,
    clientName: engagement.clientName || engagement.title,
    packageName: engagement.title,
    usageLabel,
    progressPercent: total > 0 ? Math.round((used / total) * 100) : null,
    contextLabel,
  };
}

export function getNearlyDepletedPreviews(
  engagements: Engagement[],
  config: ResolvedPackageDashboardConfig,
  limit = PACKAGE_DASHBOARD_PREVIEW_LIMIT,
): PackagePreviewItem[] {
  const items = engagements
    .filter((e) => e.kind === 'session_pack' && e.status === 'active')
    .filter((e) => isPackLowRemaining(e, config.lowSessionsThreshold))
    .sort((a, b) => packProgress(a).remaining - packProgress(b).remaining);

  return items
    .slice(0, limit)
    .map((e) => toPreviewItem(e, config, new Date().toISOString().slice(0, 10), 'low_remaining'));
}

export function getExpiringSoonPreviews(
  engagements: Engagement[],
  config: ResolvedPackageDashboardConfig,
  todayIso: string,
  limit = PACKAGE_DASHBOARD_PREVIEW_LIMIT,
): PackagePreviewItem[] {
  const items = engagements
    .filter((e) => e.kind === 'session_pack' && e.status === 'active')
    .filter((e) => isPackExpiringSoon(e, todayIso, config.expiringDaysThreshold))
    .sort((a, b) => {
      const da = a.packExpiresAt?.slice(0, 10) ?? '9999';
      const db = b.packExpiresAt?.slice(0, 10) ?? '9999';
      return da.localeCompare(db);
    });

  return items
    .slice(0, limit)
    .map((e) => toPreviewItem(e, config, todayIso, 'expiring_soon'));
}

export function countNearlyDepleted(
  engagements: Engagement[],
  config: ResolvedPackageDashboardConfig,
): number {
  return engagements.filter(
    (e) =>
      e.kind === 'session_pack' &&
      e.status === 'active' &&
      isPackLowRemaining(e, config.lowSessionsThreshold),
  ).length;
}

export function countExpiringSoon(
  engagements: Engagement[],
  config: ResolvedPackageDashboardConfig,
  todayIso: string,
): number {
  return engagements.filter(
    (e) =>
      e.kind === 'session_pack' &&
      e.status === 'active' &&
      isPackExpiringSoon(e, todayIso, config.expiringDaysThreshold),
  ).length;
}

/** Map preview item back to list item shape for shared row component */
export function previewToListShape(item: PackagePreviewItem): Pick<
  PackageListItem,
  'usageLabel' | 'progressPercent'
> & { packageName: string; clientName: string } {
  return {
    clientName: item.clientName,
    packageName: item.packageName,
    usageLabel: item.usageLabel,
    progressPercent: item.progressPercent,
  };
}
