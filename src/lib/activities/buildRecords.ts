import type { ActivityStatus } from '../../components/business/ActivityCard';
import { ENGAGEMENT_KIND_LABEL } from '../engagements';
import { contextualDateLabel } from '../activityCard/contextualDateLabel';
import { externalFormEventBadge } from '../externalForms/badges';
import { formatDate } from '../finance';
import { getClientName, getEventRevenueTotal } from '../events';
import { engagementRevenueAmount } from '../finance/engagementFinancialSync';
import {
  engagementSessionsFor,
  nextWeekdayDate,
  packProgress,
  WEEKDAY_LABELS,
} from '../engagements';
import type {
  Business,
  Category,
  Engagement,
  EngagementSession,
  Event,
  EventValue,
  Invoice,
  Milestone,
} from '../../types/models';
import { isInvoiceOverdue } from '../invoices';
import { allowedActivityFilters } from '../workModel';
import { resolvePresentationForRecord } from './resolvePresentationForRecord';
import type { ActivityRecord } from './types';

function mapEngagementStatus(status: Engagement['status']): ActivityStatus {
  if (status === 'completed') return 'completed';
  if (status === 'paused') return 'waiting';
  return 'active';
}

function resolveEventPaymentStatus(
  eventId: string,
  invoices: Invoice[],
): ActivityRecord['paymentStatus'] {
  const linked = invoices.filter((inv) => inv.eventId === eventId);
  if (!linked.length) return null;
  if (linked.some(isInvoiceOverdue)) return 'overdue';
  if (linked.every((i) => i.status === 'paid')) return 'paid';
  if (linked.some((i) => i.status === 'paid')) return 'partial';
  return 'unpaid';
}

function resolveEngagementPaymentStatus(
  engagementId: string,
  invoices: Invoice[],
): ActivityRecord['paymentStatus'] {
  const linked = invoices.filter((inv) => inv.engagementId === engagementId);
  if (!linked.length) return null;
  if (linked.some(isInvoiceOverdue)) return 'overdue';
  if (linked.every((i) => i.status === 'paid')) return 'paid';
  if (linked.some((i) => i.status === 'paid')) return 'partial';
  return 'unpaid';
}

function buildEventRecord(
  event: Event,
  categories: Category[],
  eventValues: EventValue[],
  business: Business | null,
  invoices: Invoice[],
  todayIso: string,
): ActivityRecord | null {
  const allowed = allowedActivityFilters(business);
  if (!allowed.has('event')) return null;

  const clientName = getClientName(event.id, categories, eventValues) ?? 'לקוח';
  const amount = getEventRevenueTotal(event.id, eventValues);
  const isPast = event.eventDate < todayIso;
  const formBadge = externalFormEventBadge(event);
  const presentationType = resolvePresentationForRecord(business, { source: 'event' });

  return {
    id: `ev-${event.id}`,
    sourceId: event.id,
    source: 'event',
    presentationType,
    title: event.title,
    clientName,
    location: event.location.trim() || undefined,
    sortDate: event.eventDate,
    status: isPast ? 'completed' : 'active',
    amount: amount > 0 ? amount : undefined,
    href: `/events/${event.id}/edit`,
    event,
    tags: formBadge ? [formBadge] : [],
    needsAttention: false,
    contextualLabel: contextualDateLabel(event.eventDate),
    paymentStatus: resolveEventPaymentStatus(event.id, invoices),
    phone: event.clientPhone,
  };
}

