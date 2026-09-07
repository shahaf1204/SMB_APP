# Business Architecture

> **Phase 0 contracts** — TypeScript vocabulary for product concepts defined in the [Product Foundation](design-system.md#product-foundation) and the architecture audit.  
> **Not implemented in runtime yet.** No persistence, UI, or finance behavior changes in Phase 0.

**Related docs:**

| Document | Role |
|----------|------|
| [design-system.md](design-system.md) | Product/UX authority (Product Foundation) |
| [operating-models.md](operating-models.md) | Operating-model-specific behavior |
| [activity-form-schema.md](activity-form-schema.md) | **Fields** layer (form presentation) |
| [business-coach.md](business-coach.md) | Coach rules (future **interpret** layer) |

**TypeScript source:** `src/types/businessArchitecture.ts`

---

## Core principle

> The operating model defines what the product **can understand**.  
> The business configuration defines what is **relevant**.  
> The available data defines what the product may **confidently show**.

These three must not be collapsed into one configuration object.

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

*Last updated: Phase 0 — product architecture contracts.*
