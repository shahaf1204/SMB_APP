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

### Event Activities page (event-primary only)

Production route: `/activities` when `primaryOperatingModel === 'event'`.

**Featured:** One full `ActivityCard variant="hero"` — label **הבא בתור** or **דורש טיפול**. Selected via `selectFeaturedActivity()`; excluded from grouped lists.

**List density:** All other events use compact `EventSummaryRow` (~72–100px collapsed) — not full ActivityCards. Scales to 100+ events.

**Collapsed row:** date/time · client · title · location · amount · status · expand chevron.

**Expanded row:** full date/time, location, amount, payment, notes, tags, up to 3 quick actions (edit · call · navigate · invoice).

**Groups:** דורש טיפול · השבוע · אירועים קרובים · אירועים שהושלמו (collapsed by default).

**Filters:** הכל · השבוע · עתידיים · הושלמו · דורש טיפול.

**Search:** client, title, location, date, phone, tags.

**Distinction:** `ActivityCard` = featured/detail component. `EventSummaryRow` = high-density list browsing.

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
- sessions_used_this_month — מפגשים שבוצעו החודש
- packages_expiring_soon — כרטיסיות שעומדות לפוג

Revenue KPIs (הכנסות · הוצאות · רווח) appear **only** in סיכום חודשי on the package dashboard.

### Dashboard package status (מצב הכרטיסיות)

Operational KPIs only — each metric appears once. Priority row first (near completion · expiring); secondary row below (active · sessions this month):

- packages_near_completion — כרטיסיות קרובות לסיום (priority; emphasized when &gt; 0)
- packages_expiring_soon — כרטיסיות עומדות לפוג (priority; emphasized when &gt; 0)
- active_packages — כרטיסיות פעילות (secondary)
- sessions_used_this_month — מפגשים החודש (secondary)

Do **not** show מפגשים שנותרו on the dashboard (misleading aggregate).

### Business Coach (Package only)

Rule-based assistant panel — **מה דורש את תשומת הלב שלך**. Placed after Quick Actions, before סיכום חודשי. Hidden when no meaningful insights. Max **3** insights sorted by priority.

Insights add interpretation; they do not duplicate KPI counts.

| Rule | Trigger | Type |
|------|---------|------|
| Near completion | Active pack, remaining ≤ threshold | opportunity |
| Expiring soon | Active pack, expiry within threshold, not expired | reminder |
| Expired unused | Expired pack with remaining sessions | warning |

CTAs link to `/activities?filter=low_remaining`, `/activities?filter=expiring_soon`, or `/engagements/{id}`.

Positive insights (sessions or sales growth) appear only when month-over-month data supports a real comparison.

See `docs/business-coach.md` for architecture and future AI extension point.

### Dashboard attention previews

Max 3 rows each, with **הצג הכל** → filtered Activities page:

1. **כרטיסיות קרובות לסיום** → `/activities?filter=low_remaining`
2. **עומדות לפוג** → `/activities?filter=expiring_soon`

Hidden when no matching packages.

### Dashboard chart

Monthly **מפגשים שבוצעו** bar chart (6 months). Optional overlay: **כרטיסיות שנמכרו** when creation history exists.

### Package Activities page (package-primary only)

- **Title:** ניהול כרטיסיות
- **Subtitle:** כל הלקוחות והכרטיסיות הפעילות במקום אחד
- **Layout:** Client-first `PackageClientRow` groups — multiple packages under one client
- **Default sort:** attention → nearest expiration → lowest remaining → client name
- **Filters:** הכל · פעילות · קרובות לסיום · עומדות לפוג · הסתיימו
- **Search:** client name, package name, phone, email
- **Primary action:** + רישום מפגש (expanded details) — not pencil icon
- **Session history:** shown in expanded view when real data exists

### Package ActivityCard (hero/detail contexts)

- Utilization: `נותרו X מתוך Y` + progress bar
- Primary quick action: **רישום מפגש** → `?action=log-session`

