import type { ExternalFormConnection } from '../../types/externalForms';

const API = '/api/external-forms';

export interface PollDebugMeta {
  storage: 'supabase' | 'memory';
  pendingCount: number;
  lastWebhookAt: string | null;
  lastWebhookPreview: string | null;
}

export async function registerExternalFormConnection(
  connection: ExternalFormConnection,
): Promise<void> {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: connection.id,
      businessId: connection.businessId,
      ownerId: connection.ownerId,
      provider: connection.provider,
      formName: connection.formName,
      formUrl: connection.formUrl,
      secretKey: connection.secretKey,
      activityType: connection.activityType,
      isActive: connection.isActive,
      fieldMapping: connection.fieldMapping,
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Register failed');
  }
}

export async function pollExternalFormSubmissions(businessId: string): Promise<{
  submissions: Array<{
    id: string;
    connectionId: string;
    provider: ExternalFormConnection['provider'];
    externalSubmissionId?: string;
    rawPayload: unknown;
  }>;
  debug: PollDebugMeta;
}> {
  const res = await fetch(`${API}/poll?businessId=${encodeURIComponent(businessId)}`);
  if (!res.ok) {
    return {
      submissions: [],
      debug: {
        storage: 'memory',
        pendingCount: 0,
        lastWebhookAt: null,
        lastWebhookPreview: null,
      },
    };
  }
  const data = (await res.json()) as {
    submissions?: Array<{
      id: string;
      connectionId: string;
      provider: ExternalFormConnection['provider'];
      externalSubmissionId?: string;
      rawPayload: unknown;
    }>;
    debug?: PollDebugMeta;
  };
  return {
    submissions: data.submissions ?? [],
    debug: data.debug ?? {
      storage: 'memory',
      pendingCount: data.submissions?.length ?? 0,
      lastWebhookAt: null,
      lastWebhookPreview: null,
    },
  };
}

export async function acknowledgeExternalFormSubmissions(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await fetch(`${API}/poll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
}

export async function sendTestWebhook(
  connection: ExternalFormConnection,
  payload: unknown,
): Promise<Response> {
  return fetch(connection.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-form-secret': connection.secretKey,
    },
    body: JSON.stringify(payload),
  });
}
