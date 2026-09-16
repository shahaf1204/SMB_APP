/** Durable ingestion record — not a domain Lead/Event/Payment. */

export type ExternalEventProcessingStatus =
  | 'received'
  | 'processing'
  | 'processed'
  | 'failed';

export type ExternalEventReceiveOutcome = 'created' | 'duplicate';

export interface ExternalEventRecord {
  id: string;
  provider: string;
  externalEventId: string;
  eventType: string | null;
  businessId: string | null;
  connectionId: string | null;
  leadId: string | null;
  invoiceId: string | null;
  processingStatus: ExternalEventProcessingStatus;
  /** Legacy column — true when processingStatus is `processed`. */
  processed: boolean;
  processedAt: string | null;
  error: string | null;
  rawPayload: unknown;
  receivedAt: string;
  /** Set when entering `processing` — used for stale lease reclaim. */
  processingClaimedAt: string | null;
}

export interface ReceiveExternalEventInput {
  provider: string;
  externalEventId: string;
  eventType: string;
  businessId?: string | null;
  connectionId?: string | null;
  rawPayload?: unknown;
}

export type ReceiveExternalEventResult =
  | { outcome: 'created'; event: ExternalEventRecord }
  | { outcome: 'duplicate'; event: ExternalEventRecord };

/** Whether a duplicate webhook delivery should run domain processing again. */
export type ExternalEventProcessingClaim =
  | {
      action: 'process';
      event: ExternalEventRecord;
      reason: 'created' | 'retry_failed' | 'resume_received' | 'retry_stale_processing';
    }
  | { action: 'skip'; event: ExternalEventRecord; reason: 'already_processed' | 'in_progress' };
