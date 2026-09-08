import type { CapabilityKey } from '../types/businessArchitecture';
import type { OperatingModel } from '../types/workspace';
import type { RecommendableOperatingModel } from './businessTypeRecommendationConfig';

/** Generic capability baseline when no business-type override exists for the primary model. */
export const PRIMARY_MODEL_CAPABILITY_BASELINE: Record<
  RecommendableOperatingModel,
  readonly CapabilityKey[]
> = {
  appointment: [
    'appointment.default_duration',
    'appointment.default_price',
    'appointment.confirmation',
    'appointment.reminders',
    'appointment.cancellation',
  ],
  event: [
    'event.time',
    'event.location',
    'event.confirmation',
    'event.payments',
    'event.participants',
  ],
  package: [
    'package.session_limit',
    'package.expiration',
    'package.payment_structure',
  ],
  journey: [
    'journey.stages',
    'journey.planned_end',
    'journey.payment_structure',
    'journey.cadence',
  ],
  project: [
    'project.deadline',
    'project.milestones',
    'project.payment_milestones',
  ],
  recurring: [
    'recurring.capacity',
    'recurring.payment_subscription',
    'recurring.occurrence_exceptions',
  ],
};

/**
 * Business-type-specific capability emphasis for a given primary model.
 * Replaces the generic primary baseline when an entry exists.
 */
export const BUSINESS_TYPE_PRIMARY_CAPABILITY_RECOMMENDATIONS: Record<
  string,
  Partial<Record<RecommendableOperatingModel, readonly CapabilityKey[]>>
> = {
  beauty: {
    appointment: [
      'appointment.service_catalog',
      'appointment.default_duration',
      'appointment.default_price',
      'appointment.working_hours',
      'appointment.confirmation',
      'appointment.reminders',
    ],
    package: [
      'package.session_limit',
      'package.expiration',
      'package.payment_structure',
    ],
  },
  tutor: {
    appointment: [
      'appointment.default_duration',
      'appointment.default_price',
      'appointment.service_catalog',
      'appointment.confirmation',
    ],
    package: [
      'package.session_limit',
      'package.expiration',
      'package.payment_structure',
    ],
  },
  photographer: {
    event: [
      'event.time',
      'event.location',
      'event.confirmation',
      'event.payments',
      'event.participants',
      'event.preparation_checklist',
    ],
    project: [
      'project.deadline',
      'project.milestones',
      'project.payment_milestones',
      'project.deliverables',
    ],
  },
  therapist: {
    journey: [
      'journey.cadence',
      'journey.stages',
      'journey.planned_end',
      'journey.payment_structure',
      'journey.goals',
    ],
    appointment: [
      'appointment.default_duration',
      'appointment.confirmation',
      'appointment.reminders',
    ],
  },
  coach: {
    journey: [
      'journey.cadence',
      'journey.stages',
      'journey.goals',
      'journey.planned_end',
      'journey.payment_structure',
    ],
    appointment: [
      'appointment.default_duration',
      'appointment.default_price',
      'appointment.confirmation',
      'appointment.service_catalog',
    ],
    package: [
      'package.session_limit',
      'package.expiration',
      'package.payment_structure',
    ],
  },
  consultant: {
    journey: [
      'journey.stages',
      'journey.planned_end',
      'journey.payment_structure',
    ],
    project: [
      'project.deadline',
      'project.milestones',
      'project.payment_milestones',
      'project.waiting_on',
    ],
    appointment: [
      'appointment.default_duration',
      'appointment.confirmation',
    ],
  },
  studio: {
    recurring: [
      'recurring.capacity',
      'recurring.attendance',
      'recurring.payment_subscription',
      'recurring.instructor',
    ],
    appointment: [
      'appointment.default_duration',
      'appointment.default_price',
      'appointment.confirmation',
    ],
  },
  design: {
    event: [
      'event.time',
      'event.location',
      'event.confirmation',
      'event.payments',
      'event.preparation_checklist',
    ],
    project: [
      'project.deadline',
      'project.milestones',
      'project.payment_milestones',
      'project.deliverables',
    ],
  },
  freelance: {
    project: [
      'project.deadline',
      'project.milestones',
      'project.payment_milestones',
      'project.deliverables',
      'project.waiting_on',
    ],
    appointment: [
      'appointment.default_duration',
      'appointment.default_price',
      'appointment.confirmation',
    ],
  },
  birthday: {
    event: [
      'event.time',
      'event.location',
      'event.confirmation',
      'event.participants',
      'event.preparation_checklist',
    ],
  },
  confectioner: {
    event: [
      'event.time',
      'event.location',
      'event.confirmation',
      'event.payments',
      'event.preparation_checklist',
    ],
  },
  balloons: {
    event: [
      'event.time',
      'event.location',
      'event.confirmation',
      'event.participants',
      'event.suppliers',
    ],
  },
};

/**
 * Capabilities added when an operating model is enabled as additional (not primary).
 * Primary emphasis stays with the primary model; additional models extend the set.
 */
export const ADDITIONAL_MODEL_CAPABILITY_EXTENSIONS: Record<
  RecommendableOperatingModel,
  readonly CapabilityKey[]
> = {
  package: [
    'package.session_limit',
    'package.expiration',
    'package.payment_structure',
  ],
  appointment: [
    'appointment.default_duration',
    'appointment.default_price',
    'appointment.confirmation',
  ],
  project: [
    'project.deadline',
    'project.milestones',
    'project.payment_milestones',
  ],
  event: [
    'event.time',
    'event.location',
    'event.confirmation',
    'event.payments',
  ],
  journey: [
    'journey.stages',
    'journey.planned_end',
    'journey.cadence',
  ],
  recurring: [
    'recurring.capacity',
    'recurring.payment_subscription',
  ],
};

export function isRecommendableOperatingModel(
  model: OperatingModel,
): model is RecommendableOperatingModel {
  return model !== 'hybrid';
}

export function resolvePrimaryCapabilityBaseline(
  primary: RecommendableOperatingModel,
  businessType?: string,
): readonly CapabilityKey[] {
  const typeKey = businessType?.trim();
  if (typeKey) {
    const typeOverrides = BUSINESS_TYPE_PRIMARY_CAPABILITY_RECOMMENDATIONS[typeKey];
    const override = typeOverrides?.[primary];
    if (override && override.length > 0) {
      return override;
    }
  }
  return PRIMARY_MODEL_CAPABILITY_BASELINE[primary];
}
