import {
  acknowledgeExternalFormSubmissions,
  pollExternalFormSubmissions,
} from './clientApi';

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
  const pending = await pollExternalFormSubmissions(businessId);
  const ackIds: string[] = [];
  const createdActivityIds: string[] = [];

  for (const item of pending) {
    const eventId = processSubmission({
      connectionId: item.connectionId,
      rawPayload: item.rawPayload,
      externalSubmissionId: item.externalSubmissionId,
      submissionId: item.id,
    });
    if (eventId) {
      ackIds.push(item.id);
      createdActivityIds.push(eventId);
    }
  }

  if (ackIds.length) await acknowledgeExternalFormSubmissions(ackIds);

  return {
    pendingCount: pending.length,
    processedCount: createdActivityIds.length,
    createdActivityIds,
  };
}