function buildEngagementRecord(
  engagement: Engagement,
  milestones: Milestone[],
  eventValues: EventValue[],
  sessions: EngagementSession[],
  business: Business | null,
  invoices: Invoice[],
  todayIso: string,
): ActivityRecord | null {
  const allowed = allowedActivityFilters(business);
  if (!allowed.has(engagement.kind)) return null;

  const presentationType = resolvePresentationForRecord(business, {
    source: 'engagement',
    engagementKind: engagement.kind,
  });

  const relatedMs = milestones.filter((m) => m.engagementId === engagement.id);
  const amount =
    (engagement.eventId ? getEventRevenueTotal(engagement.eventId, eventValues) : 0) ||
    engagementRevenueAmount(engagement, relatedMs);

  let sortDate = engagement.startDate ?? engagement.createdAt.slice(0, 10);
  let nextOccurrenceLabel: string | undefined;
  let recurrenceLabel: string | undefined;
  let usageLabel: string | undefined;
  let progressPercent: number | undefined;
  let progressDetail: string | undefined;
  let deadlineLabel: string | undefined;
  const tags: string[] = [ENGAGEMENT_KIND_LABEL[engagement.kind]];

  if (engagement.kind === 'recurring_group') {
    if (engagement.weekday != null) {
      sortDate = nextWeekdayDate(engagement.weekday);
      nextOccurrenceLabel = formatDate(sortDate);
      recurrenceLabel = `כל יום ${WEEKDAY_LABELS[engagement.weekday]}`;
      if (engagement.lessonTime) {
        recurrenceLabel += ` · ${engagement.lessonTime}`;
      }
    }
    const memberCount = engagement.members?.length ?? 0;
    if (memberCount > 0) progressDetail = `${memberCount} משתתפים`;
  }

  if (engagement.kind === 'session_pack') {
    const { used, total, remaining } = packProgress(engagement);
    if (total > 0) {
      progressPercent = Math.round((used / total) * 100);
      usageLabel = `נותרו ${remaining} מתוך ${total}`;
      progressDetail = `${used} מתוך ${total} נוצלו`;
    }
    if (engagement.packExpiresAt) {
      deadlineLabel = `תוקף ${formatDate(engagement.packExpiresAt)}`;
      sortDate = engagement.packExpiresAt.slice(0, 10);
    }
    const lastSession = engagementSessionsFor(engagement.id, sessions)[0];
    if (lastSession) sortDate = lastSession.date;
  }

  if (engagement.kind === 'project') {
    if (engagement.endDate) {
      deadlineLabel = `מסירה ${formatDate(engagement.endDate)}`;
      sortDate = engagement.endDate;
    }
    if (relatedMs.length > 0) {
      progressDetail = `${relatedMs.filter((m) => m.status === 'paid').length}/${relatedMs.length} אבני דרך`;
    }
  }

  const needsAttention = Boolean(
    (engagement.kind === 'session_pack' &&
      engagement.status === 'active' &&
      packProgress(engagement).remaining <= 2 &&
      packProgress(engagement).total > 0) ||
      (engagement.kind === 'session_pack' &&
        engagement.packExpiresAt &&
        engagement.packExpiresAt.slice(0, 10) >= todayIso &&
        daysUntil(engagement.packExpiresAt.slice(0, 10), todayIso) <= 14) ||
      (engagement.kind === 'project' &&
        engagement.status === 'active' &&
        engagement.endDate &&
        engagement.endDate.slice(0, 10) < todayIso),
  );

  return {
    id: `eng-${engagement.id}`,
    sourceId: engagement.id,
    source: 'engagement',
    engagementKind: engagement.kind,
    presentationType,
    title: engagement.title,
    clientName: engagement.clientName || engagement.title,
    sortDate,
    endDate: engagement.endDate,
    status: mapEngagementStatus(engagement.status),
    amount: amount > 0 ? amount : undefined,
    href: `/engagements/${engagement.id}`,
    engagement,
    tags,
    needsAttention,
    contextualLabel: contextualDateLabel(sortDate),
    usageLabel,
    deadlineLabel,
    recurrenceLabel,
    nextOccurrenceLabel,
    progressPercent,
    progressDetail,
    paymentStatus: resolveEngagementPaymentStatus(engagement.id, invoices),
    phone: engagement.clientPhone,
  };
}

function daysUntil(targetIso: string, todayIso: string): number {
  const target = new Date(`${targetIso.slice(0, 10)}T12:00:00`);
  const today = new Date(`${todayIso.slice(0, 10)}T12:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function buildActivityRecords(params: {
  business: Business | null;
  events: Event[];
  engagements: Engagement[];
  categories: Category[];
  eventValues: EventValue[];
  milestones: Milestone[];
  sessions: EngagementSession[];
  invoices: Invoice[];
  todayIso: string;
}): ActivityRecord[] {
  const records: ActivityRecord[] = [];

  for (const event of params.events) {
    const row = buildEventRecord(
      event,
      params.categories,
      params.eventValues,
      params.business,
      params.invoices,
      params.todayIso,
    );
    if (row) records.push(row);
  }

  for (const engagement of params.engagements) {
    const row = buildEngagementRecord(
      engagement,
      params.milestones,
      params.eventValues,
      params.sessions,
      params.business,
      params.invoices,
      params.todayIso,
    );
    if (row) records.push(row);
  }

  return records.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
}

export function searchActivityRecords(
  records: ActivityRecord[],
  query: string,
): ActivityRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return records;

  return records.filter((r) => {
    const haystack = [
      r.title,
      r.clientName,
      r.location ?? '',
      r.stage ?? '',
      r.status,
      ...r.tags,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
