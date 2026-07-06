import {
  acknowledgeExternalFormSubmissions,
  pollExternalFormSubmissions,
} from './clientApi';

export async function processPendingExternalFormSubmissions(
  businessId: string,
  processSubmission: (params: {
    connectionId: string;
    rawPayload: unknown;
    externalSubmissionId?: string;
    submissionId?: string;
  }) => string | null,
): Promise<number> {
  const pending = await pollExternalFormSubmissions(businessId);
  const ackIds: string[] = [];
  let created = 0;

  for (const item of pending) {
    const eventId = processSubmission({
      connectionId: item.connectionId,
      rawPayload: item.rawPayload,
      externalSubmissionId: item.externalSubmissionId,
      submissionId: item.id,
    });
    if (eventId) {
      ackIds.push(item.id);
      created += 1;
    }
  }

  if (ackIds.length) await acknowledgeExternalFormSubmissions(ackIds);
  return created;
}
