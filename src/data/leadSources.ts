export type LeadSourceChannel =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'google'
  | 'whatsapp'
  | 'referral'
  | 'repeat'
  | 'other';

export const LEAD_SOURCE_OPTIONS: Array<{ id: LeadSourceChannel; label: string }> = [
  { id: 'facebook', label: 'פייסבוק' },
  { id: 'instagram', label: 'אינסטגרם' },
  { id: 'tiktok', label: 'טיקטוק' },
  { id: 'google', label: 'גוגל / חיפוש' },
  { id: 'whatsapp', label: 'וואטסאפ' },
  { id: 'referral', label: 'המלצה' },
  { id: 'repeat', label: 'לקוח חוזר' },
  { id: 'other', label: 'אחר' },
];

export const CUSTOMER_SOURCE_CATEGORY_NAME = 'מקור הגעה';

export function leadSourceLabel(id: string): string {
  return LEAD_SOURCE_OPTIONS.find((o) => o.id === id)?.label ?? id;
}
