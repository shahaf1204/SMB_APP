import type { Lead } from '../../../types/models';
import type { Business } from '../../../types/models';
import type { OperatingModel } from '../../../types/operatingModel';
import { getEnabledCreationModels } from '../../workspace/creationModels';
import type {
  LeadConversionConfidence,
  LeadConversionTargetModel,
  LeadConversionTargetResolution,
} from './types';

const PACKAGE_SIGNAL =
  /חביל|כרטיס|מנוי|package|מספר מפגש|מספר שיעור|session pack/i;
const PROJECT_SIGNAL = /פרויקט|project|ליווי|journey|תהליך/i;
const RECURRING_SIGNAL = /חוג|recurring|קבוע|weekly|מנוי חודש/i;

function enabledTargets(business: Business | null | undefined): LeadConversionTargetModel[] {
  return getEnabledCreationModels(business).map((m) => m.id) as LeadConversionTargetModel[];
}

function inferSignals(lead: Lead): {
  package: boolean;
  project: boolean;
  recurring: boolean;
} {
  const blob = [
    lead.serviceInterest ?? '',
    lead.notes ?? '',
    ...(lead.formAnswers ?? []).map((a) => `${a.field} ${a.value}`),
  ].join(' ');
  return {
    package: PACKAGE_SIGNAL.test(blob),
    project: PROJECT_SIGNAL.test(blob),
    recurring: RECURRING_SIGNAL.test(blob),
  };
}

function scoreTarget(
  target: LeadConversionTargetModel,
  primary: OperatingModel,
  signals: ReturnType<typeof inferSignals>,
): number {
  let score = target === primary ? 3 : 0;
  if (target === 'package' && signals.package) score += 4;
  if ((target === 'project' || target === 'journey') && signals.project) score += 4;
  if (target === 'recurring' && signals.recurring) score += 4;
  if ((target === 'event' || target === 'appointment') && !signals.package && !signals.project) {
    score += 2;
  }
  if (target === 'package' && !signals.package) score -= 3;
  return score;
}

export function resolveLeadConversionTarget(
  lead: Lead,
  business: Business | null | undefined,
): LeadConversionTargetResolution {
  const availableTargets = enabledTargets(business);
  const primary = business?.workspace?.primaryOperatingModel ?? 'event';
  const primaryConcrete: LeadConversionTargetModel =
    primary === 'hybrid' ? (availableTargets[0] ?? 'event') : (primary as LeadConversionTargetModel);

  if (availableTargets.length === 0) {
    return {
      recommendedTarget: primaryConcrete,
      availableTargets: [primaryConcrete],
      confidence: 'low',
      requiresOwnerChoice: true,
      reasonCode: 'no_enabled_models',
    };
  }

  if (availableTargets.length === 1) {
    return {
      recommendedTarget: availableTargets[0]!,
      availableTargets,
      confidence: 'high',
      requiresOwnerChoice: false,
      reasonCode: 'single_enabled_model',
    };
  }

  const signals = inferSignals(lead);
  const scored = availableTargets
    .map((t) => ({ t, score: scoreTarget(t, primaryConcrete, signals) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0]!;
  const second = scored[1];
  const ambiguous =
    second != null &&
    best.score === second.score &&
    best.score <= 3;

  const eventProjectPair =
    availableTargets.includes('event') &&
    availableTargets.includes('project') &&
    !signals.project &&
    !signals.package;

  const requiresOwnerChoice =
    ambiguous ||
    eventProjectPair ||
    (availableTargets.includes('appointment') &&
      availableTargets.includes('package') &&
      !signals.package &&
      (best.t === 'package' || second?.t === 'package'));

  let confidence: LeadConversionConfidence = 'high';
  if (requiresOwnerChoice) confidence = 'low';
  else if (best.score < 5) confidence = 'medium';

  return {
    recommendedTarget: best.t,
    availableTargets,
    confidence,
    requiresOwnerChoice,
    reasonCode: requiresOwnerChoice ? 'ambiguous_targets' : 'scored_recommendation',
  };
}
