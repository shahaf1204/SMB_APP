import type { Engagement, EngagementKind, Event, Lead } from '../../../types/models';
import type { LeadConversionTargetModel } from './types';

export const LEAD_CONVERSION_CREATION_SOURCE = 'lead_conversion' as const;

export interface ConversionActivityRef {
  activityId: string;
  activityKind: 'event' | 'engagement';
  effectiveTarget: LeadConversionTargetModel;
}

function isConversionProvenance(
  sourceLeadId: string | undefined,
  creationSource: string | undefined,
  leadId: string,
): boolean {
  return sourceLeadId === leadId && creationSource === LEAD_CONVERSION_CREATION_SOURCE;
}

function pickOldestEvent(events: Event[]): Event {
  return [...events].sort((a, b) => {
    const aKey = a.eventDate || '';
    const bKey = b.eventDate || '';
    if (aKey !== bKey) return aKey.localeCompare(bKey);
    return a.id.localeCompare(b.id);
  })[0];
}

function pickOldestEngagement(engagements: Engagement[]): Engagement {
  return [...engagements].sort((a, b) => {
    const aKey = a.createdAt || a.startDate || '';
    const bKey = b.createdAt || b.startDate || '';
    if (aKey !== bKey) return aKey.localeCompare(bKey);
    return a.id.localeCompare(b.id);
  })[0];
}

export function inferTargetFromEngagementKind(
  kind: EngagementKind,
  conversionTarget?: LeadConversionTargetModel,
): LeadConversionTargetModel {
  if (conversionTarget) return conversionTarget;
  switch (kind) {
    case 'session_pack':
      return 'package';
    case 'recurring_group':
      return 'recurring';
    case 'project':
    default:
      return 'project';
  }
}

/** Canonical lookup: activity already created from this lead (even if Lead patch failed). */
export function findConversionActivityByLeadId(
  leadId: string,
  events: Event[],
  engagements: Engagement[],
): ConversionActivityRef | null {
  const leadEvents = events.filter((e) =>
    isConversionProvenance(e.sourceLeadId, e.creationSource, leadId),
  );
  if (leadEvents.length > 0) {
    const event = pickOldestEvent(leadEvents);
    const effectiveTarget: LeadConversionTargetModel =
      event.conversionTarget === 'appointment' ? 'appointment' : 'event';
    return { activityId: event.id, activityKind: 'event', effectiveTarget };
  }

  const leadEngagements = (engagements ?? []).filter((e) =>
    isConversionProvenance(e.sourceLeadId, e.creationSource, leadId),
  );
  if (leadEngagements.length > 0) {
    const engagement = pickOldestEngagement(leadEngagements);
    return {
      activityId: engagement.id,
      activityKind: 'engagement',
      effectiveTarget: inferTargetFromEngagementKind(
        engagement.kind,
        engagement.conversionTarget,
      ),
    };
  }

  return null;
}

export function buildLeadConversionLinkPatch(
  target: LeadConversionTargetModel,
  activityId: string,
): Partial<Lead> {
  if (target === 'event' || target === 'appointment') {
    return { convertedToEventId: activityId, eventId: activityId };
  }
  if (target === 'package') return { convertedToCardId: activityId };
  if (target === 'recurring') return { convertedToClassId: activityId };
  return { convertedToProjectId: activityId };
}

export interface LeadConversionExecutionPlan {
  mode: 'reuse_existing' | 'create_new';
  effectiveTarget: LeadConversionTargetModel;
  existingActivityId?: string;
  existingActivityKind?: 'event' | 'engagement';
}

export function planLeadConversion(
  leadId: string,
  requestedTarget: LeadConversionTargetModel,
  events: Event[],
  engagements: Engagement[],
): LeadConversionExecutionPlan {
  const existing = findConversionActivityByLeadId(leadId, events, engagements);
  if (existing) {
    return {
      mode: 'reuse_existing',
      effectiveTarget: existing.effectiveTarget,
      existingActivityId: existing.activityId,
      existingActivityKind: existing.activityKind,
    };
  }
  return { mode: 'create_new', effectiveTarget: requestedTarget };
}
