/**
 * Product architecture contracts (Phase 0 + Phase 2A runtime foundation).
 *
 * Phase 0: vocabulary and layer boundaries.
 * Phase 2A: capability registry, recommendations, and optional StoredBusinessCapabilityProfile
 * on BusinessWorkspaceConfig — see docs/business-architecture.md and src/lib/capabilities/.
 *
 * Product/UX authority: docs/design-system.md (Product Foundation).
 * Operating-model behavior: docs/operating-models.md.
 */

import type { OperatingModel } from './workspace';

// ---------------------------------------------------------------------------
// A. Business lifecycle
// ---------------------------------------------------------------------------

/** Whether the owner is starting fresh or bringing an active business into the app. */
export type BusinessLifecycle = 'new_business' | 'existing_business';

// ---------------------------------------------------------------------------
// B. Business capabilities
// ---------------------------------------------------------------------------

/**
 * Typed capability vocabulary — business BEHAVIOR, not form fields.
 * Namespaced by operating model. Used to gate dashboard intelligence later.
 */
export type EventCapabilityKey =
  | 'event.time'
  | 'event.location'
  | 'event.payments'
  | 'event.confirmation'
  | 'event.preparation_checklist'
  | 'event.suppliers'
  | 'event.participants';

export type AppointmentCapabilityKey =
  | 'appointment.service_catalog'
  | 'appointment.working_hours'
  | 'appointment.default_duration'
  | 'appointment.default_price'
  | 'appointment.confirmation'
  | 'appointment.reminders'
  | 'appointment.buffers'
  | 'appointment.cancellation'
  | 'appointment.waiting_list';

export type PackageCapabilityKey =
  | 'package.session_limit'
  | 'package.expiration'
  | 'package.renewal'
  | 'package.payment_structure'
  | 'package.rollover';

export type JourneyCapabilityKey =
  | 'journey.cadence'
  | 'journey.stages'
  | 'journey.goals'
  | 'journey.planned_end'
  | 'journey.payment_structure';

export type ProjectCapabilityKey =
  | 'project.deadline'
  | 'project.milestones'
  | 'project.payment_milestones'
  | 'project.waiting_on'
  | 'project.deliverables';

export type RecurringCapabilityKey =
  | 'recurring.capacity'
  | 'recurring.attendance'
  | 'recurring.waiting_list'
  | 'recurring.instructor'
  | 'recurring.occurrence_exceptions'
  | 'recurring.payment_subscription';

/** Union of all capability keys across concrete operating models. */
export type CapabilityKey =
  | EventCapabilityKey
  | AppointmentCapabilityKey
  | PackageCapabilityKey
  | JourneyCapabilityKey
  | ProjectCapabilityKey
  | RecurringCapabilityKey;

/** Concrete operating models that own capability vocabularies (hybrid excluded). */
export type CapabilityOperatingModel = Exclude<OperatingModel, 'hybrid'>;

/**
 * Product readiness — prevents implying a capability works when it does not.
 * Used by configuration layer only; not a developer UI.
 *
 * - available: meaningfully usable now
 * - partial: meaningful subset usable now; honest user-facing promise
 * - planned: architecture only — never user-recommended or newly enabled
 */
export type CapabilityReadiness = 'available' | 'partial' | 'planned';

/** Whether a capability is actively enabled for the business. */
export type CapabilityActivation = 'disabled' | 'enabled';

/** Setup completeness — independent from activation. */
export type CapabilityConfigurationStatus =
  | 'not_required'
  | 'incomplete'
  | 'configured';

/**
 * Whether business-level setup is needed before a capability is meaningfully usable.
 * Independent from readiness (planned + required is valid architecturally).
 */
export type CapabilityConfigurationRequirement = 'none' | 'optional' | 'required';

/**
 * @deprecated Phase 2A v1 shape — normalized to v2 on read.
 * `configured` conflated activation with completeness; split in v2.
 */
export type LegacyCapabilityActivation = 'disabled' | 'enabled' | 'configured';

/** Registry metadata for one capability (Phase 2A). */
export interface CapabilityRegistryEntry {
  key: CapabilityKey;
  operatingModel: CapabilityOperatingModel;
  labelHe: string;
  descriptionHe: string;
  /** Safe to include in generic model baselines (available/partial only) */
  safeToRecommendByDefault: boolean;
  readiness: CapabilityReadiness;
  /** Whether business-level setup is required before meaningful use */
  configurationRequirement: CapabilityConfigurationRequirement;
}

/**
 * v1 activation map — normalized to v2 on read. Do not write in new code.
 * @deprecated
 */
export type BusinessCapabilityActivationMap = Partial<
  Record<CapabilityKey, LegacyCapabilityActivation>
