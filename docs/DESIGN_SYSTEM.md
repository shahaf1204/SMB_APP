# SMB Design System v2

Mobile-first SaaS design language — **Linear × Stripe × Notion × Airbnb Host × Google Calendar**.

**Scope:** Reusable foundations only. No screen migrations yet.

## Quick start

```tsx
import { Button, StatisticCard, StatusChip, Fab } from '@/components/ds';
```

CSS variables load globally via `src/styles/design-system/index.css`.

**Live reference:** `/dev/design-system`

---

## 1. Colors

### Brand

| Token | Hex | Use |
|-------|-----|-----|
| `--ds-color-primary` | `#4F46E5` | CTAs, links, focus |
| `--ds-color-success` | `#10B981` | Revenue, completed, paid |
| `--ds-color-accent` | `#F59E0B` | VIP, highlights, tomorrow |
| `--ds-color-danger` | `#EF4444` | Errors, destructive, cancelled |

### Surfaces & text

| Token | Hex |
|-------|-----|
| `--ds-color-bg` | `#F8FAFC` |
| `--ds-color-surface` | `#FFFFFF` |
| `--ds-color-border` | `#E5E7EB` |
| `--ds-color-text` | `#0F172A` |
| `--ds-color-text-secondary` | `#64748B` |
| `--ds-color-text-muted` | `#94A3B8` |

Each brand color has a 50–900 scale (`--ds-primary-*`, etc.).

Legacy screens inherit via `legacy-map.css` (`--color-primary` → `--ds-color-primary`).

---

## 2. Typography

**Font stack:** Inter → Plus Jakarta Sans → system UI

| Variant | Class | Size |
|---------|-------|------|
| Display | `.ds-display` | 2.125rem |
| H1 | `.ds-h1` | 1.625rem |
| H2 | `.ds-h2` | 1.3125rem |
| H3 | `.ds-h3` | 1.0625rem |
| Body | `.ds-body` | 0.9375rem |
| Small | `.ds-small` | 0.8125rem |
| Caption | `.ds-caption` | 0.75rem |

React: `<Text variant="h2">…</Text>`

---

## 3. Spacing (8px grid)

`--ds-space-2` (8px) through `--ds-space-16` (64px). Half-step `--ds-space-1` (4px) for tight gaps.

---

## 4. Radius

| Token | Value |
|-------|-------|
| `--ds-radius-sm` | 8px |
| `--ds-radius-md` | 12px |
| `--ds-radius-lg` | 16px |
| `--ds-radius-xl` | 24px |

Rounded interfaces preferred on cards, inputs, and buttons.

---

## 5. Shadows

`--ds-shadow-xs` → `--ds-shadow-xl` — subtle, low-contrast elevation.

---

## 6. Buttons

| Component | Variants |
|-----------|----------|
| `Button` | primary, secondary, ghost, danger |
| `IconButton` | primary, secondary, ghost, danger |
| `Fab` | fixed primary action |

All support hover, pressed (`scale`), disabled, and loading (Button only).

---

## 7. Cards

| Component | Purpose |
|-----------|---------|
| `DefaultCard` | Generic container |
| `MetricCard` | Compact KPI tile |
| `StatisticCard` | Hero metric with delta + chart slot |
| `ActivityCard` | Feed / notification row |
| `ClientCard` | Customer list item |
| `SettingsCard` | Settings navigation row |

---

## 8. Status chips

`<StatusChip variant="upcoming|completed|cancelled|paid|pending|vip|today|tomorrow|this-week" />`

Hebrew labels built-in. Generic `<Chip tone="…">` for custom use.

---

## 9. Icons (Lucide only)

`<Icon icon={Calendar} size="md" tone="primary" />`

| Size | px |
|------|-----|
| sm | 16 |
| md | 20 |
| lg | 24 |
| xl | 32 |

Default `strokeWidth={1.75}`.

---

## 10. Motion

| Token | Value |
|-------|-------|
| `--ds-duration-fast` | 150ms |
| `--ds-duration-base` | 200ms |
| `--ds-duration-slow` | 250ms |
| `--ds-ease-out` | cubic-bezier(0.16, 1, 0.3, 1) |

Classes: `.ds-animate-fade-in`, `.ds-animate-slide-up`, `.ds-transition`

---

## File structure

```
src/styles/design-system/
  tokens.css          ← all CSS variables
  typography.css
  motion.css
  components.css
  legacy-map.css      ← bridges old screens
  index.css

src/design-system/
  tokens.ts           ← JS mirror
  cn.ts

src/components/ds/    ← React components
```

## Migration (later)

Adopt `ds-*` components page-by-page. Do not mix legacy `.btn` and `Button` on the same view.
