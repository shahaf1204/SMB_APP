import type { LeadSourceChannel } from '../../../types/leadSourceChannel';
import type { MetaLeadData } from './metaLead.service';
import { parseMetaLeadFields } from './metaLead.service';
import type { MetaLeadgenWebhookChange } from './metaWebhook.parse';

export interface NormalizedMetaLead {
  externalProvider: 'meta';
  externalLeadId: string;
  fullName: string;
  phone: string;
  email?: string;
  source: LeadSourceChannel;
  serviceInterest?: string;
  formAnswers: Array<{ field: string; value: string }>;
  externalFormId?: string;
  externalFormName?: string;
  externalPageId: string;
  externalPageName?: string;
  externalCampaignId?: string;
  externalCampaignName?: string;
  externalAdId?: string;
  externalAdName?: string;
  receivedAt: string;
  rawPayload: unknown;
}

/**
 * Instagram only when Meta explicitly indicates it (Graph or webhook change).
 *
 * When Meta omits platform evidence, CRM `source` falls back to `facebook` for
 * LeadSourceChannel compatibility only — not verified provider attribution.
 * {@link NormalizedMetaLead.rawPayload} always retains Meta fields for audit/refinement.
 *
 * A future `meta` / `unknown` channel would require CRM UI label changes (out of 3A.2.1 scope).
 */
export function resolveMetaLeadSourceChannel(
  graphLead: MetaLeadData,
  webhookChange?: MetaLeadgenWebhookChange,
): LeadSourceChannel {
  const candidates: string[] = [];

  const graphPlatform = (graphLead as { platform?: string }).platform;
  if (typeof graphPlatform === 'string') candidates.push(graphPlatform);

  const changeValue = (webhookChange?.rawChange as { value?: { platform?: string } })?.value;
  if (typeof changeValue?.platform === 'string') {
    candidates.push(changeValue.platform);
  }

  for (const raw of candidates) {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'instagram' || normalized === 'ig') return 'instagram';
    if (normalized === 'facebook' || normalized === 'fb') return 'facebook';
  }

  return 'facebook';
}

export function normalizeMetaLeadFromGraph(
  graphLead: MetaLeadData,
  context: {
    leadgenId: string;
    pageId: string;
    pageName?: string;
    formIdFromWebhook?: string;
    webhookChange?: MetaLeadgenWebhookChange;
    receivedAt: string;
  },
): NormalizedMetaLead {
  const parsed = parseMetaLeadFields(graphLead.field_data);
  const source = resolveMetaLeadSourceChannel(graphLead, context.webhookChange);

  return {
    externalProvider: 'meta',
    externalLeadId: context.leadgenId,
    fullName: parsed.fullName,
    phone: parsed.phone,
    email: parsed.email || undefined,
    source,
    serviceInterest: parsed.serviceInterest || undefined,
    formAnswers: parsed.formAnswers,
    externalFormId: context.formIdFromWebhook ?? graphLead.form_id,
    externalPageId: context.pageId,
    externalPageName: context.pageName,
    externalCampaignId: graphLead.campaign_id,
    externalCampaignName: graphLead.campaign_name,
    externalAdId: graphLead.ad_id,
    externalAdName: graphLead.ad_name,
    receivedAt: graphLead.created_time ?? context.receivedAt,
    rawPayload: graphLead,
  };
}
