import {
  acknowledgeExternalFormSubmissions,
  pollExternalFormSubmissions,
} from './clientApi';
import { logPipelineStage, patchPipelineDebug } from './pipelineDebug';

export interface PendingSubmissionProcessResult {
  pendingCount: number;
  processedCount: number;
  /** Lead ids (lead_first) or legacy activity ids (auto_event). */
  createdResourceIds: string[];
  /** @deprecated Use createdResourceIds */
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
  const createdResourceIds: string[] = [];

  for (const item of pending) {
    logPipelineStage('SUBMISSION_PROCESSING_STARTED', {
      lastProcessingStartedAt: new Date().toISOString(),
      payload: item.rawPayload,
    });

    const resourceId = processSubmission({
      connectionId: item.connectionId,
      rawPayload: item.rawPayload,
      externalSubmissionId: item.externalSubmissionId,
      submissionId: item.id,
    });
    if (resourceId) {
      ackIds.push(item.id);
      createdResourceIds.push(resourceId);
      logPipelineStage('ACTIVITY_CREATED', { lastCreatedActivityId: resourceId });
    }
  }

  if (ackIds.length) await acknowledgeExternalFormSubmissions(ackIds);

  return {
    pendingCount: pending.length,
    processedCount: createdResourceIds.length,
    createdResourceIds,
    createdActivityIds: createdResourceIds,
  };
}
