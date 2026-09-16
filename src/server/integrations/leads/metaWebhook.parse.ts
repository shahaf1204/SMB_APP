export interface MetaLeadgenWebhookChange {
  leadgenId: string;
  pageId: string;
  formId?: string;
  createdTime?: string;
  rawChange: unknown;
}

interface MetaWebhookEntry {
  id?: string;
  time?: number;
  changes?: Array<{
    field?: string;
    value?: {
      leadgen_id?: string;
      page_id?: string;
      form_id?: string;
      created_time?: number;
      ad_id?: string;
      platform?: string;
    };
  }>;
}

export interface MetaWebhookPayload {
  object?: string;
  entry?: MetaWebhookEntry[];
}

export function parseMetaLeadgenChanges(payload: MetaWebhookPayload): MetaLeadgenWebhookChange[] {
  const results: MetaLeadgenWebhookChange[] = [];

  for (const entry of payload.entry ?? []) {
    const entryTime =
      typeof entry.time === 'number' ? new Date(entry.time * 1000).toISOString() : undefined;

    for (const change of entry.changes ?? []) {
      if (change.field !== 'leadgen') continue;

      const leadgenId = change.value?.leadgen_id?.trim();
      const pageId = change.value?.page_id?.trim();
      if (!leadgenId || !pageId) continue;

      const createdFromValue =
        typeof change.value?.created_time === 'number'
          ? new Date(change.value.created_time * 1000).toISOString()
          : undefined;

      results.push({
        leadgenId,
        pageId,
        formId: change.value?.form_id?.trim() || undefined,
        createdTime: createdFromValue ?? entryTime,
        rawChange: change,
      });
    }
  }

  return results;
}
