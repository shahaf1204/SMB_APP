import type { Lead } from '../../../types/models.js';
import { appendIntakeHistory } from '../leadIntake.js';
import { buildLeadConversionLinkPatch } from './leadConversionProvenance.js';
import type { LeadConversionTargetModel } from './types.js';

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
