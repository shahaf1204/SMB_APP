# Onboarding Flow

> Product-level business setup — configures workspace, categories, and terminology.  
> Implementation: `src/pages/OnboardingPage.tsx` · Dev preview: `/dev/onboarding`

---

## Steps

| Step | Title | Persists to draft |
|------|-------|-------------------|
| 1 | בואו נכיר את העסק שלך | name, business type |
| 2 | Recommended working style **or** manual picker | primary model + confirmation source |
| 3 | האם יש עוד צורות עבודה? | additional models (explicit opt-in only) |
| 4 | התאמנו לך קטגוריות התחלה | category customization |
| 5 | העסק שלך מוכן | review → finish |

Progress indicator: `N מתוך 5`

### Step 2 — recommendation-first (Phase 1)

**Current flow:**

```
Business Type
  → Recommended working style (one card + "המשך עם ההמלצה")
  → OR "אני עובדת אחרת" → working-style picker (6 models, no hybrid)
  → Additional models
```

**Config:** `src/config/businessTypeRecommendationConfig.ts` — maps each onboarding preset to either a **direct** recommendation or a **guided clarification** (coach, consultant, freelance).

**Draft fields (localStorage only — not Zustand v13):**

| Field | Purpose |
|-------|---------|
| `primaryModelConfirmed` | User confirmed step 2 |
| `primaryModelSource` | `'none'` \| `'recommended'` \| `'manual'` |
| `clarificationChoiceId` | Selected clarification option for ambiguous presets |

**Phase 1.1 refinements:**
- Clear presets → direct recommendation card
- Ambiguous presets (`coach`, `consultant`, `freelance`) → one clarification question before recommendation
- Hybrid hidden from all new-user onboarding choices (legacy edit-mode hybrid preserved)
- Back from Additional Models after confirmation → shows selected style with "נבחר ✓" and "המשך"

Changing business type before confirmation updates the recommendation/clarification. Manual choices are never overwritten by preset changes.

**Custom / `__other__` business types:** No guessed recommendation — falls back to plain-language picker (`ספרי לנו איך רוב העבודה שלך מתנהלת`).

**User-facing copy:** Working styles (e.g. "תורים ופגישות") — not internal terms like "Operating Model".

**Future (not implemented):** Existing-business onboarding, import/baseline, capability persistence.

---

## State & persistence

### Draft (in-progress)

- **Storage:** `localStorage` key `smb-onboarding-draft:{userId}`
- **Saved after:** every step transition and field change (via `saveOnboardingDraft`)
- **Cleared on:** successful finish
- **Shape:** `OnboardingDraft` in `src/types/onboarding.ts`
- **Primary model confirmation:** `primaryModelConfirmed`, `primaryModelSource` (onboarding draft only)

### Completion (business created / updated)

Written to Zustand persist (v13+) on `Business`:

| Field | Location |
|-------|----------|
| `businessType`, `presetId`, `name` | `Business` |
| `primaryOperatingModel`, `enabledOperatingModels` | `Business.workspace` |
| `terminology`, `onboardingCompleted`, `onboardingCompletedAt` | `Business.workspace` |
| Categories | `categories[]` in store |
| Legacy sync | `workModels`, `primaryWorkModel` |

---

## Category recommendation

Central resolver: `resolveRecommendedCategories()` in  
`src/lib/categories/resolveRecommendedCategories.ts`

Merges (deduped by semantic `key`):

1. Core categories (`CORE_CATEGORY_TEMPLATES`)
2. Business-type templates (`BUSINESS_TYPE_CATEGORY_TEMPLATES`)
3. Operating-model templates (`OPERATING_MODEL_CATEGORY_TEMPLATES`)

Protected core fields cannot be removed: revenue, expense, customer source, client name.

---

## Existing users

| Rule | Behavior |
|------|----------|
| `onboardingCompleted === true` | `/onboarding` redirects to dashboard (unless `?mode=edit`) |
| Workspace migrated from legacy | `onboardingCompleted: true` — no forced rerun |
| Re-run setup | Settings → התאמת העסק → עדכון התאמת העסק |
| Category merge on re-setup | New recommendations **added**, existing **never deleted** |

---

## Routes

| Route | Purpose |
|-------|---------|
| `/onboarding` | New business setup |
| `/onboarding?mode=edit` | Re-run setup for existing business |
| `/settings/adaptation` | Settings hub for business adaptation |
| `/dev/onboarding` | Isolated dev preview (no store writes) |

---

## Hooks (downstream consumers)

| Hook | File |
|------|------|
| `useWorkspaceConfig()` | Resolved workspace |
| `useOperatingModelConfig()` | Primary model definition |
| `useBusinessTerminology()` | Hebrew labels |
| `useActivityFormSchema()` | Form field ids |
| `useRecommendedCategories()` | Current recommendations |
| `useWorkspaceDashboardConfig()` | Dashboard hero, metrics, actions |
| `useActivitiesWorkspace()` | Activities page adapter |

---

## Completion behavior

1. Build `BusinessWorkspaceConfig` via `buildWorkspaceFromOnboarding()`
2. Sync legacy `workModels`
3. Map onboarding category drafts → `Category` records
4. **New user:** `createBusiness({ categoryDefs, workspace })`
5. **Edit mode:** `completeBusinessSetup({ mergeCategories: true })`
6. Navigate to `/dashboard`
7. **No** demo records created