### Configurable thresholds

`BusinessWorkspaceConfig.packageSettings`: `lowSessionsThreshold`, `expiringDaysThreshold`

### Recommended filters

- active — פעיל
- low_remaining — קרובות לסיום
- expiring_soon — עומדות לפוג
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
- by_type — לפי סוג (presentation chips for each enabled model)
- needs_attention — דורש טיפול

### Activities page — default groups

| Group | Hebrew |
|-------|--------|
| needs_attention | דורש טיפול |
| today_and_week | היום והשבוע |
| in_progress | פעילות בתהליך |
| paused | ממתין / מושהה |
| completed | הושלם |

### Featured activity

Highest-priority record across all enabled models: attention first, then nearest upcoming.

### Create CTA

`new_activity` — פעילות חדשה

---

## Activities page defaults (all models)

Central resolver: `src/lib/activities/groupingConfig.ts` · grouping: `groupActivities.ts` · featured: `selectFeaturedActivity.ts`

Each model defines default **section groups**, **filter chips**, **featured selection**, and **create CTA** terminology.

| Model | Default groups (summary) | Featured rule | Create CTA |
|-------|-------------------------|---------------|------------|
| `event` | דורש טיפול · השבוע · קרובים · הושלמו | Nearest upcoming or needs attention | אירוע חדש |
| `appointment` | דורש טיפול · היום · השבוע · עתידיות · הושלמו | Next appointment today or nearest | פגישה חדשה |
| `journey` | דורש טיפול · הפגישה הבאה · פעילים · הושלמו | Nearest next action / meeting | תהליך חדש |
| `package` | כמעט הסתיימו · עומדות לפוג · פעילות · הסתיימו | Low sessions or nearest expiration | כרטיסייה חדשה |
| `recurring` | היום · השבוע · פעילות · מושהות · הסתיימו | Next occurrence | פעילות קבועה חדשה |
| `project` | דורש טיפול · דדליינים · בביצוע · לקראת מסירה · הושלמו | Overdue or nearest deadline | פרויקט חדש |
| `hybrid` | דורש טיפול · היום והשבוע · בתהליך · ממתין · הושלם | Cross-model priority | פעילות חדשה |

Filter chips per model are defined in `getActivitiesFilterChips()`. Hybrid filters by presentation type for enabled models only.

Attention flags use real data only (`resolveActivityAttention`) — overdue invoices, low pack sessions, expiring packs, overdue project deadlines. No fake warning states.

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

### Category priority → form sections

Field presentation is resolved by **`resolveActivityFormSchema()`** (`src/lib/activityForm/`).  
See **`docs/activity-form-schema.md`** for full mapping rules.

| Priority | Default visibility | Example fields (event model) |
|----------|-------------------|------------------------------|
| `core` | Always on | client_name, built-in title/date |
| `primary` | On | start/end time, location, total_amount, deposit |
| `optional` | On when relevant | participants_count, balance_due |
| `advanced` | Off / collapsed | preparation_status, customer_source |

### Default form sections

| Section | Event example fields |
|---------|---------------------|
| `activity_details` | title, date, times, location |
| `client` | client picker |
| `business_details` | event type, package, photo_type |
| `financial` | total, deposit, balance |
| `advanced` | customer source, prep status |
| `notes` | notes |

**Recommended visible field count:** 5–8 expanded fields before collapsed sections.

Built-in form fields (title, date, location, notes) are system fields — category keys that duplicate them (`event_date`, `event_location`) bind to builtins and are not rendered twice.

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
| `src/lib/activities/` | Activities grouping, attention, search, ActivityCard mapping |
| `src/pages/EngagementsPage.tsx` | Production Activities page |
| `src/config/categoryTemplates.ts` | Category recommendation templates |
| `src/lib/categories/resolveRecommendedCategories.ts` | Category merge resolver |
| `docs/onboarding-flow.md` | 5-step onboarding reference |
