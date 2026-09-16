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