>;

/**
 * Minimal persisted capability profile (Phase 2A.1).
 * Lightweight activation + configuration status only — not capability payload storage.
 */
export interface StoredBusinessCapabilityProfile {
  version: 2;
  /** Absent keys are disabled */
  activation: Partial<Record<CapabilityKey, CapabilityActivation>>;
  /** Absent when disabled; when enabled defaults to incomplete unless not_required */
  configurationStatus: Partial<
    Record<CapabilityKey, CapabilityConfigurationStatus>
  >;
  updatedAt?: string;
}

/** @deprecated Alias — use activation map in StoredBusinessCapabilityProfile */
export type BusinessCapabilityProfile = BusinessCapabilityActivationMap;

/** Reference map: which capabilities belong to which operating model. */
export const CAPABILITY_KEYS_BY_OPERATING_MODEL: Record<
  CapabilityOperatingModel,
  readonly CapabilityKey[]
> = {
  event: [
    'event.time',
    'event.location',
    'event.payments',
    'event.confirmation',
    'event.preparation_checklist',
    'event.suppliers',
    'event.participants',
  ],
  appointment: [
    'appointment.service_catalog',
    'appointment.working_hours',
    'appointment.default_duration',
    'appointment.default_price',
    'appointment.confirmation',
    'appointment.reminders',
    'appointment.buffers',
    'appointment.cancellation',
    'appointment.waiting_list',
  ],
  package: [
    'package.session_limit',
    'package.expiration',
    'package.renewal',
    'package.payment_structure',
    'package.rollover',
  ],
  journey: [
    'journey.cadence',
    'journey.stages',
    'journey.goals',
    'journey.planned_end',
    'journey.payment_structure',
  ],
  project: [
    'project.deadline',
    'project.milestones',
    'project.payment_milestones',
    'project.waiting_on',
    'project.deliverables',
  ],
  recurring: [
    'recurring.capacity',
    'recurring.attendance',
    'recurring.waiting_list',
    'recurring.instructor',
    'recurring.occurrence_exceptions',
    'recurring.payment_subscription',
  ],
};

// ---------------------------------------------------------------------------
// C. Business defaults / templates
// ---------------------------------------------------------------------------

/** Reusable service definition for appointment-style businesses (contract only). */
export interface AppointmentServiceTemplate {
  id: string;
  name: string;
  defaultDurationMinutes?: number;
  defaultPrice?: number;
}

/** Reusable package product template (contract only). */
export interface PackageProductTemplate {
  id: string;
  name: string;
  sessionLimit?: number;
  defaultPrice?: number;
  defaultExpirationDays?: number;
}

/** Reusable project milestone template row (contract only). */
export interface ProjectMilestoneTemplate {
  id: string;
  name: string;
  sortOrder: number;
  defaultAmount?: number;
}

/** Reusable recurring series defaults (contract only). */
export interface RecurringSeriesTemplate {
  id: string;
  name: string;
  defaultCapacity?: number;
  defaultDurationMinutes?: number;
}

/** Event-level default presets (contract only). */
export interface EventDefaultsTemplate {
  id: string;
  name: string;
  defaultDurationMinutes?: number;
  defaultLocation?: string;
}

/**
 * Business-level defaults bundle — NOT form fields.
 * Future persistence: separate from Category[] and Business.workspace inline JSON.
 */
export interface BusinessDefaultsProfile {
  appointmentServices?: AppointmentServiceTemplate[];
  packageProducts?: PackageProductTemplate[];
  projectMilestoneSets?: ProjectMilestoneTemplate[];
  recurringSeries?: RecurringSeriesTemplate[];
  eventDefaults?: EventDefaultsTemplate[];
}

// ---------------------------------------------------------------------------
// D. Data provenance
// ---------------------------------------------------------------------------

/** Origin of a piece of business data. */
export type DataProvenanceSource =
  | 'app_created'
  | 'manual'
  | 'csv_import'
  | 'integration'
  | 'historical_summary';

/** Review/verification state for imported or automated data. */
export type DataVerificationStatus = 'unverified' | 'verified' | 'review_required';

/**
 * Minimal provenance metadata — attachable to facts/entities in future phases.
 * Not retrofitted onto Event/EventValue in Phase 0.
 */
export interface DataProvenance {
  source: DataProvenanceSource;
  importedAt?: string;
  sourceRecordId?: string;
  verificationStatus?: DataVerificationStatus;
}

// ---------------------------------------------------------------------------
// E. Attention contract
// ---------------------------------------------------------------------------

/**
 * Semantic class — distinct from Business Coach insights.
 * - action_required: missing data, failure, or decision needed
 * - awareness: successful automation or meaningful event worth seeing
 */
