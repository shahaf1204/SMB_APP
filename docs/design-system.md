# Product Design System

> **Single source of truth** for the SMB Business Operating System visual language and reusable UI patterns.  
> Read this file before implementing or redesigning any screen.

**Product:** Mobile-first Business OS for small service businesses  
**Audience:** Developers, designers, and Cursor agents  
**Scope:** Visual language, tokens, components, patterns — not business logic

---

## 1. Product Identity

### What this product is

A **calm, intelligent, and professional Business OS** for small service businesses. It helps owners manage activities, clients, money, and daily operations from a phone — without feeling like enterprise software or a consumer toy.

The product must feel credible to a photographer, coach, therapist, consultant, event planner, or studio owner on the same day.

### Brand personality

| Trait | Meaning in UI |
|-------|----------------|
| **Calm** | Neutral backgrounds, restrained color, no visual noise |
| **Modern** | Clean type, soft borders, subtle motion |
| **Premium** | Consistent spacing, quality typography, intentional hierarchy |
| **Friendly** | Plain language, helpful empty states, human tone |
| **Trustworthy** | Predictable patterns, clear financial display, stable layout |
| **Efficient** | Action before analysis; one main question per screen |
| **Human** | Client names and context first; not dashboard vanity metrics |
| **Mobile-first** | Thumb-friendly actions, readable at 360px, safe areas respected |

### Quality references (do not copy)

Use these products only as **quality bars**, not as layouts to clone:

- Linear — clarity, density balance, calm hierarchy
- Stripe Dashboard — financial trust, semantic color, professional tone
- Notion — flexible content blocks, progressive disclosure
- Apple HIG — touch targets, motion restraint, typography
- Airbnb Host — operational clarity for non-technical owners
- Google Calendar — time-centric clarity, scannable lists

### Avoid

- Childish visual language (balloons, party themes, excessive emoji)
- Too many colors on one screen
- Heavy shadows or glassmorphism stacks
- Dense enterprise UI (nested tables, tiny controls)
- Excessive gradients
- Mixed icon libraries or illustration styles
- Decorative elements without informational purpose

---

## 2. Core Product Language

### Activity is the central entity

**Activity** is the generic product concept. Do not hardcode the UI around “events” or “birthdays.”

An Activity can represent:

| Concept | Example (Hebrew UI) |
|---------|---------------------|
| Event | יום הולדת עמית |
| Appointment | פגישת טיפול |
| Project | ליווי עסקי |
| Client journey | מסלול ליווי 90 יום |
| Treatment | טיפול פנים |
| Session | שיעור פרטי |
| Class | שיעור קבוצתי |
| Booking | הזמנת צילום |
| Package | כרטיסיית 10 אימונים |
| Recurring service | מנוי חודשי |

### Activity data model (UI-facing)

Every Activity **may** include these fields. List and detail views should show only what is relevant to context — not all fields at once.

| Field | Purpose |
|-------|---------|
| Type | Business-specific label (event, session, project…) |
| Status | Operational condition (see §12) |
| Workflow stage | Position in a custom pipeline (see §12) |
| Client | Linked customer |
| Start date / End date | Scheduling |
| Time | Start/end or duration |
| Amount | Price, quote, or package value |
| Payment status | Financial state (separate from status) |
| Progress | Completion %, sessions used, steps done |
| Tags | Filters and grouping |
| Quick actions | Call, message, mark paid, advance stage |

### Adaptation rule

Labels and workflows **adapt per business type**. Component structure stays the same.

```tsx
// ✅ Correct — generic component, contextual label
<ActivityCard title="פגישת טיפול" client="דנה לוי" badge="upcoming" />

// ❌ Wrong — hardcoded to one vertical
<BirthdayEventCard childName="עמית" />
```

---

## 3. Design Principles

### Mobile First

- Design for **360–430px** widths first; scale up gracefully.
- Primary actions must be reachable with **one thumb** (bottom half of screen).
- Avoid horizontal scrolling unless intentional (e.g. date strip, filter chips).
- Minimum tap target: **44×44px**.
- Fixed bottom navigation must **not cover** page content — always add safe bottom padding.

### Calm Productivity

