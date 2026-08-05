import type { ActivityRecord } from './types';

function isUpcoming(record: ActivityRecord, todayIso: string): boolean {
  return record.sortDate.slice(0, 10) >= todayIso && record.status !== 'completed';
}

/**
 * Select one featured activity for the hero card.
 * Priority: needs attention → nearest upcoming → first active.
 */
export function selectFeaturedActivity(
  records: ActivityRecord[],
  todayIso: string,
  excludeId?: string,
): ActivityRecord | null {
  const pool = excludeId ? records.filter((r) => r.id !== excludeId) : records;
  if (!pool.length) return null;

  const attention = pool.filter(
    (r) => (r.needsAttention || r.status === 'needs_attention') && r.status !== 'completed',
  );
  if (attention.length) {
    return [...attention].sort((a, b) => a.sortDate.localeCompare(b.sortDate))[0];
  }

  const upcoming = pool.filter((r) => isUpcoming(r, todayIso));
  if (upcoming.length) {
    return upcoming[0];
  }

  const active = pool.find((r) => r.status === 'active');
  return active ?? null;
}