export type AttentionKind = 'action_required' | 'awareness';

/** Lifecycle for future AttentionItem persistence. */
export type AttentionLifecycle = 'new' | 'seen' | 'resolved';

/**
 * Future attention row contract — NOT FormActivityNotification.
 * Do not persist or migrate in Phase 0.
 */
export interface AttentionItemContract {
  id: string;
  kind: AttentionKind;
  lifecycle: AttentionLifecycle;
  title: string;
  message?: string;
  createdAt: string;
  /** Entity the attention relates to, when applicable */
  entityType?: 'event' | 'engagement' | 'lead' | 'invoice' | 'import' | 'automation';
  entityId?: string;
  provenance?: DataProvenance;
}

// ---------------------------------------------------------------------------
// F. Finance semantics
// ---------------------------------------------------------------------------

/**
 * Financial meaning kinds for a future FinancialFact layer.
 * Profit is derived (revenue − expense) — not a stored fact kind.
 */
export type FinancialSemanticKind = 'received' | 'expected' | 'revenue' | 'expense';

/**
 * Conceptual sources that may produce financial facts in a future phase.
 * Does NOT replace EventValue or calculateUnifiedTotals() today.
 */
export type FinancialFactSourceKind =
  | 'invoice'
  | 'payment'
  | 'payment_milestone'
  | 'manual_transaction'
  | 'imported_transaction'
  | 'historical_summary'
  | 'activity_category';

/** Read-only contract describing a future ledger row — not implemented in Phase 0. */
export interface FinancialFactContract {
  id: string;
  kind: FinancialSemanticKind;
  amount: number;
  currency?: string;
  /** ISO date or period key (YYYY-MM) the fact applies to */
  effectiveDate: string;
  sourceKind: FinancialFactSourceKind;
  provenance?: DataProvenance;
  /** Links to operational entities — Event, Engagement, Invoice, etc. */
  linkedEntityType?: string;
  linkedEntityId?: string;
}

/**
 * Period-level aggregate separate from transactional detail (future phase).
 * Prevents double-counting when combined with imported transactions.
 */
export interface HistoricalSummaryContract {
  id: string;
  periodStart: string;
  periodEnd: string;
  revenueTotal?: number;
  expenseTotal?: number;
  provenance: DataProvenance;
  /** Coverage semantics for reconciliation with transactional imports */
  coverageLabel?: string;
}

// ---------------------------------------------------------------------------
// G. Data confidence
// ---------------------------------------------------------------------------

/**
 * What the product is allowed to do with available data.
 * Not equivalent — e.g. CAN_CALCULATE without CAN_INTERPRET.
 */
export type DataConfidenceLevel = 'can_calculate' | 'can_compare' | 'can_interpret';

/** Per-metric or per-insight confidence (computed in future phases). */
export interface DataConfidenceContract {
  /** Enough data to show a factual value (e.g. "5 appointments") */
  calculate: boolean;
  /** Enough comparable history (e.g. trend, MoM) */
  compare: boolean;
  /** Enough reliable data for Coach interpretation */
  interpret: boolean;
}

/** Convenience: map level to contract flags. Pure helper for future use. */
export function dataConfidenceForLevel(
  level: DataConfidenceLevel,
): Pick<DataConfidenceContract, 'calculate' | 'compare' | 'interpret'> {
  switch (level) {
    case 'can_calculate':
      return { calculate: true, compare: false, interpret: false };
    case 'can_compare':
      return { calculate: true, compare: true, interpret: false };
    case 'can_interpret':
      return { calculate: true, compare: true, interpret: true };
  }
}

// ---------------------------------------------------------------------------
// Conceptual layer relationships (types only — not persistence)
// ---------------------------------------------------------------------------

/**
 * Describes how configuration layers relate without collapsing them.
 * Fields remain Category[] + activity form schema today.
 */
export interface BusinessConfigurationContract {
  businessType?: string;
  lifecycle?: BusinessLifecycle;
  primaryOperatingModel: OperatingModel;
  /** Supporting models — excludes primary; hybrid legacy handled via workspace */
  additionalOperatingModels: OperatingModel[];
  /** Future refs — not stored in Phase 0 */
  capabilities?: BusinessCapabilityProfile;
  defaults?: BusinessDefaultsProfile;
}

/**
 * Available data + confidence — drives what dashboard/coach may show.
 * Computed at runtime in future phases; contract only here.
 */
export interface AvailableDataContextContract {
  /** Which capabilities are configured enough to use */
  capabilities: BusinessCapabilityProfile;
  /** Which financial/operational records exist (counts, flags — future) */
  hasOperationalRecords: boolean;
  hasFinancialRecords: boolean;
  confidence: DataConfidenceContract;
}
