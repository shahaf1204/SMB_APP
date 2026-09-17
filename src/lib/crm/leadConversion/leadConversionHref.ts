import type { Lead } from '../../../types/models';

export function resolveLeadActivityHref(lead: Lead): string | undefined {
  if (lead.convertedToEventId) return `/events/${lead.convertedToEventId}/edit`;
  const engagementId =
    lead.convertedToCardId ?? lead.convertedToProjectId ?? lead.convertedToClassId;
  if (engagementId) return `/engagements/${engagementId}`;
  if (lead.eventId) return `/events/${lead.eventId}/edit`;
  return undefined;
}
