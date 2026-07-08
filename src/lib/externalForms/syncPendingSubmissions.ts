import {
  acknowledgeExternalFormSubmissions,
  pollExternalFormSubmissions,
} from './clientApi';
import { logPipelineStage, patchPipelineDebug } from './pipelineDebug';

export interface PendingSubmissionProcessResult {
  pendingCount: number;
  processedCount: number;
  createdActivityIds: string[];
}

export async function processPendingExternalFormSubmissions(
  businessId: string,
  processSubmission: (params: {
    connectionId: string;
    rawPayload: unknown;
    externalSubmissionId?: string;
    submissionId?: string;
  }) => string | null,
): Promise<PendingSubmissionProcessResult> {
  const { submissions: pending, debug } = await pollExternalFormSubmissions(businessId);

  logPipelineStage('PENDING_POLLED', {
    lastPollAt: new Date().toISOString(),
    lastPendingCount: pending.length,
    storageBackend: debug.storage,
    lastWebhookReceivedAt: debug.lastWebhookAt,
    lastWebhookPreview: debug.lastWebhookPreview,
  });

  patchPipelineDebug({
    lastPollAt: new Date().toISOString(),
    lastPendingCount: pending.length,
    storageBackend: debug.storage,
    storageBackendReason:
      debug.storageReason ??
      (debug.storage === 'supabase'
        ? 'supabase — poll read from external_form_submissions'
        : 'memory — poll did not use Supabase (see Supabase diagnostics)'),
    lastWebhookReceivedAt: debug.lastWebhookAt,
    lastWebhookPreview: debug.lastWebhookPreview,
  });

  const ackIds: string[] = [];
  const createdActivityIds: string[] = [];

  for (const item of pending) {
    logPipelineStage('SUBMISSION_PROCESSING_STARTED', {
      lastProcessingStartedAt: new Date().toISOString(),
      payload: item.rawPayload,
    });

    const eventId = processSubmission({
      connectionId: item.connectionId,
      rawPayload: item.rawPayload,
      externalSubmissionId: item.externalSubmissionId,
      submissionId: item.id,
    });
    if (eventId) {
      ackIds.push(item.id);
      createdActivityIds.push(eventId);
      logPipelineStage('ACTIVITY_CREATED', { lastCreatedActivityId: eventId });
    }
  }

  if (ackIds.length) await acknowledgeExternalFormSubmissions(ackIds);

  return {
    pendingCount: pending.length,
    processedCount: createdActivityIds.length,
    createdActivityIds,
  };
}
