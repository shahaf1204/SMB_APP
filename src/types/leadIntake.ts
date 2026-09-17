/** Lead intake lifecycle types — server-safe (no workspace/UI). */

export type LeadIntakeStatus =
  | 'new'
  | 'needs_information'
  | 'ready_for_review'
  | 'approved'
  | 'rejected'
  | 'converted';

export interface LeadIntakeStatusHistoryEntry {
  status: LeadIntakeStatus;
  at: string;
  note?: string;
}
