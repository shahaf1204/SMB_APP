# Business Architecture

> **Phase 0 contracts** — TypeScript vocabulary for product concepts defined in the [Product Foundation](design-system.md#product-foundation) and the architecture audit.  
> **Phase 2A** adds the runtime capability registry, recommendation resolvers, and optional persisted capability profile — see [Phase 2A section](#phase-2a--runtime-capability-foundation-implemented) below. No configuration UI (Phase 2B) yet.

**Related docs:**

| Document | Role |
|----------|------|
| [design-system.md](design-system.md) | Product/UX authority (Product Foundation) |
| [operating-models.md](operating-models.md) | Operating-model-specific behavior |
| `src/types/productLayers.ts` | Future entitlement + lead-intake contracts (no runtime) |
| [activity-form-schema.md](activity-form-schema.md) | **Fields** layer (form presentation) |
| [business-coach.md](business-coach.md) | Coach rules (future **interpret** layer) |

**TypeScript source:** `src/types/businessArchitecture.ts`

---

## Core principle

> The operating model defines what the product **can understand**.  
> The business configuration defines what is **relevant**.  
> The available data defines what the product may **confidently show**.

These three must not be collapsed into one configuration object.

A fourth axis — **account entitlements** (future subscription) — must stay separate from business configuration and capabilities. See [Product layers & entitlements](#product-layers--entitlements-future-safe).

---

## Product layers & entitlements (future-safe)

Documented in [Product Foundation — Two value layers](design-system.md#two-value-layers-core-vs-automation).

| Layer | Question it answers |
|-------|---------------------|
| **Core business management** | Can the owner run the business manually inside the app? |
| **Automation & connected business** | Can external systems and automation reduce manual work? |

### Capability vs entitlement (must stay separate)

| Concept | Scope | Question | Current home |
|---------|--------|----------|--------------|
| **Capability** | Business behavior within operating models | Does *this business* use / need this behavior (e.g. event time, package expiration)? | `StoredBusinessCapabilityProfile`, registry — **not** billing |
| **Entitlement** | Account / subscription (future) | Is *this account* allowed to turn on a product feature (e.g. Meta sync, customer messaging)? | **Not implemented** — contract: `AccountEntitlementContract` in `productLayers.ts` |

**Do not** repurpose `capabilityProfile` as a paywall. **Do not** add pricing or plan fields to capability registry entries. **Do not** gate existing core behavior on a future plan in advance of billing.

Illustrative feature keys (packaging examples only): `manual_activity_management`, `dashboard`, `manual_crm` → core-eligible; `meta_lead_sync`, `external_form_auto_intake`, `invoice_provider_sync`, `payment_provider_sync`, `automatic_missing_information_followup`, `customer_messaging` → automation-eligible. Exact plans and limits TBD.

### Future entitlement stack (conceptual)

```
User / Business owner
        ↓
Account (billing subject — future)
        ↓
Subscription / plan (future — not implemented)
        ↓
Entitlements (ProductFeatureEntitlementKey)
        ↓
Product feature access (integrations, automation modules)

Parallel track (unchanged):

Business Type → Operating Models → Business configuration
        → Capabilities (behavior) + Fields + Defaults
        → “Is this feature relevant for this business?”
```

Runtime today: **entitlement checks always pass** for core; automation features remain optional by **configuration** (e.g. Meta connection), not by subscription.

---

## Conceptual layers

```
Business Type
    ↓ recommends
Primary Operating Model (+ optional Additional Operating Models)
    ↓ recommends
Business Configuration
    ├── Fields          (what data is stored on entities)
    ├── Capabilities    (what behavior / intelligence is enabled)
    └── Defaults        (reusable templates & business-level presets)
    ↓ constrained by
Available Data
    ↓ gated by
Data Confidence       (calculate · compare · interpret)
    ↓ feeds
Adaptive Dashboard · Attention · Business Coach · Finance snapshot
```

---

## Layer responsibilities

### 1. Operating Model

**What:** How work is structurally organized (Event, Appointment, Package, Journey, Project, Recurring).

**Existing types:** `OperatingModel`, `BusinessWorkspaceConfig.primaryOperatingModel`, `enabledOperatingModels` — `src/types/workspace.ts`, `src/config/operatingModelConfig.ts`.

**Primary vs additional:**

| Role | Responsibility |
|------|----------------|
| **Primary** | Dashboard emphasis, NOW experience, Activities organization, default terminology, default operational metrics |
| **Additional** | Supporting context, extra capabilities, secondary attention rules — **not** separate mini-dashboards |

**Hybrid (legacy):** Remains in types and migration for backward compatibility. Future product semantics are **Primary + Additional**, not equal “hybrid mode.” Do not remove hybrid in Phase 0.

---

### 2. Business Configuration

**What:** How *this* business chooses to operate within its model(s).

**Phase 0:** Described by `BusinessConfigurationContract` — not a new persistence blob.

**Lives today (partially):**

| Slice | Current home |
|-------|----------------|
| Workspace flags | `Business.workspace` (`BusinessWorkspaceConfig`) |
| Fields | `Category[]`, `resolveActivityFormSchema()` |
| Package thresholds | `BusinessWorkspaceConfig.packageSettings` |

**Does NOT belong in `Business.workspace` long-term:** Full capability payloads, service catalogs, template libraries, financial facts, attention queues. Those get **dedicated structures** with lightweight refs/flags on workspace when needed.

---

### 3. Fields

**What:** Data stored on an entity (client name, date, amount, custom categories).

**Existing:** `Category`, `CategoryTemplate`, `ActivityFormFieldPresentation`, `resolveActivityFormSchema()`.

**Does NOT belong here:** Working hours, renewal rules, occupancy logic — those are **capabilities** or **defaults**.

---

### 4. Capabilities

**What:** Business **behavior** that enables or gates product intelligence.

**Phase 0:** `CapabilityKey`, `BusinessCapabilityProfile`, `CAPABILITY_KEYS_BY_OPERATING_MODEL` — `src/types/businessArchitecture.ts`.

**Examples:**

| Capability | If absent |
|------------|-----------|
| `appointment.working_hours` | Must not infer schedule utilization |
| `package.expiration` | Must not show expiry alerts |
| `journey.cadence` | Must not claim continuity broken |
| `recurring.capacity` | Must not calculate occupancy |

**Does NOT belong here:** Form field definitions, KPI numbers, dashboard layout.

---

### 5. Defaults / templates

**What:** Reusable business-level structures (service catalog entries, package templates, milestone sets).

**Phase 0:** `BusinessDefaultsProfile` and template interfaces — contracts only, not persisted.

**Distinction:**

| Concept | Example |
|---------|---------|
| **Field** | “Duration” column on an appointment record |
| **Default** | “Haircut = 45 min, ₪180” preset applied to new appointments |
| **Capability** | “Service catalog feature is enabled” |

---

### 6. Available data

**What:** What the system actually knows (record counts, configured capabilities, import coverage).

**Phase 0:** `AvailableDataContextContract` — computed in future phases.

**Does NOT belong here:** UI section order (dashboard composer) or product copy.

---

### 7. Data provenance

**What:** Where data came from and whether it was verified.

**Phase 0:** `DataProvenance`, `DataProvenanceSource` — not retrofitted onto `Event` / `EventValue` yet.

**Existing partial provenance:** `Event.source`, external form IDs, `Lead.rawPayload`.

**Future use:** Reconciliation, Coach confidence, import audit, avoiding double count.

---

### 8. Attention

**What:** Items requiring owner awareness — distinct from notifications noise and Coach insights.

**Phase 0:** `AttentionKind` (`action_required` | `awareness`), `AttentionLifecycle`, `AttentionItemContract`.

**Existing (not migrated yet):** `FormActivityNotification` — integration-specific; future Attention layer will generalize.

| Kind | Example |
|------|---------|
| **awareness** | “New event created automatically from form” |
| **action_required** | “Event created — location missing” |

---

### 9. Finance semantics

**What:** Shared vocabulary for a future **FinancialFact** truth layer.

**Phase 0:** `FinancialSemanticKind` (`received` | `expected` | `revenue` | `expense`), `FinancialFactContract`, `HistoricalSummaryContract`.

**Profit:** Derived (`revenue − expense`), not a stored fact kind.

**Unchanged in Phase 0:** `EventValue.revenueValue` / `expenseValue`, `calculateUnifiedTotals()`, dashboard KPIs.

**Boundary:**

| Layer | Describes |
|-------|-----------|
| **Activities** (Event, Engagement, …) | Operational reality |
| **Future finance layer** | Financial reality (received, expected, coverage, reconciliation) |

---

### 10. Data confidence

**What:** Whether the product may calculate, compare, or interpret.

**Phase 0:** `DataConfidenceLevel`, `DataConfidenceContract`.

| Level | Allows |
|-------|--------|
| **can_calculate** | Factual count/value (“5 appointments”) |
| **can_compare** | Trends, period-over-period |
| **can_interpret** | Business Coach insights |

Not equivalent — five appointments allow calculate, not necessarily interpret (“demand is declining”).

---

## Relationship to `BusinessWorkspaceConfig`

`Business.workspace` remains the **lightweight workspace entry point**:

- Primary + enabled operating models  
- Onboarding completion  
- Terminology  
- Model-specific **settings refs** (e.g. `packageSettings`)  

Future phases may add **optional refs** (e.g. `configurationVersion`, capability profile id) — not inline megabytes of config.

---

## Persistence strategy (short term)

| Entity | Role | Phase 0 change |
|--------|------|----------------|
| **Event + EventValue + Category** | Event / appointment operational data | None |
| **Engagement + Milestone + Session** | Package / project / recurring | None |
| **Journey** | UI model; persisted as `Engagement` (`kind: project`) until discriminators added | None |
| **Appointment** | UI model; persisted as **Event** until discriminators added | None |

**No entity unification in Phase 0.**

---

## Future layer boundaries (not implemented)

### Finance (`FinancialFact`)

- Single place for received / expected / revenue / expense with provenance and coverage  
- Reconciles **HistoricalSummary** vs transactional imports  
- Activities continue to describe operations; facts describe money  

### Attention (`AttentionItem`)

- Unified queue: automation success, failures, missing fields, operational flags  
- Shell control / inbox pattern before dedicated nav  

### Import pipeline

- Source → Mapping → Validation → Deduplication → Review → Commit → Reconciliation  
- Extends beyond current `historicalImport.ts` (CSV append-only)  

### Dashboard composition

- **After** capabilities, finance semantics, attention, and confidence exist  
- Sections (NOW, ATTENTION, SNAPSHOT, MODEL HEALTH, COACH, TRENDS) earn prominence from model + state + confidence — not fixed stacks  

---

## Phase 0 scope checklist

| In scope | Out of scope |
|----------|--------------|
| TypeScript contracts in `businessArchitecture.ts` | Onboarding / dashboard UI |
| This document | Persist v14, Supabase schema |
| | FinancialFact records, capability storage |
| | Hybrid removal, Event/Engagement merge |
| | Retrofit provenance on all entities |

---

*Last updated: Phase 2A.2 — configuration requirement metadata.*

---

## Phase 2A — Runtime capability foundation (implemented)

Phase 2A adds a **read-only configuration layer**. No configuration UI (Phase 2B), no dashboard/finance/attention changes, no automatic activation of recommended capabilities.

### Three concepts (must stay separate)

| Concept | Meaning | Phase 2A home |
|---------|---------|----------------|
| **Capabilities** | What behaviors/features this business uses | `StoredBusinessCapabilityProfile` (optional) |
| **Defaults / templates** | Reusable business-level presets (e.g. “60-min facial, ₪300”) | Contract: `BusinessDefaultsProfile`; ref only: `defaultsProfileVersion?` on workspace |
| **Fields** | Data captured on individual activities | Unchanged: `Category[]`, `resolveActivityFormSchema()` |

Capabilities are **architecture vocabulary**, not necessarily user vocabulary.

### Recommendation vs activation

| Layer | Role |
|-------|------|
| **Architectural recommendations** | Ideal future configuration from Business Type + Models — includes `planned` capabilities (`resolveArchitecturalRecommendedCapabilities()`) |
| **Effective recommendations** | Honest user-facing guidance NOW — excludes `planned` (`resolveEffectiveRecommendedCapabilities()`) |
| **Enabled capabilities** | Explicit activation in `capabilityProfile.activation` — never auto-populated from recommendations; **visible setup consent required** (Phase 2B.1) |

### Activation vs configuration completeness (Phase 2A.1)

| Concept | Values | Meaning |
|---------|--------|---------|
| **activation** | `disabled` \| `enabled` | Whether the capability is active for this business |
| **configurationStatus** | `not_required` \| `incomplete` \| `configured` | Whether required setup is complete — independent from activation |

A capability may be **enabled + incomplete** (future Attention target) or **enabled + configured**.  
`configured` does **not** replace `enabled`.

v1 snapshots `{ enabled: { key: 'configured' } }` normalize to v2 on read.

### Configuration requirement (Phase 2A.2)

Independent from readiness. Lives on each registry entry as `configurationRequirement`:

| Requirement | Meaning | Default status when enabled |
|-------------|---------|----------------------------|
| **none** | No business-level setup needed — capability usable immediately | `not_required` |
| **optional** | Enhanced settings may exist but are not mandatory | `not_required` |
| **required** | Business-level setup needed before meaningful use | `incomplete` until configured |

Four independent dimensions:

| Dimension | Question |
|-----------|----------|
| **Readiness** | Can the product honestly expose this capability now? |
| **Configuration requirement** | Does this capability need business-level setup? |
| **Activation** | Does this business use it? |
| **Configuration status** | Has required setup been completed? |

Pure helpers: `resolveInitialConfigurationStatus()`, `resolveConfigurationStatusOnEnable()`, `normalizeConfigurationStatusForCapability()` in `src/lib/capabilities/configurationRequirement.ts`.

Normalization applies requirement-aware defaults on read (does not mutate existing businesses without profiles). Explicit stored statuses are preserved unless invalid (e.g. `none` + `incomplete` → `not_required`).

**Future Attention boundary (not implemented):**  
`enabled` + `configurationRequirement=required` + `configurationStatus=incomplete` may become actionable.  
`enabled` + `none` or `optional` without extra configuration must **not** auto-create Attention.

Readiness exposure rules from Phase 2A.1 are unchanged — `planned` capabilities stay out of effective recommendations regardless of configuration requirement.

**Phase 2B.1 — Setup consent (onboarding):** Recommendation ≠ activation. Optional capabilities hidden from the setup UI (e.g. summary-only low-readiness) are not newly enabled on finish. The setup step owns only `managedKeys` (visible features); edit save merges into existing profile without deleting out-of-scope keys.

### Capability readiness

| Readiness | Meaning | User exposure |
|-----------|---------|---------------|
| **available** | Meaningfully usable now | May recommend and enable |
| **partial** | Meaningful subset usable now; honest promise | May recommend and enable |
| **planned** | Architecture only — behavior not ready | Registry only — **never** user-recommended or newly enabled |

Enforced centrally in `src/lib/capabilities/readiness.ts` and applied by recommendation resolvers — not left to UI discipline.

### Workspace storage boundary (Phase 2A.1)

`BusinessWorkspaceConfig.capabilityProfile` **MAY** contain:

- capability activation (`activation`)
- lightweight configuration completeness (`configurationStatus`)
- profile version + timestamps

It **MUST NOT** become storage for:

- service catalog records
- working-hour schedules
- package definitions
- project milestone templates
- recurring-series definitions
- large capability-specific settings/data

Those belong in dedicated defaults/config entities or snapshot sub-documents in future phases.

### Resolution inputs

```
Business Type          → recommendation context (overrides generic model baseline)
Primary Model          → operational emphasis (primary capability set)
Additional Models      → extend recommendations (do not replace primary)
Hybrid (legacy)        → union of enabled model baselines — no seventh capability set
Readiness filter       → effective recommendations exclude planned centrally
```

**TypeScript:**

| Module | Role |
|--------|------|
| `src/config/capabilityRegistry.ts` | Central registry (key, model, Hebrew label, readiness) |
| `src/config/businessTypeCapabilityRecommendations.ts` | Business-type + model architectural rules |
| `src/lib/capabilities/readiness.ts` | Central exposure/enablement guards |
| `src/lib/capabilities/` | Pure resolvers: recommend, legacy compatibility, effective configuration |
| `src/hooks/useCapabilityConfiguration.ts` | Read-only hook for active business |

### Legacy compatibility

| State | Behavior |
|-------|----------|
| **No `capabilityProfile`** | Legacy mode — all existing functionality preserved; `isCapabilityGatingActive()` is false |
| **Explicit `capabilityProfile`** | Future features may gate on `activation === 'enabled'` |

Existing completed businesses are **not** retrofitted with recommendations or profiles. Onboarding primary/additional models are unchanged.

### Persistence (additive)

- Optional `BusinessWorkspaceConfig.capabilityProfile?: StoredBusinessCapabilityProfile` (**version 2**)
- v1 `{ enabled: … }` snapshots normalize to v2 on read
- Optional `defaultsProfileVersion?: 1` — placeholder ref only
- **No Zustand version bump** — additive optional fields on existing workspace JSON
- **No Supabase schema change** — snapshot-compatible

### Defaults / templates boundary

`BusinessDefaultsProfile` and template interfaces remain **contracts only**. Capabilities answer “uses service catalog”; defaults answer “60-minute facial, ₪300”.

### Fields compatibility

Capabilities do not replace Category/field schema. Future configuration may **recommend** fields based on enabled capabilities; Phase 2A does not couple them.

### Phase 2A scope checklist

| In scope | Out of scope |
|----------|--------------|
| Capability registry + readiness | Phase 2B configuration UI |
| Architectural + effective recommendations | Dashboard / finance / attention changes |
| Primary + additional resolution | Auto-enabling recommended capabilities |
| Lightweight `StoredBusinessCapabilityProfile` v2 | Full defaults/template editors |
| Legacy no-profile compatibility | Hybrid removal |
| Pure resolver tests | Supabase schema migration |

---

## Phase 3A.1 — Integration ingestion foundation (implemented)

Phase 3A.1 adds **durable external-event infrastructure** only. There is **no user-visible behavior change** in this sub-phase.

### Pipeline (conceptual)

```
Integration Connection   (e.g. meta_connections — OAuth completed in later 3A.x)
        ↓
External Event           (integration_webhook_events — durable, idempotent)
        ↓
Provider normalizer      (Meta: later 3A.2+)
        ↓
Domain interpretation  (e.g. create/update Lead — later 3A.2+)
        ↓
Domain state             (crm_leads, activities, …)
        ↓
Attention                (later 3A.6)
```

### External Event rules

| Rule | Detail |
|------|--------|
| **Not a domain object** | An External Event is ingestion/audit infrastructure. It does **not** represent a Lead, Event, or Payment in the product model. |
| **No domain side effects** | Receiving or storing an External Event does **not** create Leads, Activities, or financial facts. |
| **Idempotency** | Unique `(provider, external_event_id)`. Meta Lead Ads: `provider = meta`, `external_event_id = leadgen_id`. |
| **Processing states** | `received` → `processing` → `processed` or `failed`. |
| **Processors** | Provider-specific webhook/OAuth code (3A.2+) interprets events and writes domain state. |

**Code:** `src/server/integrations/externalEvents/`  
**Schema:** `integration_webhook_events` (+ `supabase/integration-external-events-3a1.sql` migration)

### Meta connection status (schema/types only in 3A.1)

Client-safe `MetaConnection` includes `connectionStatus` (`disconnected` | `connecting` | `connected` | `error` | `reconnect_required`), optional `lastError`, `lastLeadReceivedAt`, `webhookSubscribedAt`. **Access tokens are never exposed to the client.**

### Phase 3A.4 — Meta connection product UX (client security model)

Product UI must not expose technical integration vocabulary (OAuth, webhook, Graph API, tokens). That is separate from **which identifiers may exist in the browser** for authorized flows.

| Category | Examples | Rule |
|----------|----------|------|
| **Client-safe identifiers** | Meta **Page ID** (Page selection `value`, server-validated choice), **OAuth attempt ID**, **business ID** where the session already owns the business | May appear in React state, form values, API request bodies, and `sessionStorage` attempt recovery — Page ID is **not** treated as a secret. |
| **Server-only / secret** | User access token, Page access token, `META_APP_SECRET`, `INTEGRATION_ENCRYPTION_KEY`, encrypted OAuth Page payload, raw Graph responses that include credentials | Must never reach React props for display, Zustand, `localStorage`, rendered HTML, or user-visible error text. |

UX rule: show **Page name** (and status copy), not Page ID in labels — without removing Page ID from the selection control.

### Meta token protection (server-only)

- New writes (Phase 3A.3+) use **AES-256-GCM** via `encryptIntegrationSecret` / `decryptIntegrationSecret` (`src/server/core/integrationSecrets.server.ts`).
- Key: **`INTEGRATION_ENCRYPTION_KEY`** (server environment only — documented in `.env.example`).
- Legacy rows may remain **base64**; decrypt supports **v1:** prefixed ciphertext and legacy base64 for read compatibility.
- Finance API keys continue to use the legacy base64 helper in `supabase.server.ts` until a future finance phase.

### Phase 3A.3.1 — OAuth hardening

- Atomic OAuth state/attempt consume (conditional Supabase updates).
- Page `page_already_connected` guard before cross-business conflicts.
- Reconnect: subscribe **before** persisting tokens; failed reconnect must not overwrite healthy `connected` rows.
- Business auth: `app_snapshots` primary + `meta_connections` / `crm_leads` fallback for snapshot lag.
- Meta API contract: `docs/meta-api-contract.md` (deployment-verified-required).

### Phase 3A.3 — Meta connection plane (implemented)

**Connection plane** (OAuth, Page token, webhook subscription) is separate from **event ingestion** (3A.2 webhook → ExternalEvent → CRM Lead).

```
Authenticated business (server-verified)
  → OAuth state (CSRF, user+business bound)
  → Meta authorization dialog
  → /api/integrations/meta/oauth/callback (code exchange, no tokens to browser)
  → meta_oauth_attempts (encrypted Page tokens, opaque attempt id)
  → safe Page list to client
  → Page selection (server validates Page ∈ attempt)
  → encryptIntegrationSecret (v1) on meta_connections.access_token_encrypted
  → POST /{page-id}/subscribed_apps (leadgen)
  → connection_status = connected, webhook_subscribed_at set
```

| Rule | Behavior |
|------|----------|
| One active Page / business | Unique partial index on `business_id` where `is_active` |
| Reconnect | Upsert same business row, replace token, re-subscribe |
| Stale OAuth attempt | Blocked if a newer `connected` connection exists after attempt baseline |

Tables: `meta_oauth_states`, `meta_oauth_attempts` (`supabase/meta-oauth-3a3.sql`).

### Phase 3A.2 — Meta webhook pipeline (implemented)

**Webhook delivery ≠ Lead.** A Meta POST only proves something happened; domain state changes only after provider processing.

```
POST /api/webhooks/meta/leadgen  (bodyParser: false — raw bytes)
  → X-Hub-Signature-256 verify (META_APP_SECRET)
  → parse leadgen changes (ignore unrelated fields)
  → claimExternalEventForProcessing (integration_webhook_events)
       • new row → process
       • processed → skip (duplicate delivery)
       • failed → retry same row (Meta redelivery)
       • processing + lease expired (`EXTERNAL_EVENT_STALE_PROCESSING_MS`, 15m) → reclaim same row
       • processing + lease fresh → skip (concurrent delivery; see limitation below)
  → resolve meta_connections by page_id (never trust webhook business id)
  → Graph fetch lead → normalizeMetaLeadFromGraph
  → createLeadFromExternalSourceDb (crm_leads idempotent)
  → mark ExternalEvent processed + last_lead_received_at
```

| Failure | HTTP | Meta retry |
|---------|------|------------|
| Bad/missing signature | 401/403 | No |
| Unknown/inactive page | 200 (event failed) | No |
| Graph 5xx / transient | 503 | Yes |
| Success / skip duplicate | 200 | No |

Legacy catch-all route `/api/webhooks/meta/leadgen` via `[[...slug]]` redirects GET and returns **410** for POST — use dedicated `api/webhooks/meta/leadgen.ts` (`metaWebhook.routing.ts` contract).

**Batch HTTP:** `resolveMetaLeadgenBatchHttpStatus` — any per-change `retryable` result → **503**; otherwise **200** (including non-retryable failures and skipped duplicates).

**Platform fallback:** CRM `Lead.source` may be `facebook` when Meta omits platform evidence — compatibility only; raw Meta payload is preserved. Instagram requires explicit Meta `platform`.

**Concurrency (honest limit):** Two deliveries within the stale-processing window while the first invocation is still running may skip the second as `in_progress`. CRM external-id uniqueness still prevents duplicate leads if both runs somehow complete; the lease mainly recovers crashed serverless runs.

---

## Lead intake & review lifecycle (target)

Customer communication and missing-information automation are **explicit product targets**, not optional afterthoughts. They are **not implemented** in this document’s phase — only architecture direction.

### Intake ≠ Activity

| Object | Role |
|--------|------|
| **Lead** | Intake record — external or manual — requires review and optional completion before conversion |
| **Activity** (Event, Engagement, …) | Operational reality on calendar/dashboard/workspace |

**Phase 3A.5 and later must not treat “new lead” as “new activity.”** Realtime arrival UX (3A.5) surfaces intake; conversion remains an explicit owner action after review.

### Target lifecycle (refinable in 3A.5)

Contract vocabulary: `LeadIntakeLifecycleState` in `src/types/productLayers.ts`.

```
External source (Meta, Google Forms, external forms, future providers)
        ↓
ExternalEvent (durable ingestion)
        ↓
Provider normalizer
        ↓
Normalized Lead (crm_leads / client Lead)
        ↓
Completeness vs business/activity requirements
        ↓
[needs_information] → request missing fields from customer (future channels)
        ↓
Customer completes / responds → update same lead
        ↓
[ready_for_review] → business owner reviews
        ↓
[approved] → explicit convert
        ↓
Business Activity + calendar/dashboard
```

Rejected leads remain intake records (`rejected`) — not silent deletes.

### Missing information (future)

Required fields for review should eventually be **derived** from target activity type, operating model, enabled capabilities, and field schema — **not** hardcoded only for Meta.

Example: Meta provides name, phone, event date; business requires event time, location, participant count → system detects gaps → automated or semi-automated customer completion → lead updated → then **ready_for_review**.

Owner should not repeat predictable phone calls to collect standard fields.

### Customer communication (target architecture)

| Piece | Direction |
|-------|-----------|
| **Channels** | Secure completion link first-class; later WhatsApp, SMS, email where supported — `CustomerCommunicationChannel` |
| **Scope** | Information completion on an **existing lead**, idempotent updates, audit trail |
| **Long-term** | Two-way conversation with lead/customer from inside the app where providers allow |
| **Not in scope now** | No messaging providers, no automated sends, no WhatsApp implementation |

Tie-in to Attention (future): incomplete customer response may surface as awareness/action — separate from 3A.5 lead arrival UX.

### Phase 3A.5 forward-compatibility requirements

3A.5 (realtime lead arrival) **must preserve**:

- Lead as intake object distinct from Activity
- Room for lifecycle states beyond `new` (e.g. `needs_information`, `ready_for_review`, `approved`, `rejected`, `converted`)
- No automatic conversion to Event/Engagement on webhook/sync alone
- No assumption that every incoming lead is owner-ready
- Extensibility for completeness checks tied to business configuration later

Current `LeadStatus` in `src/types/models.ts` (`in_progress`, `contacted`, `proposal_sent`, …) reflects a **sales funnel** — expect migration or parallel “intake status” over time; do not entrench “new lead → activity” in 3A.5.

---

## Integration architecture direction (provider-neutral)

### Lead sources (converging pipeline)

Provider-specific **connection + webhook/OAuth** at the edge; shared interior:

```
Meta │ Google Forms │ App external forms │ future lead providers
        ↓
Integration connection (per provider)
        ↓
ExternalEvent (integration_webhook_events)
        ↓
Provider adapter / normalizer
        ↓
Normalized Lead + provenance
        ↓
Lead intake & review lifecycle (above)
        ↓
Approved conversion → Activity
```

Meta (3A.2–3A.4) is the first full path; external forms and sheet flows partially exist — consolidation toward one intake semantics over time.

### Financial providers (adapter boundary)

Invoice/accounting and payment providers stay **provider-specific adapters** feeding normalized internal concepts (`FinancialFact`, coverage, reconciliation — future):

```
Morning │ Green Invoice │ iCount │ future invoice APIs
Payment providers (future)
        ↓
Provider adapter (auth, API quirks)
        ↓
Normalized financial semantics (received, expected, expense, …)
        ↓
Dashboard / finance visibility / reconciliation
```

Do not build new providers in architecture-only phases; document direction only.

---

## Architecture alignment notes

| Area | Status |
|------|--------|
| ExternalEvent vs Lead vs Activity | Aligned — pipeline docs match implementation intent |
| Capability profile vs entitlement | Aligned if kept separate — **risk** if future code conflates “enabled capability” with “paid feature” |
| `LeadStatus` sales states vs intake lifecycle | **Gap / debt** — migrate or add parallel field in lead phases |
| Meta creates lead without auto-activity | Aligned today |
| Customer messaging | **Not started** — documented as target |

No Supabase migration required for this architecture update.

*Last updated: Product layers, entitlements boundary, lead intake lifecycle, integration direction, 3A.5 compatibility.*
