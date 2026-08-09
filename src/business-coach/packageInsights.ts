import { packProgress } from '../lib/engagements';
import { dateStringInPeriod } from '../lib/engagementFinance';
import {
  isPackExpired,
  isPackLowRemaining,
} from '../lib/package/packageDashboardStats';
import { buildPackageSessionsChartData } from '../lib/package/packageSessionsChart';
import type { ResolvedPackageDashboardConfig } from '../lib/package/resolvePackageDashboardConfig';
import { PACKAGE_DASHBOARD_DEFAULTS } from '../lib/package/resolvePackageDashboardConfig';
import type { Engagement, EngagementSession } from '../types/models';
import type { BusinessWorkspaceConfig } from '../types/workspace';
import {
  clientNameWithPrefix,
  expiredUnusedTitle,
  expiringTitle,
  nearCompletionSingleTitle,
  nearCompletionTitle,
  packageCountPhrase,
  sessionCountPhrase,
} from './hebrewCopy';
import { dedupeInsightsByEntity } from './priority';
import type { BusinessInsight, BusinessInsightPriority } from './types';

type PackConcernKind =
  | 'expired_unused'
  | 'expiring_urgent'
  | 'low_remaining'
  | 'expiring_soon';

interface ClassifiedPack {
  engagement: Engagement;
  kind: PackConcernKind;
  remaining: number;
  daysUntilExpiry: number | null;
}

export interface GeneratePackageInsightsInput {
  engagements: Engagement[];
  engagementSessions: EngagementSession[];
  config: ResolvedPackageDashboardConfig;
  todayIso: string;
  now?: Date;
}