- Show what matters **now** (next activity, open invoice, waiting lead).
- Reduce cognitive load: one focal element per section.
- Use **hierarchy** (size, weight, color) instead of decoration.
- Every screen answers **one main user question**:
  - Dashboard → “What should I do next?”
  - Activities → “What’s on my schedule?”
  - Clients → “Who needs follow-up?”

### Action Before Analysis

- Daily actions appear **before** secondary analytics.
- Dashboard order: **Next Activity → Quick Actions → KPIs → Charts**.
- Do not lead with charts on operational screens.

### Progressive Disclosure

- Show **summary first** on list cards (title, client, date, status).
- Reveal detail on tap or in detail screens.
- Never dump every Activity field into a list row.

### Consistency

- Same spacing scale, radius, typography, and interaction patterns everywhere.
- One `ActivityCard`, one `StatusBadge`, one `Button` system — not page forks.

### Semantic Color

- Color communicates **meaning** (status, payment, navigation).
- Never use color for decoration alone.
- If removing color would lose meaning, add a text label or icon.

### One Source of Truth

- Reuse components from `src/components/ds/` (or documented equivalents).
- Avoid page-specific CSS when a shared component exists.
- New tokens must be added to this document **before** use in code.

---

## 4. Color System

### Brand and semantic tokens

Use CSS custom properties. **Do not hardcode hex values in page files.**

```css
:root {
  /* Primary — main actions, active nav, upcoming */
  --color-primary: #4F46E5;
  --color-primary-hover: #4338CA;
  --color-primary-soft: #EEF2FF;
  --color-primary-border: #C7D2FE;

  /* Success — paid, completed, positive finance */
  --color-success: #10B981;
  --color-success-soft: #ECFDF5;
  --color-success-border: #A7F3D0;

  /* Accent / Warning — pending, attention, tasks */
  --color-accent: #F59E0B;
  --color-accent-soft: #FFFBEB;
  --color-accent-border: #FDE68A;

  /* Danger — overdue, error, destructive */
  --color-danger: #EF4444;
  --color-danger-soft: #FEF2F2;
  --color-danger-border: #FECACA;

  /* Neutral — surfaces, text, borders */
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F1F5F9;
  --color-border: #E2E8F0;
  --color-border-strong: #CBD5E1;
  --color-text-primary: #0F172A;
  --color-text-secondary: #64748B;
  --color-text-muted: #94A3B8;
}
```

### Semantic usage rules

| Token | Use for | Do not use for |
|-------|---------|----------------|
| **Primary** | Primary buttons, active tab, links, upcoming state | Random highlights, decorative headers |
| **Success** | Paid, completed, positive trend, confirmed | Generic “active” without positive meaning |
| **Accent** | Pending, waiting, tasks needing attention, warnings | Primary CTAs, success confirmation |
| **Danger** | Overdue, error, cancel, destructive confirm | Neutral inactive states |
| **Gray / Neutral** | Archived, completed-neutral, disabled, secondary text | Status that needs urgency |

### Status color mapping (badges)

| Badge meaning | Color family |
|---------------|--------------|
| New, Upcoming | Primary (blue) |
| In Progress, Active | Primary or neutral with label |
| Waiting, Pending, Needs Attention | Accent (orange) |
| Paid, Completed (positive) | Success (green) |
| Completed (neutral/archive) | Gray |
| Overdue, Cancelled | Danger (red) |

**Rule:** No random page-specific colors. If a new semantic meaning is needed, extend this table and the token list in §4 first.

---

## 5. Typography

### Font stack

```css
font-family:
  'Inter',
  'Plus Jakarta Sans',
  system-ui,
  -apple-system,
  'Segoe UI',
  'Helvetica Neue',
  Arial,
  sans-serif;
```

For Hebrew: ensure the stack includes a **Hebrew-compatible system fallback**. Do not load decorative Hebrew display fonts for UI chrome.

### Type scale

