import type { OperatingModel } from '../../../types/operatingModel';

/** Operating model used as conversion target (hybrid resolved to concrete targets). */
export type LeadConversionTargetModel = Exclude<OperatingModel, 'hybrid'>;

export type LeadConversionConfidence = 'high' | 'medium' | 'low';

export interface LeadConversionTargetResolution {
  recommendedTarget: LeadConversionTargetModel;
  availableTargets: LeadConversionTargetModel[];
  confidence: LeadConversionConfidence;
  requiresOwnerChoice: boolean;
  /** Internal — not shown directly in UI when owner must choose */
  reasonCode?: string;
}

/** Owner-editable values for conversion — may extend Lead without overwriting source evidence. */
export interface LeadConversionDraft {
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  title: string;
  activityDate?: string;
  activityTime?: string;
  location?: string;
  notes?: string;
}

export interface LeadConversionResult {
  ok: boolean;
  alreadyConverted?: boolean;
  recoveredExistingActivity?: boolean;
  activityId?: string;
  activityHref?: string;
  errorMessage?: string;
}