function daysUntil(iso: string, todayIso: string): number {
  const target = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const today = new Date(`${todayIso.slice(0, 10)}T12:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function resolveConfigFromWorkspace(
  workspaceConfig: BusinessWorkspaceConfig,
): ResolvedPackageDashboardConfig {
  const overrides = workspaceConfig.packageSettings;
  return {
    lowSessionsThreshold:
      overrides?.lowSessionsThreshold ?? PACKAGE_DASHBOARD_DEFAULTS.lowSessionsThreshold,
    expiringDaysThreshold:
      overrides?.expiringDaysThreshold ?? PACKAGE_DASHBOARD_DEFAULTS.expiringDaysThreshold,
  };
}

/** Assign each package to its single most urgent concern (deduplication per engagement). */
export function classifyPackageConcerns(
  engagements: Engagement[],
  config: ResolvedPackageDashboardConfig,
  todayIso: string,
): ClassifiedPack[] {
  const packs = engagements.filter((e) => e.kind === 'session_pack');
  const results: ClassifiedPack[] = [];

  for (const engagement of packs) {
    const { remaining } = packProgress(engagement);
    const expired = isPackExpired(engagement, todayIso);
    const daysUntilExpiry = engagement.packExpiresAt
      ? daysUntil(engagement.packExpiresAt.slice(0, 10), todayIso)
      : null;

    if (expired && remaining > 0) {
      results.push({
        engagement,
        kind: 'expired_unused',
        remaining,
        daysUntilExpiry,
      });
      continue;
    }

    if (engagement.status !== 'active') continue;

    const lowRemaining = isPackLowRemaining(engagement, config.lowSessionsThreshold);
    const expiringSoon =
      !expired &&
      daysUntilExpiry !== null &&
      daysUntilExpiry >= 0 &&
      daysUntilExpiry <= config.expiringDaysThreshold;

    if (!lowRemaining && !expiringSoon) continue;

    if (
      expiringSoon &&
      daysUntilExpiry !== null &&
      daysUntilExpiry <= 3
    ) {
      results.push({
        engagement,
        kind: 'expiring_urgent',
        remaining,
        daysUntilExpiry,
      });
      continue;
    }

    if (lowRemaining) {
      results.push({
        engagement,
        kind: 'low_remaining',
        remaining,
        daysUntilExpiry,
      });
      continue;
    }

    if (expiringSoon) {
      results.push({
        engagement,
        kind: 'expiring_soon',
        remaining,
        daysUntilExpiry,
      });
    }
  }

  return results;
}

function expiringPriority(daysUntilExpiry: number | null): BusinessInsightPriority {
  if (daysUntilExpiry === null) return 'medium';
  if (daysUntilExpiry <= 3) return 'high';
  if (daysUntilExpiry <= 7) return 'high';
  return 'medium';
}

function buildExpiredUnusedInsights(items: ClassifiedPack[]): BusinessInsight[] {
  if (items.length === 0) return [];

  if (items.length === 1) {
    const { engagement, remaining } = items[0];
    const name = clientNameWithPrefix(engagement.clientName || engagement.title);
    return [
      {
        id: `pkg-expired-unused-${engagement.id}`,
        type: 'warning',
        priority: 'critical',
        title: expiredUnusedTitle(1),
        description: `נשארו ל${name} ${sessionCountPhrase(remaining)} בכרטיסייה שפג תוקפה.`,
        actionLabel: 'בדיקה',
        actionTarget: `/engagements/${engagement.id}`,
        icon: 'TriangleAlert',
        relatedEntityId: engagement.id,
        relatedEntityType: 'engagement',
        operatingModel: 'package',
        metadata: { relatedEngagementIds: [engagement.id] },
      },
    ];
  }

  return [
    {
      id: 'pkg-expired-unused-aggregate',
      type: 'warning',
      priority: 'critical',
      title: expiredUnusedTitle(items.length),
      description: 'כדאי לבדוק עם הלקוחות מה קורה עם המפגשים שנותרו.',
      actionLabel: 'הצג כרטיסיות',
      actionTarget: '/activities?filter=expiring_soon',
      icon: 'TriangleAlert',
      operatingModel: 'package',
      metadata: {
        relatedEngagementIds: items.map((i) => i.engagement.id),
      },
    },
  ];
}

function buildLowRemainingInsights(items: ClassifiedPack[]): BusinessInsight[] {
  if (items.length === 0) return [];

  if (items.length === 1) {
    const { engagement, remaining } = items[0];
    const name = engagement.clientName || engagement.title;
    return [
      {
        id: `pkg-low-remaining-${engagement.id}`,
        type: 'opportunity',
        priority: 'high',
        title: nearCompletionSingleTitle(remaining, name),
        description: 'כדאי להציע חבילת המשך לפני שהכרטיסייה מסתיימת.',
        actionLabel: 'פתח כרטיסייה',
        actionTarget: `/engagements/${engagement.id}`,
        icon: 'Lightbulb',
        relatedEntityId: engagement.id,
        relatedEntityType: 'engagement',
        operatingModel: 'package',
        metadata: { relatedEngagementIds: [engagement.id] },
      },
    ];
  }

  return [
    {
      id: 'pkg-low-remaining-aggregate',
      type: 'opportunity',
      priority: 'high',
      title: nearCompletionTitle(items.length),
      description: 'כדאי ליצור קשר עם הלקוחות ולהציע חבילת המשך.',
      actionLabel: 'הצג כרטיסיות',
      actionTarget: '/activities?filter=low_remaining',
      icon: 'Lightbulb',
      operatingModel: 'package',
      metadata: {
        relatedEngagementIds: items.map((i) => i.engagement.id),
      },
    },
  ];
}

function buildExpiringInsights(
  items: ClassifiedPack[],
  urgent: boolean,
): BusinessInsight[] {
  if (items.length === 0) return [];

  const minDays = items.reduce((min, item) => {
    if (item.daysUntilExpiry === null) return min;
    return Math.min(min, item.daysUntilExpiry);
  }, Number.POSITIVE_INFINITY);

  const priority = urgent ? 'high' : expiringPriority(minDays === Number.POSITIVE_INFINITY ? null : minDays);

  if (items.length === 1) {
    const { engagement, daysUntilExpiry } = items[0];
    const name = clientNameWithPrefix(engagement.clientName || engagement.title);
    const dayHint =
      daysUntilExpiry !== null && daysUntilExpiry >= 0
        ? ` — פגה בעוד ${daysUntilExpiry} ימים`
        : '';

    return [
      {
        id: `pkg-expiring-${urgent ? 'urgent' : 'soon'}-${engagement.id}`,
        type: 'reminder',
        priority,
        title: expiringTitle(1),
        description: `כדאי לבדוק עם ${name} אם נותרו מפגשים שצריך לנצל${dayHint}.`,
        actionLabel: 'הצג כרטיסייה',
        actionTarget: `/activities?filter=expiring_soon`,
        icon: 'Clock3',
        relatedEntityId: engagement.id,
        relatedEntityType: 'engagement',
        operatingModel: 'package',
        metadata: { relatedEngagementIds: [engagement.id] },
      },
    ];
  }

  return [
    {
      id: urgent ? 'pkg-expiring-urgent-aggregate' : 'pkg-expiring-soon-aggregate',
      type: 'reminder',
      priority,
      title: expiringTitle(items.length),
      description: 'כדאי ליצור קשר עם הלקוחות ולוודא שניצלו את המפגשים שנותרו.',
      actionLabel: 'הצג כרטיסיות',
      actionTarget: '/activities?filter=expiring_soon',
      icon: 'Clock3',
      operatingModel: 'package',
      metadata: {
        relatedEngagementIds: items.map((i) => i.engagement.id),
      },
    },
  ];
}

function maybePositiveSessionInsight(
  engagements: Engagement[],
  sessions: EngagementSession[],
  now: Date,
): BusinessInsight | null {
  const packIds = new Set(
    engagements.filter((e) => e.kind === 'session_pack').map((e) => e.id),
  );
  if (packIds.size === 0) return null;

  const thisMonthCount = sessions.filter(
    (s) => packIds.has(s.engagementId) && dateStringInPeriod(s.date, 'thisMonth', now),
  ).length;

  const lastMonthCount = sessions.filter(
    (s) => packIds.has(s.engagementId) && dateStringInPeriod(s.date, 'lastMonth', now),
  ).length;

  if (
    thisMonthCount >= 5 &&
    lastMonthCount >= 3 &&
    thisMonthCount >= Math.round(lastMonthCount * 1.5)
  ) {
    return {
      id: 'pkg-sessions-growth',
      type: 'success',
      priority: 'positive',
      title: 'חודש פעיל במיוחד',
      description: `בוצעו ${thisMonthCount} מפגשים החודש — עלייה משמעותית לעומת החודש שעבר.`,
      icon: 'CircleCheck',
      operatingModel: 'package',
    };
  }

  const chartPoints = buildPackageSessionsChartData(engagements, sessions, 2, now);
  if (chartPoints.length >= 2) {
    const prevSold = chartPoints[0].packagesSold;
    const thisSold = chartPoints[1].packagesSold;
    if (thisSold >= 2 && prevSold > 0 && thisSold > prevSold) {
      return {
        id: 'pkg-sales-growth',
        type: 'success',
        priority: 'positive',
        title: 'מכירות כרטיסיות בעלייה',
        description: `נמכרו ${packageCountPhrase(thisSold)} החודש — יותר מהחודש שעבר.`,
        icon: 'CircleCheck',
        operatingModel: 'package',
      };
    }
  }

  return null;
}

export function generatePackageInsights(
  input: GeneratePackageInsightsInput,
): BusinessInsight[] {
  const { engagements, engagementSessions, config, todayIso, now = new Date() } = input;

  const classified = classifyPackageConcerns(engagements, config, todayIso);

  const expiredUnused = classified.filter((c) => c.kind === 'expired_unused');
  const expiringUrgent = classified.filter((c) => c.kind === 'expiring_urgent');
  const lowRemaining = classified.filter((c) => c.kind === 'low_remaining');
  const expiringSoon = classified.filter((c) => c.kind === 'expiring_soon');

  const insights: BusinessInsight[] = [
    ...buildExpiredUnusedInsights(expiredUnused),
    ...buildExpiringInsights(expiringUrgent, true),
    ...buildLowRemainingInsights(lowRemaining),
    ...buildExpiringInsights(expiringSoon, false),
  ];

  const positive = maybePositiveSessionInsight(engagements, engagementSessions, now);
  if (positive) insights.push(positive);

  return dedupeInsightsByEntity(insights);
}

export function generatePackageInsightsFromWorkspace(
  workspaceConfig: BusinessWorkspaceConfig,
  engagements: Engagement[],
  engagementSessions: EngagementSession[],
  now = new Date(),
): BusinessInsight[] {
  const config = resolveConfigFromWorkspace(workspaceConfig);
  const todayIso = now.toISOString().slice(0, 10);
  return generatePackageInsights({
    engagements,
    engagementSessions,
    config,
    todayIso,
    now,
  });
}
