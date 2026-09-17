import type { Lead } from '../../../types/models';
import { participatesInIntakeWorkflow } from '../leadIntake';

export function hasLeadActivityLink(lead: Lead): boolean {
  return Boolean(
    lead.convertedToEventId ||
      lead.convertedToCardId ||
      lead.convertedToProjectId ||
      lead.convertedToClassId,
  );
}

export function isLeadConversionEligible(lead: Lead): boolean {
  if (!participatesInIntakeWorkflow(lead)) return false;
  if (lead.intakeStatus !== 'approved') return false;
  if (hasLeadActivityLink(lead)) return false;
  return true;
}

export function isLeadAlreadyConverted(lead: Lead): boolean {
  return lead.intakeStatus === 'converted' || hasLeadActivityLink(lead);
}
