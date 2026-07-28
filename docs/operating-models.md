# Operating Models

> Reference for how each **operating model** shapes workspace behavior.  
> Implementation: `src/config/operatingModelConfig.ts` · Types: `src/types/workspace.ts`

**Operating model** = how the business delivers service (events, appointments, projects, etc.)  
**Business type** = industry preset (photographer, therapist, coach, etc.)

One business type may use multiple operating models. Example: a photographer may use **appointment** for consultation, **event** for the shoot, and **project** for editing and delivery.

---

## Models overview

| Model | Hebrew title | Card presentation | Grouping |
|-------|--------------|-------------------|----------|
| `event` | אירועים חד־פעמיים | `event` | `date` |
| `appointment` | פגישות וטיפולים | `appointment` | `agenda` |
| `journey` | ליווי ותהליך מתמשך | `journey` | `status_and_next_action` |
| `package` | כרטיסיות וחבילות | `package` | `usage_and_expiration` |
| `recurring` | חוגים ומפגשים קבועים | `recurring` | `recurrence` |
| `project` | פרויקטים ותוצרים | `project` | `deadline_and_stage` |
| `hybrid` | שילוב של כמה מודלים | `generic` | `mixed` |

---

## event — אירועים חד־פעמיים

**Description:** הזמנות, הפקות, ימי צילום, סדנאות ואירועים בתאריך מוגדר.

### Default workflow stages

`lead` → `scheduled` → `deposit` → `preparation` → `completed`

### Dashboard metrics

- upcoming_events — אירועים קרובים
- expected_revenue — הכנסה צפויה
- unpaid_deposits — מקדמות פתוחות

### Recommended filters (Activities)

- this_week — השבוע
- upcoming — בקרוב
- past — עבר

### Quick actions

- new_event — אירוע חדש
- invoice — חשבונית
- task — משימה
- client — לקוח

### Activity form fields

`title`, `client`, `date`, `start_time`, `end_time`, `location`, `amount`, `deposit`, `notes`

### Terminology

- activitySingular: אירוע
- activityPlural: אירועים

---

## appointment — פגישות וטיפולים

**Description:** ייעוץ, טיפול, שיעורים ופגישות אישיות.

### Default workflow stages

`scheduled` → `confirmed` → `completed` → `cancelled`

### Dashboard metrics

- appointments_today — פגישות היום
- appointments_this_week — פגישות השבוע
- unpaid_appointments — פגישות שלא שולמו

### Recommended filters

- today — היום
- this_week — השבוע
- upcoming — בקרוב

### Quick actions

- new_appointment, client, invoice, task

### Activity form fields

`title`, `client`, `date`, `start_time`, `duration`, `location`, `online`, `amount`, `notes`

### Terminology

- activitySingular: פגישה
- activityPlural: פגישות

---

## journey — ליווי ותהליך מתמשך

**Description:** תהליך עם לקוח לאורך מספר מפגשים או שלבים.

### Default workflow stages

`onboarding` → `active` → `review` → `closing` → `completed`

### Dashboard metrics

- active_journeys — תהליכים פעילים
- next_meetings — מפגשים הבאים
- journeys_needing_attention — תהליכים שדורשים טיפול

### Recommended filters

- needs_attention — דורש טיפול
- active — פעיל
- waiting — ממתין
- completed — הושלם

### Quick actions

- new_journey, new_meeting, task, client

### Activity form fields

`title`, `client`, `date`, `expected_end_date`, `session_count`, `total_value`, `workflow_template`, `notes`

### Terminology

- activitySingular: תהליך
- activityPlural: תהליכים

---

## package — כרטיסיות וחבילות

**Description:** חבילות מפגשים, טיפולים, אימונים או שירותים בתשלום מראש.

### Default workflow stages

`purchased` → `active` → `nearly_used` → `expired` → `completed`

### Dashboard metrics

- active_packages — כרטיסיות פעילות
- remaining_sessions — מפגשים שנותרו
- expiring_soon — פג תוקף בקרוב

### Recommended filters

- active — פעיל
- low_remaining — מעט מפגשים נותרו
- expiring_soon — פג תוקף בקרוב
- completed — הושלם

### Quick actions

- new_package, use_session, client, invoice

### Activity form fields

`package_name`, `client`, `session_count_package`, `amount`, `expiration_date`, `notes`

### Terminology

- activitySingular: כרטיסייה
- activityPlural: כרטיסיות

---

## recurring — חוגים ומפגשים קבועים

**Description:** פעילות שבועית, קבוצות, מנויים ומפגשים חוזרים.

### Default workflow stages

