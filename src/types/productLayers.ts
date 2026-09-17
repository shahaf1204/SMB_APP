/**
 * Product layer & future entitlement contracts — documentation-oriented types only.
 *
 * NOT subscription billing, NOT runtime paywalls, NOT capability profile storage.
 * Authority: docs/design-system.md (Product Foundation), docs/business-architecture.md.
 */

// ---------------------------------------------------------------------------
// A. Core vs Automation (product packaging vocabulary)
// ---------------------------------------------------------------------------

/** Conceptual product value layer — not a subscription plan name. */
export type ProductValueLayer = 'core' | 'automation';

/**
 * Future account-level feature keys for entitlement checks.
 * Separate from {@link CapabilityKey} (business behavior / operating model).
 *
 * Examples only — plans, prices, and limits are not defined here.
 */
export type ProductFeatureEntitlementKey =
  | 'manual_activity_management'
  | 'dashboard'
  | 'manual_crm'
  | 'meta_lead_sync'
  | 'external_form_auto_intake'
  | 'invoice_provider_sync'
  | 'payment_provider_sync'
  | 'automatic_missing_information_followup'
  | 'customer_messaging';

/** Illustrative default layer for documentation — not enforced at runtime. */
export const PRODUCT_FEATURE_DEFAULT_LAYER: Record<
  ProductFeatureEntitlementKey,
  ProductValueLayer
> = {
  manual_activity_management: 'core',
  dashboard: 'core',
  manual_crm: 'core',
  meta_lead_sync: 'automation',
  external_form_auto_intake: 'automation',
  invoice_provider_sync: 'automation',
  payment_provider_sync: 'automation',
  automatic_missing_information_followup: 'automation',
  customer_messaging: 'automation',
};

// ---------------------------------------------------------------------------
// B. Future entitlement boundary (no persistence in this phase)
// ---------------------------------------------------------------------------

/**
 * Future subscription/entitlement snapshot for an account.
 * Lives outside Business.workspace and outside StoredBusinessCapabilityProfile.
 */
export interface AccountEntitlementContract {
  /** Opaque account or billing subject id — future */
  accountId: string;
  /** Plan identifier when billing exists — not pricing */
  planId?: string;
  /** Feature flags granted by subscription — independent of business configuration */
  entitledFeatures: Partial<Record<ProductFeatureEntitlementKey, boolean>>;
  evaluatedAt?: string;
}

/**
 * Two independent questions the product must eventually answer:
 * 1. relevanceConfigured — Is this feature relevant/configured for this business?
 * 2. entitled — Is this account allowed to use it (subscription)?
 */
export interface FeatureAccessEvaluationContract {
  feature: ProductFeatureEntitlementKey;
  /** From business type, models, capability profile, integration connections */
  relevanceConfigured: boolean;
  /** From AccountEntitlementContract — always true until billing exists */
  entitled: boolean;
}

// ---------------------------------------------------------------------------
// C. Lead intake lifecycle (target — Phase 3A.5+ must remain compatible)
// ---------------------------------------------------------------------------

/**
 * Target review-oriented lead states (names may refine in 3A.5).
 * NOT the current sales-oriented {@link LeadStatus} in models.ts.
 *
 * A lead is an intake object requiring review — never equivalent to an Activity.
 */
export type LeadIntakeLifecycleState =
  | 'new'
  | 'needs_information'
  | 'ready_for_review'
  | 'approved'
  | 'rejected'
  | 'converted';

/** Describes missing fields before owner review — derived from activity/business config in future. */
export interface LeadCompletenessRequirementContract {
  fieldKey: string;
  labelHe: string;
  requiredForReview: boolean;
}

export interface LeadCompletenessSnapshotContract {
  leadId: string;
  requirements: LeadCompletenessRequirementContract[];
  missingFieldKeys: string[];
  /** Customer-facing completion in progress */
  awaitingCustomerResponse?: boolean;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// D. Customer communication (target — not implemented)
// ---------------------------------------------------------------------------

/** Supported or planned outbound/inbound channels for lead information completion. */
export type CustomerCommunicationChannel =
  | 'secure_completion_link'
  | 'whatsapp'
  | 'sms'
  | 'email';

/**
 * Target flow (architecture only):
 * external source → normalized lead → completeness → request missing info
 * → customer responds → lead updated → ready_for_review → owner approves → convert to activity.
 */
export interface CustomerInformationRequestContract {
  leadId: string;
  channel: CustomerCommunicationChannel;
  missingFieldKeys: string[];
  /** Idempotency / audit — future */
  requestId?: string;
  status?: 'pending' | 'sent' | 'completed' | 'failed' | 'expired';
}