| Token | Size | Weight | Line height | Use |
|-------|------|--------|-------------|-----|
| **Display** | 32px | 700 | 1.2 | Hero titles, key financial headline |
| **H1** | 28px | 700 | 1.25 | Screen title |
| **H2** | 22px | 700 | 1.3 | Section title |
| **H3** | 18px | 600 | 1.35 | Card title, subsection |
| **Body** | 15px | 400 | 1.55 | Default reading text |
| **Body Strong** | 15px | 600 | 1.55 | Emphasis in body |
| **Small** | 13px | 400 | 1.5 | Secondary metadata |
| **Caption** | 12px | 400 | 1.4 | Timestamps, hints |
| **Label** | 13px | 600 | 1.4 | Form labels, chip text |
| **Financial** | 20–26px | 700 | 1.2 | Amounts, KPI values |

```css
.financial-number {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

### Typography rules

- Use **no more than three font weights** on a single screen (typically 400, 600, 700).
- **Numbers** must be visually stronger than their labels (`₪2,400` > `הכנסות החודש`).
- Secondary text must not compete with titles — use `--color-text-secondary` or `--color-text-muted`.
- Do not use Display/H1 for list row titles; reserve for screen-level hierarchy.

### Hebrew examples

| Element | Example |
|---------|---------|
| Screen title (H1) | פעילויות |
| Section (H2) | השבוע |
| Card title (H3) | פגישת ייעוץ — רונית כהן |
| Body | נותרו 3 מפגשים בכרטיסייה |
| Financial | ₪1,850 |

---

## 6. Spacing System

8pt-based scale. **Only use these tokens** unless accessibility requires an exception.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
}
```

### Layout rules

| Context | Token |
|---------|-------|
| Page horizontal padding (small mobile) | `--space-4` (16px) |
| Page horizontal padding (wider mobile, ≥390px) | `--space-5` (20px) |
| Card internal padding | `--space-4` (16px) — default |
| Section gap (between major blocks) | `--space-6` (24px) |
| Card-to-card gap in lists | `--space-3` (12px) |
| Inline icon-to-text gap | `--space-2` (8px) |
| Bottom safe area above nav | ≥ `--space-8` + device safe-area-inset |

**Do not** use arbitrary values like `13px`, `18px`, or `22px` for layout spacing.

---

## 7. Radius System

```css
:root {
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 999px;
}
```

| Element | Radius |
|---------|--------|
| Default cards | `--radius-lg` (16px) |
| Buttons | `--radius-md` (14px) |
| Inputs, search fields | `--radius-md` (14px) |
| Chips and badges | `--radius-pill` |
| Hero / featured cards | `--radius-xl` (20px) |
| Icon containers (soft bg) | `--radius-md` or 50% for circles |

---

## 8. Shadow System

Shadows are **subtle**. Borders carry most separation weight.

```css
:root {
  --shadow-none: none;
  --shadow-soft: 0 2px 8px rgba(15, 23, 42, 0.05);
  --shadow-card: 0 8px 24px rgba(15, 23, 42, 0.07);
  --shadow-floating: 0 12px 32px rgba(15, 23, 42, 0.12);
}
```

### Rules

- Prefer **1px border** (`--color-border`) + `--shadow-soft` or no shadow on cards.
- Do **not** combine heavy border + heavy shadow.
- Use `--shadow-floating` only for FAB, bottom sheets, and modals.
- List cards on mobile often need **border only**, no shadow.

---

## 9. Icon System

**Lucide icons only** (`lucide-react`).

### Sizes

| Size | px | Use |
|------|-----|-----|
| Compact | 16 | Metadata, inline with caption |
| Standard | 20 | Buttons, list rows, form fields |
| Primary | 24 | FAB, prominent actions |
| Hero / Empty | 32 | Empty states, onboarding |

### Rules

- Standard stroke width: **1.75–2** (consistent within a screen).
- **Do not** use emoji as primary product icons (navigation, status, system controls).
- Emoji may appear in friendly contextual copy only — never in nav or badges.
- Icon containers: soft semantic background when grouped:

```css
.icon-container--primary { background: var(--color-primary-soft); color: var(--color-primary); }
.icon-container--success { background: var(--color-success-soft); color: var(--color-success); }
.icon-container--accent  { background: var(--color-accent-soft);  color: var(--color-accent); }
```

---

## 10. Core Components

Each component must be implemented once and reused. Document new components here before coding.

---

### Button

**Purpose:** Trigger actions. Maximum clarity, minimum styles.

