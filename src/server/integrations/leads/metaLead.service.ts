import { getMetaGraphVersion, getSupabaseAdmin } from '../../core/supabase.server';

export interface MetaLeadField {
  name: string;
  values: string[];
}

export interface MetaLeadData {
  id: string;
  created_time?: string;
  field_data?: MetaLeadField[];
  ad_id?: string;
  ad_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
}

function pickField(fields: MetaLeadField[] | undefined, keys: string[]): string {
  if (!fields) return '';
  for (const key of keys) {
    const f = fields.find((x) => x.name.toLowerCase() === key.toLowerCase());
    const val = f?.values?.[0]?.trim();
    if (val) return val;
  }
  return '';
}

export function parseMetaLeadFields(fieldData: MetaLeadField[] | undefined): {
  fullName: string;
  phone: string;
  email: string;
  serviceInterest: string;
  formAnswers: Array<{ field: string; value: string }>;
} {
  const formAnswers = (fieldData ?? []).map((f) => ({
    field: f.name,
    value: f.values?.join(', ') ?? '',
  }));

  const fullName =
    pickField(fieldData, ['full_name', 'full name', 'name', 'שם', 'שם_מלא']) ||
    'ללא שם';
  const phone = pickField(fieldData, ['phone_number', 'phone', 'mobile', 'טלפון']);
  const email = pickField(fieldData, ['email', 'email_address', 'אימייל']);
  const serviceInterest = pickField(fieldData, [
    'service',
    'interest',
    'message',
    'שירות',
    'הערות',
  ]);

  return { fullName, phone, email, serviceInterest, formAnswers };
}

export async function fetchMetaLead(
  leadgenId: string,
  accessToken: string,
): Promise<MetaLeadData | null> {
  const version = getMetaGraphVersion();
  const url = `https://graph.facebook.com/${version}/${leadgenId}?access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Meta Graph API error', res.status, await res.text());
    return null;
  }
  return (await res.json()) as MetaLeadData;
}

export async function findMetaConnectionByPageId(pageId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('meta_connections')
    .select('*')
    .eq('page_id', pageId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) {
    console.error('meta_connections lookup failed', error);
    return null;
  }
  return data;
}

export interface CreateLeadFromExternalInput {
  businessId: string;
  userId: string;
  fullName: string;
  phone?: string;
  email?: string;
  source: string;
  serviceInterest?: string;
  notes?: string;
  externalProvider: string;
  externalLeadId?: string;
  externalFormId?: string;
  externalFormName?: string;
  externalPageId?: string;
  externalPageName?: string;
  externalCampaignId?: string;
  externalCampaignName?: string;
  externalAdId?: string;
  externalAdName?: string;
  formAnswers?: Array<{ field: string; value: string }>;
  rawPayload?: unknown;
}

export async function createLeadFromExternalSourceDb(
  input: CreateLeadFromExternalInput,
  options?: { primaryOperatingModel?: import('../../../types/operatingModel').OperatingModel },
): Promise<{ id: string; created: boolean }> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  if (input.externalLeadId) {
    const { data: existing } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('external_provider', input.externalProvider)
      .eq('external_lead_id', input.externalLeadId)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('crm_leads')
        .update({
          raw_payload: input.rawPayload ?? null,
          updated_at: now,
        })
        .eq('id', existing.id);
      return { id: existing.id, created: false };
    }
  }

  const { buildInitialIntakeDbFields } = await import('./leadIntakePersist.server');
  const intakeFields = buildInitialIntakeDbFields(
    {
      name: input.fullName,
      phone: input.phone,
      email: input.email,
      serviceInterest: input.serviceInterest,
      formAnswers: input.formAnswers,
      notes: input.notes ?? '',
    },
    options?.primaryOperatingModel,
  );

  const row = {
    user_id: input.userId,
    business_id: input.businessId,
    full_name: input.fullName,
    phone: input.phone ?? '',
    email: input.email ?? null,
    source: input.source,
    status: 'new',
    service_interest: input.serviceInterest ?? null,
    notes: input.notes ?? '',
    external_provider: input.externalProvider,
    external_lead_id: input.externalLeadId ?? null,
    external_form_id: input.externalFormId ?? null,
    external_form_name: input.externalFormName ?? null,
    external_page_id: input.externalPageId ?? null,
    external_page_name: input.externalPageName ?? null,
    external_campaign_id: input.externalCampaignId ?? null,
    external_campaign_name: input.externalCampaignName ?? null,
    external_ad_id: input.externalAdId ?? null,
    external_ad_name: input.externalAdName ?? null,
    form_answers: input.formAnswers ?? [],
    status_history: [{ status: 'new', at: now }],
    raw_payload: input.rawPayload ?? null,
    intake_status: intakeFields.intake_status,
    intake_status_history: intakeFields.intake_status_history,
    completeness_snapshot: intakeFields.completeness_snapshot,
    intake_updated_at: intakeFields.intake_updated_at,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from('crm_leads').insert(row).select('id').single();
  if (error) throw error;
  return { id: data.id as string, created: true };
}

/** @deprecated Use processMetaLeadgenChange via api/webhooks/meta/leadgen (3A.2+). */
export async function processMetaLeadgenWebhook(
  leadgenId: string,
  pageId: string,
  formId?: string,
): Promise<{ ok: boolean; reason?: string }> {
  const { processMetaLeadgenChange } = await import('./metaLead.processor');
  const result = await processMetaLeadgenChange(
    {
      leadgenId,
      pageId,
      formId,
      rawChange: { field: 'leadgen', value: { leadgen_id: leadgenId, page_id: pageId, form_id: formId } },
    },
    new Date().toISOString(),
  );
  if (result.kind === 'success' || result.kind === 'skipped') {
    return { ok: true };
  }
  return { ok: false, reason: result.reason };
}
