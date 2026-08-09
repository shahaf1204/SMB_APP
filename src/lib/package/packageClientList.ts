import { engagementSessionsFor, packProgress } from '../engagements';
import { formatDate } from '../finance';
import type { Engagement, EngagementSession, Invoice } from '../../types/models';
import type { ResolvedPackageDashboardConfig } from './resolvePackageDashboardConfig';
import {
  hasPackPaymentOverdue,
  isPackExpiringSoon,
  isPackLowRemaining,
  isPackExpired,
  packNeedsAttention,
} from './packageDashboardStats';

export type PackageDisplayStatus =
  | 'active'
  | 'nearly_complete'
  | 'expiring'
  | 'expired'
  | 'completed';

export interface PackageListItem {
  engagement: Engagement;
  used: number;
  total: number;
  remaining: number;
  progressPercent: number | null;
  usageLabel: string;
  status: PackageDisplayStatus;
  statusLabel: string;
  expirationLabel?: string;
  needsAttention: boolean;
  sessions: EngagementSession[];
  paymentOverdue: boolean;
}

/** Whether session registration is allowed for this package row. */
export function canLogPackageSession(item: PackageListItem): boolean {
  return item.engagement.status === 'active' && item.remaining > 0;
}

export interface PackageClientGroup {
  clientKey: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  packages: PackageListItem[];
  /** Highest attention score in group — for sorting */
  attentionScore: number;
  nearestExpirationDays: number | null;
  lowestRemaining: number | null;
}

export type PackageActivitiesFilterId =
  | 'all'
  | 'active'
  | 'low_remaining'
  | 'expiring_soon'
  | 'completed';

function normalizeClientKey(name: string): string {
  return name.trim().toLowerCase() || '—';
}