**Anatomy:** Label · Optional leading/trailing icon · Loading spinner

**Variants:**

| Variant | Use |
|---------|-----|
| **Primary** | Main CTA per section (one per viewport area) |
| **Secondary** | Supporting action on filled surface |
| **Outline** | Secondary action on white/card background |
| **Ghost** | Tertiary / inline actions (text-like, no border) |
| **Danger** | Destructive confirm (delete, cancel permanently) |
| **Icon Button** | Single icon, requires `aria-label` |
| **FAB** | Primary create action, fixed position |

**States:** Default · Hover (pointer devices) · Pressed (scale ~0.98) · Disabled · Loading

**Specs:**
- Minimum height: **44px**
- Horizontal padding: 16–20px
- Border radius: `--radius-md`
- Full-width on mobile when sole primary CTA

**Usage rules:**
- One primary button per action zone.
- Destructive actions use Danger, never Primary.
- Icon buttons must always include accessible labels.

---

### Card

**Purpose:** Group related content on `--color-surface`.

**Anatomy:** Optional header · Body · Optional footer · Optional actions row

**Variants:**

| Variant | Purpose |
|---------|---------|
| **Default Card** | Generic content block |
| **Hero Card** | Next activity, featured item, dashboard focal |
| **Metric Card** | KPI with value, label, optional trend |
| **Activity Card** | Generic activity list item (see §11) |
| **Client Card** | Client summary in lists |
| **Invoice Card** | Billing document summary |
| **Settings Card** | Navigable settings row with icon |
| **Summary Card** | Aggregated stats or period summary |

**Shared specs:**
- Background: `--color-surface`
- Border: 1px `--color-border`
- Radius: `--radius-lg` (hero: `--radius-xl`)
- Padding: `--space-4`
- Title: H3; metadata: Small/Caption

---

### Badge (StatusBadge)

**Purpose:** Compact operational or financial label. **Not** for filters — use Chip (below).

**Variants and semantic mapping:**

| Variant | Hebrew example | Color |
|---------|----------------|-------|
| New | חדש | Primary |
| Upcoming | בקרוב | Primary |
| In Progress | בתהליך | Primary + label |
| Waiting | ממתין | Accent |
| Completed | הושלם | Gray |
| Paid | שולם | Success |
| Pending | ממתין לתשלום | Accent |
| Overdue | באיחור | Danger |
| Cancelled | בוטל | Danger |
| Needs Attention | דורש טיפול | Accent |

**Specs:** Pill radius · Caption/Label size · 1px semantic border optional

---

### Chip (FilterChip)

**Purpose:** Filters, period selection, category toggles — **interactive**, not read-only status.

**Anatomy:** Label · Optional count · Optional dismiss

**States:**
- **Unselected:** Neutral outline, `--color-border`, `--color-text-secondary`
- **Selected:** Primary filled (`--color-primary-soft` bg + `--color-primary` text) or solid primary for strong filter bar

**Use for:** תקופה · סטטוס · סוג פעילות · מקור ליד

**Do not** use Chip and Badge interchangeably.

---

### Avatar

**Purpose:** Identify a person or business entity.

**Variants:** Initials · Photo · Business icon

**Sizes:** 32px (compact list) · 40px (standard) · 48px (detail header)

**Rules:**
- Initials backgrounds: **deterministic** soft tints derived from name hash — not random saturated colors.
- Always provide alt text or `aria-label` with the person/business name.

---

### Progress

**Purpose:** Show completion within an activity, package, or workflow.

**Variants:**
- **Linear Progress** — single bar (0–100% or sessions used)
- **Multi-step Progress** — discrete steps with labels
- **Workflow Timeline** — vertical/horizontal stage indicator

Must work for: event prep, coaching milestones, editing pipeline, package sessions, long-term journeys.

---

### Empty State

**Purpose:** Explain absence of data and guide next step.

**Required anatomy:**
1. Lucide icon (32px, muted container)
2. Clear title (H3)
3. One sentence explanation (Small, muted)
4. One primary CTA (Button Primary)

**Example (Hebrew):**

```
[Inbox icon]
אין פעילויות עדיין
כשתוסיפו פגישה או פרויקט, הוא יופיע כאן.
[+ פעילות חדשה]
```

