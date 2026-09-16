import { getSupabaseAdminOptional } from '../../core/supabase.server';
import { isExternalEventProcessingStale } from './externalEventProcessing.policy';
import type {
  ExternalEventProcessingClaim,
  ExternalEventProcessingStatus,
  ExternalEventRecord,
  ReceiveExternalEventInput,
  ReceiveExternalEventResult,
} from './externalEvent.types';

interface ExternalEventRow {
  id: string;
  provider: string;
  external_event_id: string;
  event_type: string | null;
  business_id: string | null;
  connection_id: string | null;
  lead_id: string | null;
  invoice_id: string | null;
  processing_status: ExternalEventProcessingStatus;
  processed: boolean;
  processed_at: string | null;
  error: string | null;
  raw_payload: unknown;
  received_at: string;
  processing_claimed_at: string | null;
}

function rowToRecord(row: ExternalEventRow): ExternalEventRecord {
  return {
    id: row.id,
    provider: row.provider,
    externalEventId: row.external_event_id,
    eventType: row.event_type,
    businessId: row.business_id,
    connectionId: row.connection_id,
    leadId: row.lead_id,
    invoiceId: row.invoice_id,
    processingStatus: row.processing_status,
    processed: row.processed,
    processedAt: row.processed_at,
    error: row.error,
    rawPayload: row.raw_payload,
    receivedAt: row.received_at,
    processingClaimedAt: row.processing_claimed_at ?? null,
  };
}

/** In-memory fallback for tests — enforces same uniqueness as DB. */
const memoryEvents = new Map<string, ExternalEventRecord>();

function memoryKey(provider: string, externalEventId: string): string {
  return `${provider}:${externalEventId}`;
}

function useMemoryStore(): boolean {
  return getSupabaseAdminOptional() === null;
}

export function resetExternalEventMemoryStoreForTests(): void {
  memoryEvents.clear();
}

/** Test-only: backdate processing lease for stale reclaim scenarios. */
export function setExternalEventProcessingClaimedAtForTests(
  eventId: string,
  processingClaimedAt: string,
): void {
  if (!useMemoryStore()) {
    throw new Error('setExternalEventProcessingClaimedAtForTests requires memory store');
  }
  for (const [key, event] of memoryEvents.entries()) {
    if (event.id !== eventId) continue;
    memoryEvents.set(key, { ...event, processingClaimedAt });
    return;
  }
  throw new Error(`External event not found: ${eventId}`);
}

/**
 * Receive (idempotent) then claim processing rights.
 * Processed events are skipped; failed events may be retried on Meta redelivery.
 */
export async function claimExternalEventForProcessing(
  input: ReceiveExternalEventInput,
): Promise<ExternalEventProcessingClaim> {
  const received = await receiveExternalEvent(input);
  const event = received.event;

  if (received.outcome === 'created') {
    const processing = await markExternalEventProcessing(event.id);
    return { action: 'process', event: processing, reason: 'created' };
  }

  if (event.processingStatus === 'processed') {
    return { action: 'skip', event, reason: 'already_processed' };
  }

  if (event.processingStatus === 'processing') {
    if (isExternalEventProcessingStale(event)) {
      const processing = await markExternalEventProcessing(event.id);
      return { action: 'process', event: processing, reason: 'retry_stale_processing' };
    }
    return { action: 'skip', event, reason: 'in_progress' };
  }

  if (event.processingStatus === 'failed') {
    const processing = await markExternalEventProcessing(event.id);
    return { action: 'process', event: processing, reason: 'retry_failed' };
  }

  const processing = await markExternalEventProcessing(event.id);
  return { action: 'process', event: processing, reason: 'resume_received' };
}

export async function receiveExternalEvent(
  input: ReceiveExternalEventInput,
): Promise<ReceiveExternalEventResult> {
  if (useMemoryStore()) {
    return receiveExternalEventMemory(input);
  }
  return receiveExternalEventSupabase(input);
}

async function receiveExternalEventMemory(
  input: ReceiveExternalEventInput,
): Promise<ReceiveExternalEventResult> {
  const key = memoryKey(input.provider, input.externalEventId);
  const existing = memoryEvents.get(key);
  if (existing) {
    return { outcome: 'duplicate', event: existing };
  }

  const event: ExternalEventRecord = {
    id: crypto.randomUUID(),
    provider: input.provider,
    externalEventId: input.externalEventId,
    eventType: input.eventType,
    businessId: input.businessId ?? null,
    connectionId: input.connectionId ?? null,
    leadId: null,
    invoiceId: null,
    processingStatus: 'received',
    processed: false,
    processedAt: null,
    error: null,
    rawPayload: input.rawPayload ?? {},
    receivedAt: new Date().toISOString(),
    processingClaimedAt: null,
  };
  memoryEvents.set(key, event);
  return { outcome: 'created', event };
}

