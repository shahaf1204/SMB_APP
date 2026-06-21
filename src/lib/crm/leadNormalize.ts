import type { Lead, LeadStatus } from '../../types/models';

const LEGACY_STATUS: Record<string, LeadStatus> = {
  quoted: 'proposal_sent',
  won: 'closed',
  lost: 'not_relevant',
};

export function normalizeLeadStatus(status: string | undefined): LeadStatus {
  if (!status) return 'new';
  if (status in LEGACY_STATUS) return LEGACY_STATUS[status]!;
  const allowed: LeadStatus[] = [
    'new',
    'in_progress',
    'contacted',
    'proposal_sent',
    'closed',
    'not_relevant',
  ];
  return allowed.includes(status as LeadStatus) ? (status as LeadStatus) : 'new';
}

export function normalizeLead(lead: Lead): Lead {
  return {
    ...lead,
    status: normalizeLeadStatus(lead.status),
    updatedAt: lead.updatedAt ?? lead.createdAt,
    statusHistory: lead.statusHistory ?? [],
    formAnswers: lead.formAnswers ?? [],
    notes: lead.notes ?? '',
    phone: lead.phone ?? '',
  };
}

export function normalizeLeads(leads: Lead[] | undefined): Lead[] {
  return (leads ?? []).map(normalizeLead);
}
