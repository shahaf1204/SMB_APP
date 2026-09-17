import type { Lead } from '../../types/models';
import type { LeadIntakeStatus } from '../../types/leadIntake';
import type { OperatingModel } from '../../types/operatingModel';
import {
  evaluateLeadCompleteness,
  intakeStatusFromCompleteness,
} from './leadCompleteness';

export const UNRESOLVED_INTAKE_STATUSES: readonly LeadIntakeStatus[] = [
  'new',
  'needs_information',
  'ready_for_review',
];

export const TERMINAL_INTAKE_STATUSES: readonly LeadIntakeStatus[] = [
  'approved',
  'rejected',
  'converted',
];

export function isExternalIntakeLead(lead: Lead): boolean {
  if (lead.externalProvider && lead.externalProvider !== 'manual') return true;
  return Boolean(lead.externalLeadId?.trim());
}

/** Legacy rows and manual leads — no intake alert surface. */
export function participatesInIntakeWorkflow(lead: Lead): boolean {
  if (!isExternalIntakeLead(lead)) return false;
  if (lead.intakeStatus == null) return false;
  return true;
}

export function isUnresolvedIntakeLead(lead: Lead): boolean {
  if (!participatesInIntakeWorkflow(lead)) return false;
  const s = lead.intakeStatus!;
  return UNRESOLVED_INTAKE_STATUSES.includes(s);
}

export function countUnresolvedIntakeLeads(leads: Lead[]): number {
  return leads.filter(isUnresolvedIntakeLead).length;
}

export function appendIntakeHistory(
  lead: Lead,
  status: LeadIntakeStatus,
  note?: string,
): Lead['intakeStatusHistory'] {
  const at = new Date().toISOString();
  return [...(lead.intakeStatusHistory ?? []), { status, at, note }];
}

export interface ApplyIntakeEvaluationResult {
  intakeStatus: LeadIntakeStatus;
  completenessSnapshot: Lead['completenessSnapshot'];
  intakeUpdatedAt: string;
}

/** Recompute completeness + intake status for active intake leads. */
export function applyIntakeEvaluation(
  lead: Lead,
  primaryOperatingModel?: OperatingModel,
): ApplyIntakeEvaluationResult {
  const snapshot = evaluateLeadCompleteness(lead, { primaryOperatingModel });
  const now = new Date().toISOString();

  let intakeStatus: LeadIntakeStatus;
  if (TERMINAL_INTAKE_STATUSES.includes(lead.intakeStatus ?? 'new')) {
    intakeStatus = lead.intakeStatus!;
  } else {
    intakeStatus = intakeStatusFromCompleteness(snapshot);
  }

  return {
    intakeStatus,
    completenessSnapshot: snapshot,
    intakeUpdatedAt: now,
  };
}

/** Initial intake for newly created external leads. */
export function initialIntakeForExternalLead(
  lead: Lead,
  primaryOperatingModel?: OperatingModel,
): ApplyIntakeEvaluationResult {
  const snapshot = evaluateLeadCompleteness(lead, { primaryOperatingModel });
  const now = new Date().toISOString();
  return {
    intakeStatus: intakeStatusFromCompleteness(snapshot),
    completenessSnapshot: snapshot,
    intakeUpdatedAt: now,
  };
}

export function shouldPushLeadToCloud(lead: Lead): boolean {
  return Boolean(lead.externalLeadId && lead.externalProvider);
}
