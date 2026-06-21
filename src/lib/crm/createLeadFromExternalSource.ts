import type {
  Lead,
  LeadExternalProvider,
  LeadFormAnswer,
  LeadSourceChannel,
  LeadStatus,
} from '../../types/models';

export interface ExternalLeadPayload {
  businessId: string;
  userId: string;
  fullName: string;
  phone?: string;
  email?: string;
  source: LeadSourceChannel;
  serviceInterest?: string;
  notes?: string;
  externalProvider: LeadExternalProvider;
  externalLeadId?: string;
  externalFormId?: string;
  externalFormName?: string;
  externalPageId?: string;
  externalPageName?: string;
  externalCampaignId?: string;
  externalCampaignName?: string;
  externalAdId?: string;
  externalAdName?: string;
  formAnswers?: LeadFormAnswer[];
  rawPayload?: unknown;
  createdAt?: string;
}

export interface CreateLeadResult {
  lead: Lead;
  created: boolean;
}

function buildLeadId(): string {
  return crypto.randomUUID();
}

export function createLeadFromExternalSource(
  payload: ExternalLeadPayload,
  existingLeads: Lead[],
): CreateLeadResult {
  const now = new Date().toISOString();

  if (payload.externalLeadId) {
    const dup = existingLeads.find(
      (l) =>
        l.externalProvider === payload.externalProvider &&
        l.externalLeadId === payload.externalLeadId,
    );
    if (dup) {
      const updated: Lead = {
        ...dup,
        updatedAt: now,
        rawPayload: payload.rawPayload as Lead['rawPayload'],
      };
      return { lead: updated, created: false };
    }
  }

  const lead: Lead = {
    id: buildLeadId(),
    businessId: payload.businessId,
    userId: payload.userId,
    name: payload.fullName.trim() || 'ללא שם',
    phone: payload.phone?.trim() || '',
    email: payload.email?.trim() || undefined,
    source: payload.source,
    notes: payload.notes?.trim() || '',
    status: 'new' as LeadStatus,
    serviceInterest: payload.serviceInterest,
    externalProvider: payload.externalProvider,
    externalLeadId: payload.externalLeadId,
    externalFormId: payload.externalFormId,
    externalFormName: payload.externalFormName,
    externalPageId: payload.externalPageId,
    externalPageName: payload.externalPageName,
    externalCampaignId: payload.externalCampaignId,
    externalCampaignName: payload.externalCampaignName,
    externalAdId: payload.externalAdId,
    externalAdName: payload.externalAdName,
    formAnswers: payload.formAnswers ?? [],
    statusHistory: [{ status: 'new', at: now }],
    createdAt: payload.createdAt ?? now,
    updatedAt: now,
  };

  return { lead, created: true };
}
