import type {
  Business,
  Category,
  Engagement,
  Event,
  EventValue,
  Milestone,
} from '../../types/models';
import { syncEngagementFinancialEvent } from './engagementFinancialSync';
import { resolveWorkspace } from '../workspace';

/**
 * One-time migration: link engagements with amounts to canonical Event + EventValue rows.
 * Skips when revenue is already present on the linked event (prevents duplicates).
 */
export function migrateEngagementFinancials(
  engagements: Engagement[],
  milestones: Milestone[],
  events: Event[],
  eventValues: EventValue[],
  categories: Category[],
  business: Business | null,
): { engagements: Engagement[]; events: Event[]; eventValues: EventValue[] } {
  if (!business) {
    return { engagements, events, eventValues };
  }

  let nextEngagements = engagements;
  let nextEvents = events;
  let nextValues = eventValues;
  const workspace = resolveWorkspace(business);
  const preferredJourney =
    workspace?.primaryOperatingModel === 'journey' ? 'journey' : undefined;

    for (const engagement of engagements) {
    if (engagement.kind !== 'project' && engagement.kind !== 'session_pack') continue;

    const existingRevenue = engagement.eventId
      ? nextValues
          .filter((ev) => ev.eventId === engagement.eventId)
          .reduce((sum, ev) => sum + (ev.revenueValue ?? 0), 0)
      : 0;

    if (engagement.eventId && existingRevenue > 0) continue;

    const result = syncEngagementFinancialEvent(
      engagement,
      milestones,
      nextEvents,
      nextValues,
      categories,
      business,
      engagement.userId,
      engagement.kind === 'project' ? preferredJourney : undefined,
    );

    nextEngagements = nextEngagements.map((e) =>
      e.id === engagement.id ? result.engagement : e,
    );
    nextEvents = result.events;
    nextValues = result.eventValues;
  }

  return {
    engagements: nextEngagements,
    events: nextEvents,
    eventValues: nextValues,
  };
}
