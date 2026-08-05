import type { ActivityRecord } from './types';
import type { Invoice } from '../../types/models';
import { isInvoiceOverdue } from '../invoices';

export interface AttentionContext {
  todayIso: string;
  weekEndIso: string;
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso.slice(0, 10)}T12:00:00`);
  const to = new Date(`${toIso.slice(0, 10)}T12:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function hasOverdueInvoiceForActivity(
  record: ActivityRecord,
  invoices: Invoice[],
): boolean {
  const linked = invoices.filter((inv) => {
    if (record.source === 'event') return inv.eventId === record.sourceId;
    return inv.engagementId === record.sourceId;
  });
  return linked.some(isInvoiceOverdue);
}

/** Central attention resolver — only flags backed by real data. */
export function resolveActivityAttention(
  record: ActivityRecord,
  ctx: AttentionContext,
  invoices: Invoice[],
): boolean {
  if (record.needsAttention) return true;

  if (hasOverdueInvoiceForActivity(record, invoices)) return true;

  const engagement = record.engagement;
  if (engagement?.kind === 'session_pack' && engagement.status === 'active') {
    const total = engagement.totalSessions ?? 0;
    const used = engagement.usedSessions ?? 0;
    const remaining = Math.max(0, total - used);
    if (total > 0 && remaining > 0 && remaining <= 2) return true;

    if (engagement.packExpiresAt) {
      const days = daysBetween(ctx.todayIso, engagement.packExpiresAt.slice(0, 10));
      if (days >= 0 && days <= 14) return true;
    }
  }

  if (engagement?.kind === 'project' && engagement.status === 'active' && engagement.endDate) {
    const end = engagement.endDate.slice(0, 10);
    if (end < ctx.todayIso) return true;
  }

  return false;
}

export function applyAttentionFlags(
  records: ActivityRecord[],
  ctx: AttentionContext,
  invoices: Invoice[],
): ActivityRecord[] {
  return records.map((r) => {
    const needsAttention = resolveActivityAttention(r, ctx, invoices);
    return needsAttention === r.needsAttention
      ? r
      : {
          ...r,
          needsAttention,
          status: needsAttention && r.status === 'active' ? 'needs_attention' : r.status,
        };
  });
}