async function receiveExternalEventSupabase(
  input: ReceiveExternalEventInput,
): Promise<ReceiveExternalEventResult> {
  const supabase = getSupabaseAdminOptional();
  if (!supabase) {
    return receiveExternalEventMemory(input);
  }

  const insertRow = {
    provider: input.provider,
    external_event_id: input.externalEventId,
    event_type: input.eventType,
    business_id: input.businessId ?? null,
    connection_id: input.connectionId ?? null,
    processing_status: 'received' as const,
    processed: false,
    raw_payload: input.rawPayload ?? {},
  };

  const { data, error } = await supabase
    .from('integration_webhook_events')
    .insert(insertRow)
    .select('*')
    .maybeSingle();

  if (error) {
    if (error.code === '23505') {
      const { data: existing, error: fetchError } = await supabase
        .from('integration_webhook_events')
        .select('*')
        .eq('provider', input.provider)
        .eq('external_event_id', input.externalEventId)
        .maybeSingle();
      if (fetchError || !existing) {
        throw fetchError ?? new Error('Duplicate external event but row not found');
      }
      return { outcome: 'duplicate', event: rowToRecord(existing as ExternalEventRow) };
    }
    throw error;
  }

  if (!data) {
    throw new Error('External event insert returned no row');
  }

  return { outcome: 'created', event: rowToRecord(data as ExternalEventRow) };
}

export async function getExternalEventById(id: string): Promise<ExternalEventRecord | null> {
  if (useMemoryStore()) {
    for (const event of memoryEvents.values()) {
      if (event.id === id) return event;
    }
    return null;
  }

  const supabase = getSupabaseAdminOptional();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('integration_webhook_events')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as ExternalEventRow);
}

export async function markExternalEventProcessing(id: string): Promise<ExternalEventRecord> {
  const claimedAt = new Date().toISOString();
  return updateExternalEventStatus(id, {
    processingStatus: 'processing',
    processed: false,
    clearError: true,
    processingClaimedAt: claimedAt,
  });
}

export async function markExternalEventProcessed(
  id: string,
  patch?: {
    leadId?: string | null;
    businessId?: string | null;
    connectionId?: string | null;
  },
): Promise<ExternalEventRecord> {
  const now = new Date().toISOString();
  return updateExternalEventStatus(id, {
    processingStatus: 'processed',
    processed: true,
    processedAt: now,
    leadId: patch?.leadId,
    businessId: patch?.businessId,
    clearError: true,
  });
}

export async function markExternalEventFailed(
  id: string,
  errorMessage: string,
): Promise<ExternalEventRecord> {
  const truncated = errorMessage.slice(0, 2000);
  return updateExternalEventStatus(id, {
    processingStatus: 'failed',
    processed: false,
    error: truncated,
  });
}

async function updateExternalEventStatus(
  id: string,
  update: {
    processingStatus: ExternalEventProcessingStatus;
    processed: boolean;
    processedAt?: string | null;
    error?: string | null;
    leadId?: string | null;
    businessId?: string | null;
    connectionId?: string | null;
    processingClaimedAt?: string | null;
    clearError?: boolean;
  },
): Promise<ExternalEventRecord> {
  if (useMemoryStore()) {
    for (const [key, event] of memoryEvents.entries()) {
      if (event.id !== id) continue;
      const next: ExternalEventRecord = {
        ...event,
        processingStatus: update.processingStatus,
        processed: update.processed,
        processedAt: update.processedAt ?? event.processedAt,
        error: update.clearError ? null : (update.error ?? event.error),
        leadId: update.leadId !== undefined ? update.leadId : event.leadId,
        businessId: update.businessId !== undefined ? update.businessId : event.businessId,
        connectionId:
          update.connectionId !== undefined ? update.connectionId : event.connectionId,
        processingClaimedAt:
          update.processingClaimedAt !== undefined
            ? update.processingClaimedAt
            : event.processingClaimedAt,
      };
      memoryEvents.set(key, next);
      return next;
    }
    throw new Error(`External event not found: ${id}`);
  }

  const supabase = getSupabaseAdminOptional();
  if (!supabase) {
    throw new Error('Supabase admin not configured');
  }

  const patch: Record<string, unknown> = {
    processing_status: update.processingStatus,
    processed: update.processed,
  };
  if (update.processedAt !== undefined) patch.processed_at = update.processedAt;
  if (update.clearError) patch.error = null;
  else if (update.error !== undefined) patch.error = update.error;
  if (update.leadId !== undefined) patch.lead_id = update.leadId;
  if (update.businessId !== undefined) patch.business_id = update.businessId;
  if (update.connectionId !== undefined) patch.connection_id = update.connectionId;
  if (update.processingClaimedAt !== undefined) {
    patch.processing_claimed_at = update.processingClaimedAt;
  }

  const { data, error } = await supabase
    .from('integration_webhook_events')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw error ?? new Error('External event update failed');
  }

  return rowToRecord(data as ExternalEventRow);
}