---

### Search Field

**Purpose:** Full-width list filtering on mobile.

**Anatomy:** Search icon (start) · Input · Clear button (when value present)

**Specs:**
- Min height: **44px**
- Background: `--color-surface-muted` or `--color-surface` with border
- Radius: `--radius-md`
- Full width on mobile
- Placeholder: `--color-text-muted`

**Example placeholder:** `חיפוש לקוחות…`

---

### Bottom Navigation

**Purpose:** Top-level app sections on mobile.

**Rules:**
- Maximum **5 items**
- Active: `--color-primary` icon + label
- Inactive: `--color-text-muted`
- Respect `env(safe-area-inset-bottom)`
- Page content padding-bottom must clear nav height + safe area
- Do not hide critical CTAs behind the nav

---

## 11. Business Components

---

### ActivityCard

**Purpose:** Generic list/detail preview for any Activity type.

**Possible fields** (compose as needed — not all required):

| Field | Notes |
|-------|-------|
| Activity type icon | Lucide, semantic container |
| Title | H3 — business-specific label |
| Client | Name, linked |
| Date / time | Israeli format |
| Location | Optional |
| Amount | Financial number style |
| Status badge | StatusBadge |
| Workflow stage | Small label or progress |
| Progress | Bar or “3/10 מפגשים” |
| Quick actions | Icon row: call, WhatsApp, mark paid |

**Variants:**

| Variant | Use |
|---------|-----|
| **Compact** | Dense lists, calendar sidebars |
| **Standard** | Default activity feed |
| **Hero** | Dashboard “next up” focal card |
| **Timeline** | Chronological day/week view |

**Title examples (must all work):**

- יום הולדת עמית
- פגישת טיפול
- ליווי עסקי
- צילום משפחה
- שיעור פרטי
- כרטיסיית אימונים

#### Implementation

| Item | Location |
|------|----------|
| Component | `src/components/business/ActivityCard/ActivityCard.tsx` |
| Types | `src/components/business/ActivityCard/types.ts` |
| Styles | `src/components/business/ActivityCard/activity-card.css` |
| Dev showcase | `/dev/activity-card` |

**Import:**

```tsx
import { ActivityCard } from '@/components/business/ActivityCard';
```

**Props (display-only — parent normalizes data):**

| Prop | Type | Notes |
|------|------|-------|
| `id` | `string` | Required — used for a11y ids |
| `title` | `string` | Activity title (business-specific) |
| `variant` | `'compact' \| 'standard' \| 'hero' \| 'timeline'` | Layout density |
| `presentationType` | `'event' \| 'appointment' \| … \| 'generic'` | Visual hierarchy — default `generic` |
| `activityTypeLabel` | `string?` | e.g. "תור", "פרויקט" |
| `activityTypeIcon` | `LucideIcon?` | Semantic type icon |
| `clientName` | `string?` | Linked client |
| `dateLabel` | `string?` | Pre-formatted date |
| `timeLabel` | `string?` | Pre-formatted time (`dir="ltr"`) |
| `locationLabel` | `string?` | Hidden in compact |
| `amount` | `number \| string?` | Financial number typography |
| `currency` | `string?` | Default `₪` |
| `status` | `ActivityStatus?` | Operational — separate from payment |
| `stage` | `string?` | Workflow label from business config |
| `paymentStatus` | `ActivityPaymentStatus?` | Never inferred from `status` |
| `progressPercent` | `number?` | 0–100; hidden when absent |
| `progressLabel` | `string?` | e.g. "3 מתוך 6 מפגשים" |
| `tags` | `string[]?` | Optional footer tags |
| `onClick` | `(() => void)?` | Makes card body clickable |
| `quickActions` | `ActivityQuickAction[]?` | `call \| navigate \| edit \| invoice \| open` |
| `contextualLabel` | `string?` | Urgency/time context |
| `nextActionLabel` | `string?` | Next step in journey |
| `usageLabel` | `string?` | Package/session usage |
| `deadlineLabel` | `string?` | Project delivery deadline |
| `recurrenceLabel` | `string?` | Recurrence pattern |
| `nextOccurrenceLabel` | `string?` | Next session date |
| `progressDetail` | `string?` | Workflow detail text |

