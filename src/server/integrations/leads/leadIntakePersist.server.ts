import type { LeadCompletenessSnapshot } from '../../../types/leadCompleteness.js';
import type { LeadIntakeStatus, LeadIntakeStatusHistoryEntry } from '../../../types/leadIntake.js';
import type { OperatingModel } from '../../../types/operatingModel.js';
import {
  evaluateLeadCompleteness,
  intakeStatusFromCompleteness,
  type LeadCompletenessInput,
} from '../../../lib/crm/leadCompleteness.js';

export function buildInitialIntakeDbFields(
  leadLike: LeadCompletenessInput,
  primaryOperatingModel?: OperatingModel,
): {
  intake_status: LeadIntakeStatus;
  completeness_snapshot: LeadCompletenessSnapshot;
  intake_status_history: LeadIntakeStatusHistoryEntry[];
  intake_updated_at: string;
} {
  const snapshot = evaluateLeadCompleteness(leadLike, { primaryOperatingModel });
  const now = new Date().toISOString();
  const intake_status = intakeStatusFromCompleteness(snapshot);
  return {
    intake_status,
    completeness_snapshot: snapshot,
    intake_status_history: [{ status: intake_status, at: now, note: 'lead_received' }],
    intake_updated_at: now,
  };
}
