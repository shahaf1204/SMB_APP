/** Lead completeness types — no workspace/UI imports (server-safe). */

export type LeadCompletenessRequirementPurpose =
  | 'review_blocking'
  | 'conversion_blocking'
  | 'recommended';

export interface LeadCompletenessSnapshot {
  requirements: Array<{
    fieldKey: string;
    labelHe: string;
    purpose: LeadCompletenessRequirementPurpose;
    requiredForReview: boolean;
  }>;
  presentFieldKeys: string[];
  missingFieldKeys: string[];
  missingReviewFieldKeys: string[];
  missingConversionFieldKeys: string[];
  readyForReview: boolean;
  evaluatedAt: string;
}