**Variant behaviour:**

| Variant | Metadata | Progress | Quick actions |
|---------|----------|----------|---------------|
| `compact` | Inline client · date · time | Hidden | Footer (if provided) |
| `standard` | Full rows + location | Shown when data present | Footer |
| `hero` | Full rows + accent border | Shown | Footer inside card |
| `timeline` | Full rows + rail marker | Shown | Footer |

**Legacy note:** `src/components/ds/Card.tsx` exports a simpler `ActivityCard` for the design-system showcase. Use the **business** `ActivityCard` for production activity lists.

#### ActivityCard Presentation Types

**Important distinction:**

| Concept | Meaning |
|---------|---------|
| **Business type** | What kind of business the user owns (photography, coaching, etc.) |
| **Presentation type** | How a *specific activity* should be visually composed |

A photographer may use:
- `appointment` for a consultation
- `project` for editing/delivery
- `event` for the shoot day itself

The parent screen or adapter **must supply** `presentationType`. ActivityCard does not infer it from titles or business names.

**Values:** `event` · `appointment` · `journey` · `package` · `project` · `recurring` · `generic` (default)

| Presentation | Use when | Visual priority |
|--------------|----------|-----------------|
| `event` | One-time bookings, scheduled events | Context label → title → date/time → location → amount → client → status |
| `appointment` | Treatments, lessons, meetings | Time anchor → title → client → date → status → payment |
| `journey` | Long-term coaching, consulting, care | Client + title → stage → progress → next action → amount |
| `package` | Session cards, prepaid packages | Usage → title → client → expiry → payment → usage progress |
| `project` | Creative/delivery workflows | Title → stage → deadline → client → progress → amount |
| `recurring` | Classes, clubs, subscriptions | Recurrence → title → client → usage → billing |
| `generic` | Fallback | Title → client → date/time → amount → status |

**Contextual display props** (optional — supplied by adapter):

| Prop | Example |
|------|---------|
| `contextualLabel` | "בעוד 5 ימים", "היום" |
| `nextActionLabel` | "הפגישה הבאה ב־22/07" |
| `usageLabel` | "7 מתוך 10 מפגשים נוצלו" |
| `deadlineLabel` | "מסירה עד 18/07" |
| `recurrenceLabel` | "כל יום שלישי" |
| `nextOccurrenceLabel` | "24/07" |
| `progressDetail` | "מפגש 3 מתוך 8" |

**Rules:**
- Show only relevant fields per presentation (max ~3 metadata rows + amount/status/progress on lists)
- Payment status never inferred from operational status
- Lucide icons only; default icon per presentation if `activityTypeIcon` omitted
- One component — `src/components/business/ActivityCard/`

---

### ClientCard

**Fields:** Avatar · Name · Contact summary · Activity count · Lifetime value · Status · Quick actions

**Example meta line:** `12 פעילויות · ₪18,400 סה״כ`

---

### InvoiceCard

**Fields:** Client · Amount · Issue date · Due date · Payment status badge · Provider sync status · Quick action (send, mark paid)

**Example:** `חשבונית #1042 · ₪850 · לתשלום עד 24/07`

---

### MetricCard

**Fields:** Icon · Value (financial number) · Label · Context/trend · Semantic tint

**Example:**

```
₪12,400
הכנסות החודש
+8% מהחודש שעבר
```

---

### WorkflowProgress

**Purpose:** Visualize custom pipelines per business type. Stages are **configurable**, not hardcoded.

**Example pipelines:**

| Business | Stages |
|----------|--------|
| Event | ליד → נקבע → מקדמה → מוכן → הושלם |
| Coaching | היכרות → תוכנית → בתהליך → סיכום → הושלם |
| Photography | הוזמן → צילום → עריכה → אישור → נמסר |
| Package | נרכש → מומש → נותר → הושלם |
| Long-term journey | קליטה → בתהליך → ביקורת → סגירה |

Render as multi-step progress or timeline. Stage labels come from business config, not component props named `birthdayPhase`.

---

## 12. Status and Workflow Language

Keep three concepts **separate**. Never merge them in one badge without explicit hierarchy.

### Status (operational condition)

