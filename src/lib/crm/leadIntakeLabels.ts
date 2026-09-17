import type { LeadIntakeStatus } from '../../types/leadIntake';

export const LEAD_INTAKE_STATUS_LABELS: Record<LeadIntakeStatus, string> = {
  new: 'חדש',
  needs_information: 'חסרים פרטים',
  ready_for_review: 'מוכן לבדיקה',
  approved: 'אושר',
  rejected: 'נדחה',
  converted: 'הומר לפעילות',
};