function daysUntil(iso: string, todayIso: string): number {
  const target = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const today = new Date(`${todayIso.slice(0, 10)}T12:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function resolveStatus(
  engagement: Engagement,
  config: ResolvedPackageDashboardConfig,
  todayIso: string,
): { status: PackageDisplayStatus; statusLabel: string } {
  const { remaining, total } = packProgress(engagement);

  if (engagement.status === 'completed' || (total > 0 && remaining === 0)) {
    return { status: 'completed', statusLabel: 'הסתיימה' };
  }

  if (isPackExpired(engagement, todayIso)) {
    return { status: 'expired', statusLabel: 'פגה' };
  }

  if (isPackLowRemaining(engagement, config.lowSessionsThreshold)) {
    return { status: 'nearly_complete', statusLabel: 'כמעט הסתיימה' };
  }

  if (isPackExpiringSoon(engagement, todayIso, config.expiringDaysThreshold)) {
    return { status: 'expiring', statusLabel: 'עומדת לפוג' };
  }

  return { status: 'active', statusLabel: 'פעילה' };
}

function resolveExpirationLabel(engagement: Engagement, todayIso: string): string | undefined {
  if (!engagement.packExpiresAt) return undefined;
  const days = daysUntil(engagement.packExpiresAt.slice(0, 10), todayIso);
  if (days < 0) return 'פגה';
  if (days === 0) return 'פגה היום';
  if (days <= 14) return `פגה בעוד ${days} ימים`;
  return `בתוקף עד ${formatDate(engagement.packExpiresAt)}`;
}

function attentionScore(
  item: PackageListItem,
  config: ResolvedPackageDashboardConfig,
  todayIso: string,
  invoices: Invoice[],
): number {
  if (!packNeedsAttention(item.engagement, config, invoices, todayIso)) return 0;
  let score = 1;
  if (item.paymentOverdue) score += 4;
  if (item.status === 'expired') score += 3;
  if (item.status === 'nearly_complete') score += 2;
  if (item.status === 'expiring') score += 2;
  return score;
}

export function buildPackageListItem(
  engagement: Engagement,
  sessions: EngagementSession[],
  config: ResolvedPackageDashboardConfig,
  todayIso: string,
  invoices: Invoice[],
): PackageListItem {
  const { used, total, remaining } = packProgress(engagement);
  const { status, statusLabel } = resolveStatus(engagement, config, todayIso);
  const paymentOverdue = hasPackPaymentOverdue(engagement.id, invoices);

  const item: PackageListItem = {
    engagement,
    used,
    total,
    remaining,
    progressPercent: total > 0 ? Math.round((used / total) * 100) : null,
    usageLabel: total > 0 ? `נותרו ${remaining} מתוך ${total}` : '—',
    status,
    statusLabel,
    expirationLabel: resolveExpirationLabel(engagement, todayIso),
    needsAttention: false,
    sessions: engagementSessionsFor(engagement.id, sessions),
    paymentOverdue,
  };

  item.needsAttention = attentionScore(item, config, todayIso, invoices) > 0;
  return item;
}

export function buildPackageClientGroups(
  engagements: Engagement[],
  sessions: EngagementSession[],
  config: ResolvedPackageDashboardConfig,
  todayIso: string,
  invoices: Invoice[],
): PackageClientGroup[] {
  const packs = engagements.filter((e) => e.kind === 'session_pack');
  const byClient = new Map<string, PackageClientGroup>();

  for (const engagement of packs) {
    const key = normalizeClientKey(engagement.clientName || engagement.title);
    const item = buildPackageListItem(engagement, sessions, config, todayIso, invoices);

    let group = byClient.get(key);
    if (!group) {
      group = {
        clientKey: key,
        clientName: engagement.clientName || engagement.title,
        clientPhone: engagement.clientPhone,
        clientEmail: engagement.clientEmail,
        packages: [],
        attentionScore: 0,
        nearestExpirationDays: null,
        lowestRemaining: null,
      };
      byClient.set(key, group);
    }

    group.packages.push(item);
    if (engagement.clientPhone && !group.clientPhone) group.clientPhone = engagement.clientPhone;
    if (engagement.clientEmail && !group.clientEmail) group.clientEmail = engagement.clientEmail;

    const score = attentionScore(item, config, todayIso, invoices);
    group.attentionScore = Math.max(group.attentionScore, score);

    if (item.total > 0 && item.remaining >= 0) {
      group.lowestRemaining =
        group.lowestRemaining == null
          ? item.remaining
          : Math.min(group.lowestRemaining, item.remaining);
    }

    if (engagement.packExpiresAt) {
      const days = daysUntil(engagement.packExpiresAt.slice(0, 10), todayIso);
      group.nearestExpirationDays =
        group.nearestExpirationDays == null
          ? days
          : Math.min(group.nearestExpirationDays, days);
    }
  }

  const groups = [...byClient.values()];

  for (const group of groups) {
    group.packages.sort((a, b) => {
      if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
      if (a.remaining !== b.remaining) return a.remaining - b.remaining;
      return a.engagement.title.localeCompare(b.engagement.title, 'he');
    });
  }

  groups.sort((a, b) => {
    if (a.attentionScore !== b.attentionScore) return b.attentionScore - a.attentionScore;
    const expA = a.nearestExpirationDays ?? 9999;
    const expB = b.nearestExpirationDays ?? 9999;
    if (expA !== expB) return expA - expB;
    const remA = a.lowestRemaining ?? 9999;
    const remB = b.lowestRemaining ?? 9999;
    if (remA !== remB) return remA - remB;
    return a.clientName.localeCompare(b.clientName, 'he');
  });

  return groups;
}

export function filterPackageClientGroups(
  groups: PackageClientGroup[],
  filter: PackageActivitiesFilterId,
  config: ResolvedPackageDashboardConfig,
  todayIso: string,
): PackageClientGroup[] {
  if (filter === 'all') return groups;

  return groups
    .map((group) => ({
      ...group,
      packages: group.packages.filter((item) => {
        switch (filter) {
          case 'active':
            return item.status === 'active' || item.status === 'nearly_complete' || item.status === 'expiring';
          case 'low_remaining':
            return isPackLowRemaining(item.engagement, config.lowSessionsThreshold);
          case 'expiring_soon':
            return (
              isPackExpiringSoon(item.engagement, todayIso, config.expiringDaysThreshold) ||
              isPackExpired(item.engagement, todayIso)
            );
          case 'completed':
            return item.status === 'completed';
          default:
            return true;
        }
      }),
    }))
    .filter((g) => g.packages.length > 0);
}

export function searchPackageClientGroups(
  groups: PackageClientGroup[],
  query: string,
): PackageClientGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;

  return groups
    .map((group) => {
      const clientHaystack = [
        group.clientName,
        group.clientPhone ?? '',
        group.clientEmail ?? '',
      ]
        .join(' ')
        .toLowerCase();

      const clientMatch = clientHaystack.includes(q);

      const matchingPackages = group.packages.filter((item) => {
        const packHaystack = [item.engagement.title, item.usageLabel, item.statusLabel]
          .join(' ')
          .toLowerCase();
        return packHaystack.includes(q);
      });

      if (clientMatch) return group;
      if (matchingPackages.length > 0) {
        return { ...group, packages: matchingPackages };
      }
      return null;
    })
    .filter((g): g is PackageClientGroup => g != null);
}

export const PACKAGE_ACTIVITIES_FILTERS: Array<{ id: PackageActivitiesFilterId; label: string }> = [
  { id: 'all', label: 'הכל' },
  { id: 'active', label: 'פעילות' },
  { id: 'low_remaining', label: 'קרובות לסיום' },
  { id: 'expiring_soon', label: 'עומדות לפוג' },
  { id: 'completed', label: 'הסתיימו' },
];

export const PACKAGE_ACTIVITIES_PAGE_COPY = {
  title: 'ניהול כרטיסיות',
  subtitle: 'כל הלקוחות והכרטיסיות הפעילות במקום אחד',
  emptyTitle: 'עדיין אין כרטיסיות',
  emptyDescription: 'כרטיסייה או חבילה חדשה תופיע כאן לאחר היצירה.',
  emptyCta: 'יצירת כרטיסייה',
  searchPlaceholder: 'חיפוש לפי לקוח, כרטיסייה, טלפון…',
};

export function packagesSoldThisMonth(engagements: Engagement[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return engagements.filter((e) => {
    if (e.kind !== 'session_pack') return false;
    const created = new Date(e.createdAt);
    return created >= monthStart && created <= monthEnd;
  }).length;
}
