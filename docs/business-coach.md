# Business Coach

Rule-based business assistant layer for SMB APP. Surfaces actionable interpretations — not duplicate KPIs — from real workspace data.

**Production status:** Live on **Package / Session Package** workspaces only. Other operating models have generator stubs that return empty arrays; their dashboards are unchanged.

---

## Architecture

```
src/business-coach/
  types.ts           — BusinessInsight, InsightSource contracts
  insightEngine.ts   — generateBusinessInsights() + model stubs
  packageInsights.ts — Package rule implementation
  priority.ts        — sort, limit, dedupe, combineInsightSources()
  hebrewCopy.ts      — natural Hebrew phrasing helpers
  index.ts           — public exports

src/components/business-coach/
  BusinessCoachPanel.tsx
  InsightCard.tsx
  insightIcons.ts

src/components/dashboard/package/
  PackageBusinessCoachPanel.tsx  — Package-only wiring
```

UI components consume `BusinessInsight[]` from the domain layer. React is not required inside rule logic.

### Future AI integration

`InsightSource` defines a stable generator contract. `combineInsightSources()` merges rule-based and future AI arrays with deduplication. `BusinessInsight` and `BusinessCoachPanel` do not need to change when AI is added.

```typescript
// Future pattern (not implemented):
const insights = combineInsightSources(
  RULE_INSIGHT_SOURCE.generate(input),
  AI_INSIGHT_SOURCE.generate(input),
);
```

---

## BusinessInsight

| Field | Purpose |
|-------|---------|
| `id` | Stable key for React lists |
| `type` | `warning` · `opportunity` · `reminder` · `success` · `info` |
| `priority` | `critical` · `high` · `medium` · `low` · `positive` |
| `title` | Short Hebrew headline |
| `description` | One-line interpretation + recommendation |
| `actionLabel?` | CTA label |
| `actionTarget?` | React Router path |
| `icon` | Lucide icon key |
| `relatedEntityId?` | Engagement / client link when singular |
| `operatingModel` | Source model (`package` today) |

English enum values are internal only — never shown in UI.

---

## Rule engine (Package)

Rules use existing data from `engagements`, `engagementSessions`, and `BusinessWorkspaceConfig.packageSettings`.

### Per-engagement classification

Each `session_pack` is assigned **one** primary concern (deduplication):

1. **Expired with unused sessions** — `critical` warning
2. **Expiring within 3 days** — `high` reminder
3. **Low remaining sessions** — `high` opportunity
4. **Expiring within threshold** — `medium`/`high` reminder

If a package matches both low-remaining and expiring, the more time-sensitive concern wins.

### Aggregation

| Count | Behavior |
|-------|----------|
| 1 | Individual insight with client name |
| 2+ | Single aggregated insight + list CTA |

### Positive insights (max 1)

Only when real month-over-month data supports it:

- Sessions this month ≥ 5, last month ≥ 3, and ≥ 1.5× growth
- Package sales this month ≥ 2 and higher than last month

No generic “everything looks great” placeholders.

### No-noise rule

Healthy active packages, many sessions remaining, or newly created packs do **not** generate insights.

---

## Display rules

- **Panel title:** מה דורש את תשומת הלב שלך
- **Subtitle:** המלצות ועדכונים לפי מה שקורה בעסק
- **Maximum:** 3 insights, sorted by priority
- **Hidden** when zero meaningful insights
- **Package placement:** After Quick Actions, before סיכום חודשי

### Insight vs KPI

KPIs state counts. Insights add interpretation:

| KPI | Coach adds |
|-----|------------|
| כרטיסיות קרובות לסיום: 3 | כדאי ליצור קשר עם הלקוחות ולהציע חבילת המשך |

---

## CTA navigation

| Insight | Target |
|---------|--------|
| Aggregated near completion | `/activities?filter=low_remaining` |
| Aggregated expiring | `/activities?filter=expiring_soon` |
| Single package | `/engagements/{id}` |
| Expired unused (single) | `/engagements/{id}` |

All CTAs map to existing routes and filters.

---

## Tests

Run: `npm test`

Covers: empty state, single/aggregate rules, deduplication, priority limit, non-package workspace unchanged, CTA paths.
