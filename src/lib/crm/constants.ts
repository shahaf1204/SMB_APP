import type { LeadSourceChannel, LeadStatus } from '../../types/models';

export type LeadFilter = 'all' | LeadStatus;

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'חדש',
  in_progress: 'בטיפול',
  contacted: 'בשיחה',
  proposal_sent: 'הצעת מחיר',
  closed: 'נסגר',
  not_relevant: 'לא רלוונטי',
};

export const LEAD_FILTER_OPTIONS: Array<{ id: LeadFilter; label: string }> = [
  { id: 'all', label: 'הכל' },
  { id: 'new', label: 'חדש' },
  { id: 'in_progress', label: 'בטיפול' },
  { id: 'proposal_sent', label: 'הצעת מחיר' },
  { id: 'closed', label: 'נסגר' },
  { id: 'not_relevant', label: 'לא רלוונטי' },
];

export const CRM_SOURCE_LABELS: Record<LeadSourceChannel, string> = {
  facebook: 'פייסבוק',
  instagram: 'אינסטגרם',
  website: 'אתר',
  whatsapp: 'וואטסאפ',
  tiktok: 'טיקטוק',
  google: 'גוגל',
  referral: 'המלצה',
  repeat: 'לקוח חוזר',
  other: 'אחר',
};

export const STAT_CARD_STATUSES = [
  'new',
  'in_progress',
  'proposal_sent',
  'closed',
] as const;

export type StatCardStatus = (typeof STAT_CARD_STATUSES)[number];

export const STAT_CARD_LABELS: Record<StatCardStatus, string> = {
  new: 'לידים חדשים',
  in_progress: 'בטיפול',
  proposal_sent: 'הצעת מחיר',
  closed: 'נסגרו',
};
export function countInProgress(leads: { status: LeadStatus }[]): number {
  return leads.filter((l) => l.status === 'in_progress' || l.status === 'contacted').length;
}

export function countByStatStatus(
  leads: { status: LeadStatus }[],
  stat: StatCardStatus,
): number {
  if (stat === 'in_progress') return countInProgress(leads);
  return leads.filter((l) => l.status === stat).length;
}
