import { describe, expect, it } from 'vitest';
import { generateBusinessInsights } from './insightEngine';
import { limitInsights } from './priority';
import {
  classifyPackageConcerns,
  generatePackageInsights,
} from './packageInsights';
import type { Engagement, EngagementSession } from '../types/models';
import type { BusinessWorkspaceConfig } from '../types/workspace';

const CONFIG = { lowSessionsThreshold: 3, expiringDaysThreshold: 14 };
const TODAY = '2026-08-09';

function makePack(overrides: Partial<Engagement> = {}): Engagement {
  return {
    id: 'pack-1',
    businessId: 'biz-1',
    userId: 'user-1',
    kind: 'session_pack',
    title: 'כרטיסייה 10 מפגשים',
    clientName: 'רותי',
    status: 'active',
    startDate: '2026-01-01',
    notes: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    totalSessions: 10,
    usedSessions: 0,
    ...overrides,
  };
}

function packageWorkspace(): BusinessWorkspaceConfig {
  return {
    primaryOperatingModel: 'package',
    enabledOperatingModels: ['package'],
    onboardingCompleted: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('generatePackageInsights', () => {
  it('returns no insights when packages are healthy', () => {
    const engagements = [
      makePack({ id: 'healthy', usedSessions: 2, totalSessions: 10 }),
    ];
    const insights = generatePackageInsights({
      engagements,
      engagementSessions: [],
      config: CONFIG,
      todayIso: TODAY,
      now: new Date(`${TODAY}T12:00:00`),
    });
    expect(insights).toHaveLength(0);
  });

  it('creates opportunity insight for one package with 2 sessions remaining', () => {
    const engagements = [
      makePack({ usedSessions: 8, totalSessions: 10, clientName: 'רותי' }),
    ];
    const insights = generatePackageInsights({
      engagements,
      engagementSessions: [],
      config: CONFIG,
      todayIso: TODAY,
    });
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe('opportunity');
    expect(insights[0].title).toContain('רותי');
    expect(insights[0].actionTarget).toBe('/engagements/pack-1');
    expect(insights[0].description).toContain('חבילת המשך');
  });

  it('aggregates three near-completion packages into one insight', () => {
    const engagements = [
      makePack({ id: 'a', usedSessions: 9, totalSessions: 10 }),
      makePack({ id: 'b', usedSessions: 8, totalSessions: 10, clientName: 'דנה' }),
      makePack({ id: 'c', usedSessions: 7, totalSessions: 10, clientName: 'יוסי' }),
    ];
    const insights = generatePackageInsights({
      engagements,
      engagementSessions: [],
      config: CONFIG,
      todayIso: TODAY,
    });
    const lowRemaining = insights.filter((i) => i.id === 'pkg-low-remaining-aggregate');
    expect(lowRemaining).toHaveLength(1);
    expect(lowRemaining[0].title).toBe('3 כרטיסיות קרובות לסיום');
    expect(lowRemaining[0].actionTarget).toBe('/activities?filter=low_remaining');
  });

  it('creates reminder for package expiring in 5 days', () => {
    const engagements = [
      makePack({
        packExpiresAt: '2026-08-14',
        usedSessions: 2,
        totalSessions: 10,
      }),
    ];
    const insights = generatePackageInsights({
      engagements,
      engagementSessions: [],
      config: CONFIG,
      todayIso: TODAY,
    });
    expect(insights.some((i) => i.type === 'reminder')).toBe(true);
    expect(insights[0].actionTarget).toBe('/activities?filter=expiring_soon');
  });

  it('creates critical warning for expired package with remaining sessions', () => {
    const engagements = [
      makePack({
        packExpiresAt: '2026-08-01',
        usedSessions: 5,
        totalSessions: 10,
      }),
    ];
    const insights = generatePackageInsights({
      engagements,
      engagementSessions: [],
      config: CONFIG,
      todayIso: TODAY,
    });
    expect(insights[0].type).toBe('warning');
    expect(insights[0].priority).toBe('critical');
    expect(insights[0].actionLabel).toBe('בדיקה');
  });

  it('deduplicates near-completion and expiring for the same package', () => {
    const engagements = [
      makePack({
        usedSessions: 9,
        totalSessions: 10,
        packExpiresAt: '2026-08-10',
      }),
    ];
    const classified = classifyPackageConcerns(engagements, CONFIG, TODAY);
    expect(classified).toHaveLength(1);
    expect(classified[0].kind).toBe('expiring_urgent');

    const insights = generatePackageInsights({
      engagements,
      engagementSessions: [],
      config: CONFIG,
      todayIso: TODAY,
    });
    expect(insights.filter((i) => i.type === 'opportunity')).toHaveLength(0);
    expect(insights.filter((i) => i.type === 'reminder')).toHaveLength(1);
  });

  it('limits display to top 3 insights by priority', () => {
    const manyInsights = [
      { id: '1', priority: 'low' as const, type: 'info' as const, title: '', description: '', icon: 'Info' as const, operatingModel: 'package' as const },
      { id: '2', priority: 'critical' as const, type: 'warning' as const, title: '', description: '', icon: 'TriangleAlert' as const, operatingModel: 'package' as const },
      { id: '3', priority: 'high' as const, type: 'reminder' as const, title: '', description: '', icon: 'Clock3' as const, operatingModel: 'package' as const },
      { id: '4', priority: 'medium' as const, type: 'info' as const, title: '', description: '', icon: 'Info' as const, operatingModel: 'package' as const },
    ];
    const limited = limitInsights(manyInsights, 3);
    expect(limited).toHaveLength(3);
    expect(limited[0].priority).toBe('critical');
    expect(limited[1].priority).toBe('high');
    expect(limited[2].priority).toBe('medium');
  });
});

describe('generateBusinessInsights', () => {
  it('returns empty array for event workspace', () => {
    const insights = generateBusinessInsights({
      workspaceConfig: {
        primaryOperatingModel: 'event',
        enabledOperatingModels: ['event'],
        onboardingCompleted: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      data: { engagements: [makePack()], engagementSessions: [] },
    });
    expect(insights).toEqual([]);
  });

  it('generates package insights only for package workspace', () => {
    const engagements = [makePack({ usedSessions: 9, totalSessions: 10 })];
    const insights = generateBusinessInsights({
      workspaceConfig: packageWorkspace(),
      data: { engagements, engagementSessions: [] },
      now: new Date(`${TODAY}T12:00:00`),
    });
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.every((i) => i.operatingModel === 'package')).toBe(true);
  });
});

describe('near-completion CTA navigation', () => {
  it('links aggregate insight to low_remaining filter', () => {
    const engagements = [
      makePack({ id: 'a', usedSessions: 9, totalSessions: 10 }),
      makePack({ id: 'b', usedSessions: 8, totalSessions: 10 }),
    ];
    const insights = generatePackageInsights({
      engagements,
      engagementSessions: [] as EngagementSession[],
      config: CONFIG,
      todayIso: TODAY,
    });
    const aggregate = insights.find((i) => i.id === 'pkg-low-remaining-aggregate');
    expect(aggregate?.actionTarget).toBe('/activities?filter=low_remaining');
    expect(aggregate?.actionLabel).toBe('הצג כרטיסיות');
  });
});
