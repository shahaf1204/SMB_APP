/**
 * Phase 3A idempotency contract (Meta and future providers).
 *
 * The same external delivery must map to one row in integration_webhook_events.
 * Uniqueness: (provider, external_event_id).
 */
export const META_LEAD_PROVIDER = 'meta';

/** Meta Leadgen webhook — external_event_id is the leadgen_id from Meta. */
export const META_LEADGEN_EVENT_TYPE = 'meta.leadgen';

export function metaLeadExternalEventId(leadgenId: string): string {
  return leadgenId.trim();
}
