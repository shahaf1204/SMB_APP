import type { Engagement, EngagementKind, EngagementSession, GroupMember } from '../types/models';

export const WEEKDAY_LABELS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const ENGAGEMENT_KIND_LABEL: Record<EngagementKind, string> = {
  project: 'ליווי / פרויקט',
  session_pack: 'כרטיסייה',
  recurring_group: 'חוג / קבוצה',
};

export const ENGAGEMENT_KIND_ICON: Record<EngagementKind, string> = {
  project: '📋',
  session_pack: '🎫',
  recurring_group: '👥',
};

export function packSessionsRemaining(e: Engagement): number {
  return Math.max(0, (e.totalSessions ?? 0) - (e.usedSessions ?? 0));
}

export function packProgress(e: Engagement): { used: number; total: number; remaining: number } {
  const total = e.totalSessions ?? 0;
  const used = e.usedSessions ?? 0;
  return { used, total, remaining: Math.max(0, total - used) };
}

export function engagementSessionsFor(
  engagementId: string,
  sessions: EngagementSession[] | undefined,
): EngagementSession[] {
  return (sessions ?? [])
    .filter((s) => s.engagementId === engagementId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function engagementRevenueTotal(
  engagementId: string,
  sessions: EngagementSession[] | undefined,
): number {
  return (sessions ?? [])
    .filter((s) => s.engagementId === engagementId)
    .reduce((sum, s) => sum + s.revenue, 0);
}

export function memberLabel(m: GroupMember): string {
  if (m.parentName) return `${m.studentName} (${m.parentName})`;
  return m.studentName;
}

export function isEngagementActive(e: Engagement): boolean {
  return e.status === 'active';
}

export function activeEngagements(engagements: Engagement[] | undefined): Engagement[] {
  return (engagements ?? []).filter(isEngagementActive);
}

export function nextWeekdayDate(weekday: number): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const current = today.getDay();
  let diff = weekday - current;
  if (diff <= 0) diff += 7;
  const next = new Date(today);
  next.setDate(today.getDate() + diff);
  return next.toISOString().slice(0, 10);
}
