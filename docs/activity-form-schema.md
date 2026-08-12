# Activity Form Schema

Central field presentation layer for onboarding field configuration and production activity forms (Event model).

**Resolver:** `src/lib/activityForm/resolveActivityFormSchema.ts`  
**Metadata:** `src/lib/activityForm/fieldMetadata.ts`  
**Types:** `src/lib/activityForm/types.ts`

---

## Purpose

One schema drives:

1. Onboarding step 4 preview + simple/advanced field configuration
2. Production `EventForm` section layout
3. Future Settings → "שדות ופרטי פעילות"

There is **no parallel field system** — categories remain the persistence layer; the resolver adds presentation metadata.

---

## Field presentation model

Each field resolves to:

| Property | Description |
|----------|-------------|
| `key` | Semantic template key or `__builtin_*` |
| `label` | Hebrew display name |
| `valueType` | text / number / date / duration |
| `metricRole` | revenue / expense / neutral — **unchanged for financial calculations** |
| `priority` | core / primary / optional / advanced |
| `section` | Form section id |
| `source` | system / business_recommended / model_recommended / user_added |
| `visibleByDefault` | Expanded in production form |
| `locked` | Cannot remove during onboarding |
| `builtin` | Maps to EventForm built-in control (title, date, location, notes) |

---

## Priority levels

| Priority | Meaning | Default enabled (fresh onboarding) |
|----------|---------|-------------------------------------|
| `core` | Required for app function | Always |
| `primary` | Recommended for business + model | Yes |
| `optional` | Useful but not essential | Usually yes |
| `advanced` | Niche / internal | No |

---

## Form sections

| Section id | Hebrew title | Field types |
|------------|--------------|-------------|
| `activity_details` | פרטי הפעילות | Title, date, time, location |
| `client` | לקוח | Client name category + picker |
| `business_details` | פרטים נוספים | Neutral operational fields |
| `financial` | תשלום | `metricRole: revenue \| expense` only |
| `advanced` | עוד פרטים | Source, prep status, custom low-priority |
| `notes` | הערות | Notes |

**Rule:** `customer_source` (מקור הגעה) is always `advanced`, never `financial`.

---

## Resolver behavior

### From onboarding drafts

```ts
resolveActivityFormSchemaFromDrafts({
  drafts: OnboardingCategoryDraft[],
  businessType?: string,
  operatingModel: OperatingModel,
})
```

- Merges enabled category drafts with system builtins
- Skips categories bound to builtins (`event_date` → built-in date)
- Groups into ordered sections

### From persisted categories

```ts
resolveActivityFormSchemaFromCategories({
  categories: Category[],
  businessType?: string,
  operatingModel: OperatingModel,
})
```

Used by `EventForm` at runtime.

---

## Migration / fallback rules

Existing users without explicit priority/section metadata:

1. Look up semantic `templateKey` in `fieldMetadata.ts`
2. If unknown, infer section from name + `metricRole`:
   - Client name hints → `client`
   - Revenue/expense / amount hints → `financial`
   - Source hints → `advanced`
   - Notes hints → `notes`
   - Else → `business_details`
3. Infer priority from section + protection flags
4. **Never delete or rewrite** category rows or event values

Manual categories (`manual-*` keys) default to:

- Section: `advanced` (unless name implies financial/client)
- Priority: `optional`
- Enabled: preserved from user config

---

## Financial semantics (unchanged)

Revenue mapping uses existing `MetricRole` on categories:

- `total_amount`, `revenue_amount`, `appt_price`, `package_price`, `journey_value`, `project_value`, `recurring_price` → Revenue
- `expense_amount` → Expense

The resolver only **groups** fields — it does not alter metric roles or dashboard calculations.

---

## Onboarding helpers

| Function | Purpose |
|----------|---------|
| `partitionDraftsForOnboarding()` | Split drafts into core / recommended / more |
| `applyDefaultEnabledToDrafts()` | Set initial toggle state for fresh recommendations |
| `buildOnboardingPreviewRows()` | 4–5 preview rows for step 4 |

---

## Test coverage

`src/lib/activityForm/resolveActivityFormSchema.test.ts`:

- Photographer + event financial section
- Customer source not in payment
- Advanced fields off by default
- Journey business resolves cleanly

Run: `npm test`
