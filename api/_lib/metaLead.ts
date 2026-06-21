import { getMetaGraphVersion, getSupabaseAdmin } from './supabaseAdmin';

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

export type LeadSourceFromMeta = 'facebook' | 'instagram';

export function inferSourceFromMeta(_payload: unknown): LeadSourceFromMeta {
  return 'facebook';
}
