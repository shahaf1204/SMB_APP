import type { ActivityGroupDefinition, ActivityRecord } from './types';

export interface GroupActivitiesContext {
  todayIso: string;
  weekEndIso: string;
  primaryModel: string;
}

function isPast(iso: string, today: string): boolean {
  return iso.slice(0, 10) < today;
}

function isToday(iso: string, today: string): boolean {
  return iso.slice(0, 10) === today;
}

function isThisWeek(iso: string, today: string, weekEnd: string): boolean {
  const d = iso.slice(0, 10);
  return d >= today && d <= weekEnd;
}

function daysUntil(iso: string, today: string): number {
  const target = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const ref = new Date(`${today.slice(0, 10)}T12:00:00`);
  return Math.round((target.getTime() - ref.getTime()) / 86_400_000);
}

function assignGroup(record: ActivityRecord, ctx: GroupActivitiesContext): string {
  const { todayIso, weekEndIso, primaryModel } = ctx;
  const date = record.sortDate.slice(0, 10);
  const completed = record.status === 'completed' || isPast(date, todayIso);
  const attention = record.needsAttention || record.status === 'needs_attention';
  const paused = record.engagement?.status === 'paused';

  switch (primaryModel) {
    case 'event':
      if (attention && !completed) return 'needs_attention';
      if (completed) return 'completed';
      if (isThisWeek(date, todayIso, weekEndIso)) return 'this_week';
      return 'upcoming';

    case 'appointment':
      if (attention && !completed) return 'needs_attention';
      if (completed) return 'completed';
      if (isToday(date, todayIso)) return 'today';
      if (isThisWeek(date, todayIso, weekEndIso)) return 'this_week';
      return 'upcoming';

    case 'journey':
      if (attention && record.engagement?.status === 'active') return 'needs_attention';
      if (record.engagement?.status === 'completed') return 'completed';
      if (
        record.engagement?.status === 'active' &&
        !isPast(date, todayIso) &&
        daysUntil(date, todayIso) <= 14
      ) {
        return 'next_meeting';
      }
      return 'active';

    case 'package': {
      if (record.engagement?.status === 'completed') return 'completed';
      const pack = record.engagement;
      if (pack?.kind === 'session_pack') {
        const total = pack.totalSessions ?? 0;
        const remaining = Math.max(0, total - (pack.usedSessions ?? 0));
        if (total > 0 && remaining > 0 && remaining <= 2) return 'nearly_depleted';
        if (pack.packExpiresAt) {
          const d = daysUntil(pack.packExpiresAt.slice(0, 10), todayIso);
          if (d >= 0 && d <= 14) return 'expiring_soon';
        }
      }
      return 'active';
    }

    case 'recurring':
      if (record.engagement?.status === 'completed') return 'completed';
      if (paused) return 'paused';
      if (isToday(date, todayIso)) return 'today';
      if (isThisWeek(date, todayIso, weekEndIso)) return 'this_week';
      return 'active';

    case 'project': {
      if (record.engagement?.status === 'completed') return 'completed';
      if (attention) return 'needs_attention';
      const end = record.endDate?.slice(0, 10);
      if (end) {
        const d = daysUntil(end, todayIso);
        if (d >= 0 && d <= 7) return 'upcoming_deadlines';
        if (d >= 0 && d <= 21) return 'nearing_delivery';
      }
      return 'in_progress';
    }

    case 'hybrid':
    default:
      if (attention && !completed) return 'needs_attention';
      if (completed) return 'completed';
      if (paused) return 'paused';
      if (isToday(date, todayIso) || isThisWeek(date, todayIso, weekEndIso)) {
        return 'today_and_week';
      }
      return 'in_progress';
  }
}

export function groupActivities(
  records: ActivityRecord[],
  groups: ActivityGroupDefinition[],
  ctx: GroupActivitiesContext,
): Map<string, ActivityRecord[]> {
  const map = new Map<string, ActivityRecord[]>();
  for (const g of groups) {
    map.set(g.id, []);
  }

  for (const record of records) {
    const groupId = assignGroup(record, ctx);
    if (map.has(groupId)) {
      map.get(groupId)!.push(record);
    } else {
      const fallback = groups[groups.length - 1]?.id;
      if (fallback && map.has(fallback)) map.get(fallback)!.push(record);
    }
  }

  for (const [, list] of map) {
    list.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  }

  return map;
}

function isTodayDate(iso: string, todayIso: string): boolean {
  return iso.slice(0, 10) === todayIso;
}

function isThisWeekDate(iso: string, todayIso: string, weekEndIso: string): boolean {
  const d = iso.slice(0, 10);
  return d >= todayIso && d <= weekEndIso;
}

export function filterActivitiesByChip(
  records: ActivityRecord[],
  filterId: string,
  todayIso: string,
  weekEndIso: string,
): ActivityRecord[] {
  if (filterId === 'all') return records;

  if (filterId.startsWith('presentation_')) {
    const type = filterId.replace('presentation_', '');
    return records.filter((r) => r.presentationType === type);
  }

  switch (filterId) {
    case 'needs_attention':
      return records.filter((r) => r.needsAttention || r.status === 'needs_attention');
    case 'today':
      return records.filter((r) => isTodayDate(r.sortDate, todayIso));
    case 'this_week':
      return records.filter((r) => isThisWeekDate(r.sortDate, todayIso, weekEndIso));
    case 'upcoming':
      return records.filter((r) => r.status !== 'completed' && r.status !== 'cancelled');
    case 'active':
    case 'in_progress':
      return records.filter((r) => r.status === 'active' || r.status === 'needs_attention');
    case 'waiting':
      return records.filter((r) => r.status === 'waiting');
    case 'completed':
      return records.filter((r) => r.status === 'completed');
    case 'paused':
      return records.filter((r) => r.engagement?.status === 'paused');
    case 'low_remaining':
      return records.filter(
        (r) =>
          r.engagement?.kind === 'session_pack' &&
          r.usageLabel != null &&
          r.usageLabel.includes('נותרו') &&
          parseInt(r.usageLabel, 10) <= 2,
      );
    case 'expiring_soon':
      return records.filter((r) => Boolean(r.deadlineLabel?.includes('תוקף')));
    case 'upcoming_deadlines':
      return records.filter((r) => Boolean(r.deadlineLabel?.includes('מסירה')));
    default:
      return records;
  }
}
