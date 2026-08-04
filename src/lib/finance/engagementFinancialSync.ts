import { buildEventValuesFromInputs } from '../eventForm';
import { createId } from '../ids';
import type {
  Business,
  Category,
  Engagement,
  Event,
  EventValue,
  Milestone,
} from '../../types/models';
import type { OperatingModel } from '../../types/workspace';
import {
  engagementKindToOperatingModel,
  getOperatingModelFinancialField,
} from './operatingModelFinancialField';
import { findClientNameCategory, findRevenueCategory } from './revenueCategory';

export function engagementRevenueAmount(
  engagement: Engagement,
  milestones: Milestone[],
): number {
  if (engagement.kind === 'session_pack') {
    return engagement.packAmount ?? 0;
  }
  if (engagement.kind === 'project') {
    const related = milestones.filter((m) => m.engagementId === engagement.id);
    if (related.length > 0) {
      return related.reduce((sum, m) => sum + (m.amount ?? 0), 0);
    }
    return engagement.totalValue ?? 0;
  }
  return 0;
}

export function reportingDateForEngagement(engagement: Engagement): string {
  return engagement.startDate || engagement.createdAt.slice(0, 10);
}

interface SyncResult {
  events: Event[];
  eventValues: EventValue[];
  engagement: Engagement;
}

/**
 * Ensures a linked Event + revenue EventValue exist for engagement financials.
 * Uses startDate as reporting date (expected revenue — same rule as events).
 */
export function syncEngagementFinancialEvent(
  engagement: Engagement,
  milestones: Milestone[],
  events: Event[],
  eventValues: EventValue[],
  categories: Category[],
  business: Business,
  userId: string,
  preferredModel?: OperatingModel,
): SyncResult {
  const model = engagementKindToOperatingModel(engagement.kind, preferredModel);
  const amount = engagementRevenueAmount(engagement, milestones);
  const revenueCategory = findRevenueCategory(categories, model);
  const clientCategory = findClientNameCategory(categories);

  let nextEvents = events;
  let nextValues = eventValues;
  let nextEngagement = engagement;

  let eventId = engagement.eventId;
  let event = eventId ? events.find((e) => e.id === eventId) : undefined;

  if (!event) {
    eventId = createId();
    event = {
      id: eventId,
      businessId: business.id,
      userId,
      title: engagement.title,
      eventDate: reportingDateForEngagement(engagement),
      location: '',
      notes: engagement.notes ?? '',
      clientEmail: engagement.clientEmail,
      clientPhone: engagement.clientPhone,
    };
    nextEvents = [...events, event];
    nextEngagement = { ...engagement, eventId };
  } else {
    const patched: Event = {
      ...event,
      title: engagement.title,
      eventDate: reportingDateForEngagement(engagement),
      notes: engagement.notes ?? event.notes,
      clientEmail: engagement.clientEmail ?? event.clientEmail,
      clientPhone: engagement.clientPhone ?? event.clientPhone,
    };
    if (
      patched.title !== event.title ||
      patched.eventDate !== event.eventDate ||
      patched.notes !== event.notes
    ) {
      nextEvents = events.map((e) => (e.id === event!.id ? patched : e));
      event = patched;
    }
  }

  if (!revenueCategory || amount <= 0) {
    return { events: nextEvents, eventValues: nextValues, engagement: nextEngagement };
  }

  const categoryInputs: Record<string, string> = {
    [revenueCategory.id]: String(amount),
  };
  if (clientCategory && engagement.clientName.trim()) {
    categoryInputs[clientCategory.id] = engagement.clientName.trim();
  }

  const existingForEvent = nextValues.filter((ev) => ev.eventId === eventId);
  const rebuilt = buildEventValuesFromInputs(
    eventId!,
    business.id,
    userId,
    categories,
    categoryInputs,
    existingForEvent,
  );

  const otherValues = nextValues.filter((ev) => ev.eventId !== eventId);
  nextValues = [...otherValues, ...rebuilt];

  return { events: nextEvents, eventValues: nextValues, engagement: nextEngagement };
}

export function financialFieldLabelForEngagement(
  engagement: Engagement,
  preferredModel?: OperatingModel,
): string {
  const model = engagementKindToOperatingModel(engagement.kind, preferredModel);
  return getOperatingModelFinancialField(model).label;
}
