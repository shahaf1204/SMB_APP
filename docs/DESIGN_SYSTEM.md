# SMB Product Design System

Unified visual language for a **production SaaS** platform for service businesses.

**Personality:** Calm · Modern · Premium · Friendly · Clean · Trustworthy  
**References:** Stripe Dashboard, Linear, Notion, Arc, Apple HIG  
**Not:** Monday.com, colorful, childish

---

## Usage

```tsx
import {
  Button,
  IconButton,
  Badge,
  DefaultCard,
  EmptyState,
  Divider,
  Text,
  Icon,
} from '@/components/ds';
```

CSS tokens load globally via `src/styles/design-system/index.css`.

---

## Colors

### Brand (3 only)

| Token | Role |
|-------|------|
| `--ds-color-primary` | Blue/violet — actions, upcoming |
| `--ds-color-success` | Green — success, paid |
| `--ds-color-accent` | Orange — waiting, attention |

Everything else uses **neutral grays**. Danger red is semantic feedback only (cancelled).

### Status semantics

| Status | Color |
|--------|-------|
| Success | Green |
| Waiting | Orange |
| Upcoming | Blue |
| Completed | Gray |
| Cancelled | Red |

Use `<Badge variant="paid" />` — legacy variants map automatically.

---

## Spacing (8pt)

Use only: **4 · 8 · 16 · 24 · 32** px

| Token | Value |
|-------|-------|
| `--ds-space-1` | 4px |
| `--ds-space-2` | 8px |
| `--ds-space-4` | 16px |
| `--ds-space-6` | 24px |
| `--ds-space-8` | 32px |

---

## Radius

| Element | Token | Value |
|---------|-------|-------|
| Cards | `--ds-radius-card` | 16px |
| Buttons | `--ds-radius-button` | 14px |
| Badges | `--ds-radius-badge` | 999px |

---

## Shadows

Very soft — almost invisible floating feel.

`--ds-shadow-xs` → `--ds-shadow-lg`

---

## Typography

| Variant | Class |
|---------|-------|
| Display | `.ds-display` |
| H1–H3 | `.ds-h1` … `.ds-h3` |
| Body | `.ds-body` |
| Small | `.ds-small` |
| Caption | `.ds-caption` |
| **Financial** | `.ds-financial` |

Financial numbers are slightly larger with tabular nums.

---

## Buttons (4 styles only)

| Component | Variant |
|-----------|---------|
| `Button` | `primary` |
| `Button` | `secondary` |
| `Button` | `outline` |
| `IconButton` | `primary` · `secondary` · `outline` |

All support hover, pressed, disabled, loading (Button).

---

## Cards

All cards use `ds-card`:

- 16px radius
- Soft border
- 16px padding (`--ds-card-padding`)
- Consistent title hierarchy via `Text`

Variants: `DefaultCard`, `MetricCard`, `StatisticCard`, `ActivityCard`, `ClientCard`, `SettingsCard`.

---

## Badges

**One component:** `<Badge variant="upcoming" />`

Replaces all chip/status styles. `StatusChip` is a deprecated alias.

---

## Empty states

**One component:** `<EmptyState />`

- Lucide icon
- Title
- Description
- Primary CTA

---

## Dividers

`<Divider />` — very subtle 1px line.

---

## Icons

**Lucide only** via `<Icon icon={…} size="md" />`.

Sizes: 16 · 20 · 24 · 32 px.

---

## Motion

Fast & professional: 120–220ms, ease-out.

---

## Migration plan

1. ✅ Unified tokens + components (`components/ds`)
2. ⏳ Replace legacy `.btn`, `.card`, `.empty-state-*` screen-by-screen
3. ⏳ Remove `design-refresh.css` overrides when complete

**Do not** mix legacy and DS classes on the same element.

---

## File structure

```
src/styles/design-system/
  tokens.css       — colors, spacing, radius, shadows
  typography.css   — text hierarchy + .ds-financial
  motion.css       — animations
  components.css   — detailed component styles
  foundation.css   — unified v3 foundations
  legacy-map.css   — bridges old CSS vars
  index.css

src/components/ds/ — React components (single import path)
src/design-system/ — cn, tokens.ts
```
