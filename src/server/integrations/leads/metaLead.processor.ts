import {
  META_LEADGEN_EVENT_TYPE,
  META_LEAD_PROVIDER,
  claimExternalEventForProcessing,
  markExternalEventFailed,
  markExternalEventProcessed,
} from '../externalEvents';
import { decryptMetaAccessToken } from '../../core/integrationSecrets.server';
import { touchMetaConnectionLastLeadReceived } from './metaConnectionTimestamps.server';
import {
  createLeadFromExternalSourceDb,
  fetchMetaLead,
  findMetaConnectionByPageId,
} from './metaLead.service';
import { normalizeMetaLeadFromGraph } from './normalizedMetaLead';
import type { MetaLeadgenWebhookChange } from './metaWebhook.parse';

export type MetaLeadProcessingKind = 'success' | 'skipped' | 'non_retryable' | 'retryable';

export interface MetaLeadProcessingResult {
  leadgenId: string;
  kind: MetaLeadProcessingKind;
  reason?: string;
  leadId?: string;
  externalEventId?: string;
}

export class MetaGraphFetchError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'MetaGraphFetchError';
  }

  get retryable(): boolean {
    return this.statusCode >= 500 || this.statusCode === 429;
  }
}

export async function fetchMetaLeadOrThrow(
  leadgenId: string,
  accessToken: string,
): Promise<Awaited<ReturnType<typeof fetchMetaLead>> & object> {
  const version = process.env.META_GRAPH_VERSION ?? 'v21.0';
  const url = `https://graph.facebook.com/${version}/${leadgenId}?access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    const safeMessage = `Meta Graph error (${res.status})`;
    console.error(safeMessage, body.slice(0, 500));
    throw new MetaGraphFetchError(safeMessage, res.status);
  }
  const data = (await res.json()) as Awaited<ReturnType<typeof fetchMetaLead>>;
  if (!data) {
    throw new MetaGraphFetchError('Meta Graph returned empty lead', 502);
  }
  return data;
}

function isRetryableInfrastructureError(error: unknown): boolean {
  if (error instanceof MetaGraphFetchError) return error.retryable;
  const message = error instanceof Error ? error.message : String(error);
  if (/ECONNRESET|ETIMEDOUT|fetch failed|Supabase admin not configured/i.test(message)) {
    return true;
  }
  return false;
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/access_token=[^&\s]+/gi, 'access_token=[REDACTED]').slice(0, 2000);
}

export async function processMetaLeadgenChange(
  change: MetaLeadgenWebhookChange,
  receivedAt: string,
): Promise<MetaLeadProcessingResult> {
  const claim = await claimExternalEventForProcessing({
    provider: META_LEAD_PROVIDER,
    externalEventId: change.leadgenId,
    eventType: META_LEADGEN_EVENT_TYPE,
    rawPayload: change.rawChange,
  });

  if (claim.action === 'skip') {
    return {
      leadgenId: change.leadgenId,
      kind: 'skipped',
      reason: claim.reason,
      externalEventId: claim.event.id,
      leadId: claim.event.leadId ?? undefined,
    };
  }

  const eventId = claim.event.id;

  try {
    const connection = await findMetaConnectionByPageId(change.pageId);
    if (!connection?.access_token_encrypted) {
      await markExternalEventFailed(eventId, 'page_not_connected');
      return {
        leadgenId: change.leadgenId,
        kind: 'non_retryable',
        reason: 'page_not_connected',
        externalEventId: eventId,
      };
    }

    const token = decryptMetaAccessToken(connection.access_token_encrypted as string);
    const graphLead = await fetchMetaLeadOrThrow(change.leadgenId, token);

    const normalized = normalizeMetaLeadFromGraph(graphLead, {
      leadgenId: change.leadgenId,
      pageId: change.pageId,
      pageName: connection.page_name as string,
      formIdFromWebhook: change.formId,
      webhookChange: change,
      receivedAt: change.createdTime ?? receivedAt,
    });

    const leadResult = await createLeadFromExternalSourceDb({
      businessId: connection.business_id as string,
      userId: connection.user_id as string,
      fullName: normalized.fullName,
      phone: normalized.phone,
      email: normalized.email,
      source: normalized.source,
      serviceInterest: normalized.serviceInterest,
      externalProvider: normalized.externalProvider,
      externalLeadId: normalized.externalLeadId,
      externalFormId: normalized.externalFormId,
      externalFormName: normalized.externalFormName,
      externalPageId: normalized.externalPageId,
      externalPageName: normalized.externalPageName,
      externalCampaignId: normalized.externalCampaignId,
      externalCampaignName: normalized.externalCampaignName,
      externalAdId: normalized.externalAdId,
      externalAdName: normalized.externalAdName,
      formAnswers: normalized.formAnswers,
      rawPayload: normalized.rawPayload,
    });

    await markExternalEventProcessed(eventId, {
      leadId: leadResult.id,
      businessId: connection.business_id as string,
      connectionId: connection.id as string,
    });

    await touchMetaConnectionLastLeadReceived(connection.id as string, new Date().toISOString());

    return {
      leadgenId: change.leadgenId,
      kind: 'success',
      leadId: leadResult.id,
      externalEventId: eventId,
    };
  } catch (error) {
    const message = sanitizeErrorMessage(error);
    await markExternalEventFailed(eventId, message);

    if (isRetryableInfrastructureError(error)) {
      return {
        leadgenId: change.leadgenId,
        kind: 'retryable',
        reason: message,
        externalEventId: eventId,
      };
    }

    return {
      leadgenId: change.leadgenId,
      kind: 'non_retryable',
      reason: message,
      externalEventId: eventId,
    };
  }
}

/** Maps batch processing outcomes to HTTP status for Meta redelivery semantics. */
export function resolveMetaLeadgenBatchHttpStatus(
  results: Pick<MetaLeadProcessingResult, 'kind'>[],
): number {
  return results.some((r) => r.kind === 'retryable') ? 503 : 200;
}

export async function processMetaLeadgenWebhookBatch(
  changes: MetaLeadgenWebhookChange[],
  receivedAt: string,
): Promise<{ results: MetaLeadProcessingResult[]; httpStatus: number }> {
  const results: MetaLeadProcessingResult[] = [];

  for (const change of changes) {
    results.push(await processMetaLeadgenChange(change, receivedAt));
  }

  return { results, httpStatus: resolveMetaLeadgenBatchHttpStatus(results) };
}
