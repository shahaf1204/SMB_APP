import type { Lead } from '../../../types/models';
import { appendIntakeHistory } from '../leadIntake';
import { buildLeadConversionLinkPatch } from './leadConversionProvenance';
import type { LeadConversionTargetModel } from './types';

/** Pure lead state after successful conversion finalization (local store). */
export function buildFinalizedLeadAfterConversion(
  lead: Lead,
  target: LeadConversionTargetModel,
  activityId: string,
  now: string = new Date().toISOString(),
): Lead {
  const intakeStatus = 'converted' as const;
  const linkPatch = buildLeadConversionLinkPatch(target, activityId);
  return {
    ...lead,
    ...linkPatch,
    intakeStatus,
    intakeStatusHistory: appendIntakeHistory(lead, intakeStatus, 'lead_converted'),
    intakeUpdatedAt: now,
    updatedAt: now,
  };
}
