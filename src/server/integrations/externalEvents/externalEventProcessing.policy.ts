import type { ExternalEventRecord } from './externalEvent.types';
import { EXTERNAL_EVENT_STALE_PROCESSING_MS } from './externalEvent.constants';

/** ISO timestamp used to decide if a `processing` claim is stale (lease start). */
export function externalEventProcessingClaimedAt(
  event: Pick<ExternalEventRecord, 'processingClaimedAt' | 'receivedAt'>,
): string {
  return event.processingClaimedAt ?? event.receivedAt;
}

/**
 * Serverless has no background worker — stale `processing` rows are reclaimed on the next
 * Meta delivery when the processing lease exceeded {@link EXTERNAL_EVENT_STALE_PROCESSING_MS}.
 */
export function isExternalEventProcessingStale(
  event: Pick<ExternalEventRecord, 'processingClaimedAt' | 'receivedAt'>,
  nowMs: number = Date.now(),
): boolean {
  const claimedMs = Date.parse(externalEventProcessingClaimedAt(event));
  if (Number.isNaN(claimedMs)) return true;
  return nowMs - claimedMs >= EXTERNAL_EVENT_STALE_PROCESSING_MS;
}