`active` → `paused` → `completed`

### Dashboard metrics

- sessions_this_week — מפגשים השבוע
- active_participants — משתתפים פעילים
- unpaid_recurring — תשלומים חוזרים פתוחים

### Recommended filters

- today — היום
- this_week — השבוע
- active_groups — קבוצות פעילות
- paused — מושהה

### Quick actions

- new_recurring, participant, attendance, invoice

### Activity form fields

`title`, `recurrence_pattern`, `start_time`, `participants`, `billing`, `location`, `notes`

### Terminology

- activitySingular: מפגש קבוע
- activityPlural: מפגשים קבועים

---

## project — פרויקטים ותוצרים

**Description:** עבודה בשלבים עם דדליין, אישור ומסירה.

### Default workflow stages

`planned` → `active` → `waiting_for_client` → `delivery` → `completed`

### Dashboard metrics

- active_projects — פרויקטים פעילים
- deadlines_this_week — דדליינים השבוע
- projects_needing_attention — פרויקטים שדורשים טיפול

### Recommended filters

- needs_attention — דורש טיפול
- in_progress — בתהליך
- waiting_for_client — ממתין ללקוח
- upcoming_deadlines — דדליינים קרובים
- completed — הושלם

### Quick actions

- new_project, task, client, invoice

### Activity form fields

`title`, `client`, `date`, `deadline`, `amount`, `workflow_stage`, `notes`

### Terminology

- activitySingular: פרויקט
- activityPlural: פרויקטים

---

## hybrid — שילוב של כמה מודלים

**Description:** עסק שמשלב כמה צורות עבודה.

### Behavior

- Mixed card presentations — filter by type when needed
- No forced single grouping mode (`mixed`)
- Generic cross-model dashboard summary
- Legacy concept tabs (אירועים / כרטיסיות / חוגים / ליווי) when multiple work concepts are enabled

### Recommended filters

- all — הכל
- by_type — לפי סוג

### Quick actions

- new_activity, client, invoice, task

### Activity form fields

`title`, `client`, `date`, `amount`, `notes` (minimal shared set)

---

## How presentationType is selected

1. **New activities** use `primary.cardPresentation` from the resolved workspace config.
2. **Existing activities** keep their stored type — changing workspace config does not rewrite records.
3. **ActivityCard** receives `presentationType` from the parent adapter; it is never inferred from title text or preset names.
4. **Hybrid** workspaces use `generic` as default; individual cards may pass a specific type per record.

---

## Legacy migration mapping

| Legacy `WorkConcept` | Operating model |
|---------------------|-----------------|
| `single_event` | `event` |
| `session_pack` | `package` |
| `recurring_group` | `recurring` |
| `project` | `project` |

`appointment` and `journey` have no legacy equivalent — select them explicitly in onboarding or settings.

Migration rules:

- Do **not** infer operating model from preset names (birthday, photography, etc.)
- Use existing `workModels` / `primaryWorkModel` when present
- Default to `hybrid` when multiple concepts are enabled
- Set `onboardingCompleted: true` for migrated users so onboarding does not rerun
- Never delete existing activity or integration data

---

## Recommended categories per model

Central templates: `src/config/categoryTemplates.ts`  
Resolver: `resolveRecommendedCategories()` in `src/lib/categories/resolveRecommendedCategories.ts`

Categories merge by semantic `key`. Core fields (revenue, expense, client, customer source) are protected during onboarding.

### Default metric mappings

| Category key | Metric role |
|--------------|-------------|
| `total_amount`, `appt_price`, `package_price`, `journey_value`, `project_value`, `recurring_price` | Revenue |
| `revenue_amount` | Revenue (core) |
| `expense_amount` | Expense (core) |

### Category priority

1. Core client + model schedule fields  
2. Business-type-specific fields  
3. Financial fields  
4. Notes / status  

Built-in form fields (title, date, location, notes) render before categories in `EventForm`.

---

## Related files

| File | Role |
|------|------|
| `src/types/workspace.ts` | TypeScript types |
| `src/config/operatingModelConfig.ts` | Central model definitions |
| `src/config/activityFormSchema.ts` | Form field composition helpers |
| `src/lib/workspace/resolve.ts` | Migration + resolution |
| `src/hooks/useWorkspaceConfig.ts` | React hook for resolved config |
| `src/hooks/useActivitiesWorkspace.ts` | Activities page adapter |
| `src/config/categoryTemplates.ts` | Category recommendation templates |
| `src/lib/categories/resolveRecommendedCategories.ts` | Category merge resolver |
| `docs/onboarding-flow.md` | 5-step onboarding reference |
