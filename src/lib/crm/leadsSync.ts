import type { Lead, LeadFormAnswer, LeadSourceChannel, LeadStatus } from '../../types/models';
import { createLeadFromExternalSource } from './createLeadFromExternalSource';
import { normalizeLeadStatus } from './leadNormalize';
import { getSupabase, isSupabaseConfigured } from '../supabase';

interface CrmLeadRow {
  id: string;
  user_id: string;
  business_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  source: string;
  status: string;
  service_interest: string | null;
  notes: string;
  external_provider: string;
  external_lead_id: string | null;
  external_form_id: string | null;
  external_form_name: string | null;
  external_page_id: string | null;
  external_page_name: string | null;
  external_campaign_id: string | null;
  external_campaign_name: string | null;
  external_ad_id: string | null;
  external_ad_name: string | null;
  form_answers: LeadFormAnswer[];
  status_history: Array<{ status: LeadStatus; at: string; note?: string }>;
  converted_to_event_id: string | null;
  converted_to_card_id: string | null;
  converted_to_project_id: string | null;
  converted_to_class_id: string | null;
  converted_to_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToLead(row: CrmLeadRow): Lead {
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    name: row.full_name,
    phone: row.phone,
    email: row.email ?? undefined,
    source: row.source as LeadSourceChannel,
    notes: row.notes,
    status: normalizeLeadStatus(row.status),
    serviceInterest: row.service_interest ?? undefined,
    externalProvider: row.external_provider as Lead['externalProvider'],
    externalLeadId: row.external_lead_id ?? undefined,
    externalFormId: row.external_form_id ?? undefined,
    externalFormName: row.external_form_name ?? undefined,
    externalPageId: row.external_page_id ?? undefined,
    externalPageName: row.external_page_name ?? undefined,
    externalCampaignId: row.external_campaign_id ?? undefined,
    externalCampaignName: row.external_campaign_name ?? undefined,
    externalAdId: row.external_ad_id ?? undefined,
    externalAdName: row.external_ad_name ?? undefined,
    formAnswers: row.form_answers ?? [],
    statusHistory: row.status_history ?? [],
    convertedToEventId: row.converted_to_event_id ?? undefined,
    convertedToCardId: row.converted_to_card_id ?? undefined,
    convertedToProjectId: row.converted_to_project_id ?? undefined,
    convertedToClassId: row.converted_to_class_id ?? undefined,
    convertedToCustomerId: row.converted_to_customer_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchCrmLeadsFromCloud(
  userId: string,
  businessId: string,
): Promise<Lead[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await getSupabase()
    .from('crm_leads')
    .select('*')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as CrmLeadRow[]).map(rowToLead);
}

export async function pushLeadStatusToCloud(
  leadId: string,
  status: LeadStatus,
  statusHistory: Lead['statusHistory'],
  patch: Partial<Lead>,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabase()
    .from('crm_leads')
    .update({
      status,
      status_history: statusHistory ?? [],
      notes: patch.notes,
      service_interest: patch.serviceInterest ?? null,
      converted_to_event_id: patch.convertedToEventId ?? null,
      converted_to_card_id: patch.convertedToCardId ?? null,
      converted_to_project_id: patch.convertedToProjectId ?? null,
      converted_to_class_id: patch.convertedToClassId ?? null,
      converted_to_customer_id: patch.convertedToCustomerId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);
}

/** ממזג לידים מהענן ל-store המקומי */
export function mergeCloudLeadsIntoStore(
  cloudLeads: Lead[],
  localLeads: Lead[],
  upsert: (lead: Lead, isNew: boolean) => void,
): void {
  for (const cloud of cloudLeads) {
    const local = localLeads.find(
      (l) =>
        (l.externalProvider && l.externalLeadId &&
          l.externalProvider === cloud.externalProvider &&
          l.externalLeadId === cloud.externalLeadId) ||
        l.id === cloud.id,
    );
    if (local) {
      upsert({ ...local, ...cloud, id: local.id }, false);
    } else {
      upsert(cloud, true);
    }
  }
}

export function importDemoMetaLead(
  businessId: string,
  userId: string,
  existing: Lead[],
): Lead | null {
  const { lead, created } = createLeadFromExternalSource(
    {
      businessId,
      userId,
      fullName: 'דנה לוי',
      phone: '050-1234567',
      email: 'dana@example.com',
      source: 'instagram',
      serviceInterest: 'צילום אירוע',
      externalProvider: 'meta',
      externalLeadId: `demo-${businessId}`,
      externalFormName: 'טופס לידים — קמפיין קיץ',
      externalCampaignName: 'קמפיין קיץ 2026',
      externalPageName: 'העמוד שלי',
      formAnswers: [
        { field: 'שם', value: 'דנה לוי' },
        { field: 'טלפון', value: '050-1234567' },
      ],
    },
    existing,
  );
  return created ? lead : null;
}