Answers: *What state is this in right now?*

Examples: חדש · פעיל · ממתין · הושלם · בוטל

### Stage (workflow position)

Answers: *Where is this in the process?*

Examples: נקבע · הכנה · מסירה · מעקב

Display as secondary label, step indicator, or timeline — not as a replacement for status.

### Payment status (financial state)

Answers: *Has money been collected?*

Examples: לא שולם · חלקי · שולם · באיחור

Use Success/Accent/Danger badge colors per §4. A activity can be **Completed** (status) but **Unpaid** (payment) — show both when relevant.

---

## 13. Screen Structure

Every main screen follows this order:

1. **Screen Header** — title, short description, optional action
2. **Contextual summary** (optional) — period, KPI strip, alert banner
3. **Primary action** — CTA or FAB affordance
4. **Filters / search** — chips, search field
5. **Main content** — list, cards, detail sections
6. **Empty / loading / error state** — when no data
7. **Safe bottom spacing** — above bottom navigation

### Screen Header anatomy

```
[H1 Title]                    [Optional icon action]
[Small muted description]
```

**Examples:**

| Screen | Title | Description |
|--------|-------|-------------|
| Activities | פעילויות | 8 פעילויות השבוע |
| Clients | לקוחות | 142 לקוחות פעילים |
| Finance | כספים | סיכום החודש |

---

## 14. RTL and Hebrew Rules

- Default UI direction: **RTL** (`dir="rtl"` on app shell).
- Back chevrons and directional icons must **mirror** for RTL (use logical properties or Lucide RTL-aware patterns).
- **Numbers and currency** remain readable: `₪1,850` — use `dir="ltr"` on numeric spans when needed.
- Phone numbers and emails: LTR display (`050-1234567`, `name@email.com`).
- Dates: consistent **Israeli formatting** (e.g. `19/07/2026`, `יום א׳, 19 ביולי`).
- Do not mix Hebrew and English in the same heading.
- Developer terms (`ActivityCard`, `API`, `undefined`) must **never** appear in end-user UI.
- User-facing copy: natural Hebrew for Israeli small business owners.

---

## 15. Interaction and Motion

### Durations

| Token | ms | Use |
|-------|-----|-----|
| Fast | 150 | Button press, toggle, chip select |
| Standard | 200 | Card expand, fade, nav transition |
| Emphasis | 250 | Modal enter, sheet slide |

### Easing

- Entrances: `ease-out` / `cubic-bezier(0.16, 1, 0.3, 1)`
- Exits: slightly faster than entrance

### Allowed

- Subtle scale on press (0.96–0.98)
- Card lift on hover (pointer devices only)
- Animated segmented controls
- Skeleton loading for data lists
- Toast for success/error feedback

### Avoid

- Animations longer than 300ms for routine tasks
- Bouncing, spring overshoot on buttons
- Motion that delays task completion
- Parallax or decorative scroll effects

Respect `prefers-reduced-motion: reduce` — disable non-essential animation.

---

## 16. Accessibility

- Minimum touch target: **44×44px**
- Minimum body text: **14px** (15px preferred per scale)
- Contrast: WCAG AA for text on surfaces
- **Never** communicate status by color alone — pair with label or icon
- Form fields: visible labels (not placeholder-only)
- Focus rings on interactive elements for keyboard users
- `aria-label` on icon-only buttons
- Live regions for toasts and async updates where appropriate

---

## 17. Data Visualization

Charts support decisions; they do not replace action.

### Rules

- Use **semantic colors** (primary, success, accent — not rainbow palettes)
- Show only **relevant series** (e.g. revenue vs expenses, not 8 metrics)
- **Hebrew titles** and axis labels
- Minimal legends — direct labeling preferred
- Compact tooltips with tabular numbers
- No decorative chart junk (3D, heavy gradients)

### Recommended chart types

| Chart | Use |
|-------|-----|
| Line / area | Revenue vs expenses over time |
| Bar | Monthly comparison |
| Progress ring / bar | Goal tracking |
| Donut / bar | Lead source distribution |

**Example title:** `ביצועי העסק` · subtitle: `הכנסות מול הוצאות • מתחילת השנה`

---

## 18. Do and Don’t

