# SMB Design System

Mobile-first design language for service-business SaaS. Premium, calm, and professional — inspired by Linear, Stripe, Notion, and Google Calendar.

**Status:** Foundation complete. Existing app screens still use legacy styles. Migrate page-by-page after approval.

## Quick start

```tsx
import { Button, Text, MetricCard, StatusChip } from '@/components/ds';
```

CSS loads globally via `src/styles/design-system/index.css` (imported in `main.tsx`).

## Reference page

Open `/dev/design-system` in the app to preview all tokens and components.

---

## 1. Color palette

### Brand (3 colors only)

| Token | Role | Default |
|-------|------|---------|
| `--ds-color-primary` | Actions, links, focus | Blue `#2563eb` |
| `--ds-color-success` | Revenue, completed, paid | Emerald `#059669` |
| `--ds-color-accent` | VIP, highlights | Violet `#7c3aed` |

Each brand color has a 50–900 scale: `--ds-primary-*`, `--ds-success-*`, `--ds-accent-*`.

### Neutral scale

`--ds-neutral-0` through `--ds-neutral-950` (slate). Use for backgrounds, borders, and text.

### Semantic feedback (not brand)

- **Danger:** `--ds-color-danger` — errors, destructive actions, cancelled
- **Warning:** `--ds-color-warning` — pending, attention

### Usage rules

- UI chrome (backgrounds, borders, body text) → neutral only
- Primary → main CTAs, active nav, links
- Success → money, completion, confirmation
- Accent → VIP, premium badges, secondary highlights
- Never use brand colors for large background areas

---

## 2. Typography

Font: **Heebo** (RTL-ready).

| Variant | Class | Size | Weight |
|---------|-------|------|--------|
| Display | `.ds-display` | 2rem | Bold |
| H1 | `.ds-h1` | 1.5rem | Bold |
| H2 | `.ds-h2` | 1.25rem | Semibold |
| H3 | `.ds-h3` | 1.0625rem | Semibold |
| Body | `.ds-body` | 0.9375rem | Regular |
| Small | `.ds-small` | 0.8125rem | Regular |
| Caption | `.ds-caption` | 0.6875rem | Medium |

React: `<Text variant="h2">…</Text>`

---

## 3. Spacing (8pt grid)

| Token | Value |
|-------|-------|
| `--ds-space-1` | 4px |
| `--ds-space-2` | 8px |
| `--ds-space-3` | 12px |
| `--ds-space-4` | 16px |
| `--ds-space-6` | 24px |
| `--ds-space-8` | 32px |

Use multiples of 8px for layout. `--ds-space-1` (4px) for tight inline gaps only.

---

## 4. Border radius

| Token | Value | Use |
|-------|-------|-----|
| `--ds-radius-sm` | 6px | Chips, small buttons |
| `--ds-radius-md` | 10px | Inputs, buttons |
| `--ds-radius-lg` | 14px | Cards |
| `--ds-radius-xl` | 20px | Modals, hero panels |
| `--ds-radius-full` | pill | Chips, avatars |

---

## 5. Shadows

Subtle elevation only — avoid heavy drop shadows.

- `--ds-shadow-xs` — cards at rest
- `--ds-shadow-sm` — buttons, hover lift
- `--ds-shadow-md` — interactive cards on hover
- `--ds-shadow-lg` — modals, popovers
- `--ds-shadow-focus` — focus rings

---

## 6. Buttons

Component: `<Button variant="primary|secondary|ghost|danger" />`

| State | Behavior |
|-------|----------|
| Hover | Darker bg / stronger border |
| Pressed | `scale(0.98)` |
| Disabled | 45% opacity, no pointer |
| Loading | Spinner, text hidden |

Sizes: `sm` (36px), `md` (44px), `lg` (48px).

---

## 7. Cards

| Component | Purpose |
|-----------|---------|
| `DefaultCard` | Generic content container |
| `MetricCard` | KPI / dashboard numbers |
| `ActivityCard` | Feed items, notifications |
| `ClientCard` | Customer list rows |
| `SettingsCard` | Settings hub navigation |

All use `ds-card` base: white surface, 1px border, `--ds-shadow-xs`.

---

## 8. Inputs

| Component | Notes |
|-----------|-------|
| `Field` | Label + hint + error wrapper |
| `Input` | Text field with optional icons |
| `Select` | Native dropdown, RTL-aware chevron |
| `SearchInput` | `type="search"` with icon slot |
| `DateInput` / `TimeInput` | Native pickers |
| `Toggle` | On/off switch |
| `Checkbox` | Multi-select, forms |

Min touch target: 44px (`--ds-touch-target`).

---

## 9. Status chips

`<StatusChip variant="upcoming|completed|cancelled|paid|pending|vip" />`

Hebrew labels built-in. Generic `<Chip tone="…">` for custom labels.

---

## 10. Icons (Lucide)

Component: `<Icon icon={Calendar} size="md" tone="primary" />`

| Size | px |
|------|-----|
| xs | 14 |
| sm | 16 |
| md | 20 (default) |
| lg | 24 |
| xl | 28 |

**Rules:**
- UI chrome → `tone="muted"`
- Actions → `tone="primary"`
- Success states → `tone="success"`
- VIP / premium → `tone="accent"`
- Destructive → `tone="danger"`
- `strokeWidth={1.75}` default

---

## 11. Motion

Duration: **150–250ms** (`--ds-duration-fast` to `--ds-duration-slow`).

- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Utility classes: `.ds-animate-fade-in`, `.ds-animate-slide-up`, `.ds-transition`
- Respects `prefers-reduced-motion`

---

## 12. File structure

```
src/styles/design-system/
  tokens.css       — CSS custom properties
  typography.css   — .ds-display, .ds-h1, …
  motion.css       — animations
  components.css   — .ds-btn, .ds-card, …
  legacy-map.css   — maps old --color-* vars
  index.css        — entry import

src/design-system/
  cn.ts            — className helper
  tokens.ts        — JS token mirror

src/components/ds/
  Button, Text, Icon, Card, Input, StatusChip, index
```

## Migration plan

1. ✅ Design tokens + components (this PR)
2. ⏳ Screen-by-screen adoption (Dashboard → Activities → …)
3. ⏳ Remove `design-refresh.css` overrides once migrated
4. ⏳ Deprecate legacy `.btn`, `.card` in `global.css`

**Do not** mix legacy `.btn` with `ds-btn` on the same screen during migration — pick one layer per page.
