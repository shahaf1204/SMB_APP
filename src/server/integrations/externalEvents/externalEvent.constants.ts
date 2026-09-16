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

/**
 * Processing lease for ExternalEvent rows stuck in `processing` after a crashed serverless invocation.
 * Reclaim happens synchronously on the next webhook delivery (no cron/queue).
 *
 * Chosen as 15 minutes: well beyond Vercel function timeouts, short enough that Meta retries
 * can recover a lead without operator intervention.
 */
export const EXTERNAL_EVENT_STALE_PROCESSING_MS = 15 * 60 * 1000;