### Do

| Practice | Example |
|----------|---------|
| One reusable ActivityCard | Same component for פגישה and פרויקט |
| Semantic color | Orange badge = ממתין, not “pretty highlight” |
| Prioritize next action | Hero card for next activity on dashboard |
| Compact list cards | Title + client + date + one badge |
| Progressive disclosure | Detail screen for full field set |
| Document before coding | Update §10 when adding a component |

### Don’t

| Anti-pattern | Why |
|--------------|-----|
| Unique card CSS per page | Breaks consistency, doubles maintenance |
| Random icons from mixed libraries | Visual inconsistency |
| Gradients on every card | Feels consumer/playful, not premium |
| All fields on list rows | Cognitive overload |
| `BirthdayCard`, `EventOnlyRow` | Hardcodes one business model |
| One badge for status + payment + stage | Ambiguous meaning |
| Emoji in navigation icons | Unprofessional, inconsistent sizing |
| `#4F46E5` hardcoded in page TSX | Bypasses token system |

---

## 19. Component Naming

### Use these names

| Component | Responsibility |
|-----------|----------------|
| `ActivityCard` | Generic activity list/detail preview |
| `ClientCard` | Client list item |
| `InvoiceCard` | Invoice list item |
| `MetricCard` | KPI display |
| `StatusBadge` | Read-only status/payment label |
| `FilterChip` | Interactive filter toggle |
| `WorkflowProgress` | Multi-step pipeline |
| `QuickAction` | Icon/text shortcut row item |
| `SectionHeader` | H2 + optional action within a screen |
| `ScreenHeader` | Top-of-screen title block |
| `EmptyState` | Zero-data pattern |

### Avoid

`Box`, `Item`, `Wrapper`, `PrettyCard`, `CustomButton2`, `EventThing`, `CardNew`

### File organization (recommended)

```
src/components/ds/          — design system primitives
src/components/business/    — ActivityCard, ClientCard, etc. (when extracted)
src/styles/design-system/   — tokens, typography, motion CSS
```

---

## 20. Implementation Rules for Cursor

**Mandatory checklist** before implementing any new screen or redesign:

1. **Read this file** (`docs/design-system.md`) in full.
2. **Reuse** existing components and tokens from the design system.
3. **Do not** introduce new visual tokens without updating this document first.
4. **Do not** hardcode colors in page files — use CSS variables from §4.
5. **Do not** create duplicate Button, Card, Badge, or EmptyState components.
6. Keep all shared UI **mobile-first** and **RTL-compatible**.
7. **Do not change business logic** during design-only tasks.
8. If a screen needs a **new reusable component**, document it in §10 or §11 here **before** implementation.
9. Prefer **composition** over page-specific variants (`ActivityCard` + props, not `ActivitiesPageCard`).
10. Preserve compatibility with **all supported business models** (§2) — test mentally against at least: event, appointment, project, package, coaching, photography.

### Design-only task boundaries

| Allowed | Not allowed |
|---------|-------------|
| Swap legacy markup for DS components | Change API calls or data shape |
| Apply tokens and spacing | Alter routing or permissions |
| Adjust copy for generic Activity language | Rename backend entities |
| Add empty/loading UI states | Change calculation logic |

### Mapping note (current codebase)

The app may still contain legacy classes (`global.css`, page-scoped CSS). When migrating:

- Prefer `src/components/ds/` components where they exist.
- Map legacy `--ds-*` tokens to this document’s `--color-*` names incrementally.
- Do not migrate all screens in one task unless explicitly requested.

---

## Quick Reference

```
Colors:     Primary · Success · Accent · Danger · Neutral
Spacing:    4 · 8 · 12 · 16 · 20 · 24 · 32 · 40
Radius:     10 · 14 · 16 · 20 · pill
Shadows:    soft · card · floating (subtle only)
Icons:      Lucide · 16/20/24/32px
Buttons:    Primary · Secondary · Outline · Ghost · Danger · Icon · FAB
Entity:     Activity (generic) — not Event-only
Separate:   Status · Stage · Payment
Direction:  RTL · Hebrew UI · LTR numbers
```

---

*Last updated: product design system v1 — documentation only. No screen redesigns implied.*
