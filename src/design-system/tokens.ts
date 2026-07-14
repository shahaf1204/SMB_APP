/**
 * Design system tokens — JS/TS mirror
 */

export const brand = {
  primary: '#4F46E5',
  success: '#10B981',
  accent: '#F97316',
} as const;

export const semantic = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
} as const;

/** 8pt spacing: 4 · 8 · 16 · 24 · 32 */
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const;

export const radius = {
  card: '16px',
  button: '14px',
  badge: '999px',
  input: '12px',
} as const;

export const shadow = {
  xs: 'var(--ds-shadow-xs)',
  sm: 'var(--ds-shadow-sm)',
  md: 'var(--ds-shadow-md)',
  lg: 'var(--ds-shadow-lg)',
} as const;

export const motion = {
  fast: '120ms',
  base: '180ms',
  slow: '220ms',
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/** Canonical status badge semantics */
export type BadgeStatus =
  | 'success'
  | 'waiting'
  | 'upcoming'
  | 'completed'
  | 'cancelled';

/** Extended variants (map to canonical status) */
export type BadgeVariant =
  | BadgeStatus
  | 'paid'
  | 'pending'
  | 'vip'
  | 'today'
  | 'tomorrow'
  | 'this-week';

export const badgeLabels: Record<BadgeVariant, string> = {
  success: 'הצלחה',
  waiting: 'ממתין',
  upcoming: 'בקרוב',
  completed: 'הושלם',
  cancelled: 'בוטל',
  paid: 'שולם',
  pending: 'ממתין',
  vip: 'VIP',
  today: 'היום',
  tomorrow: 'מחר',
  'this-week': 'השבוע',
};

export function resolveBadgeStatus(variant: BadgeVariant): BadgeStatus {
  switch (variant) {
    case 'success':
    case 'paid':
      return 'success';
    case 'waiting':
    case 'pending':
    case 'vip':
      return 'waiting';
    case 'upcoming':
    case 'today':
    case 'tomorrow':
    case 'this-week':
      return 'upcoming';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'upcoming';
  }
}

/** @deprecated Use BadgeVariant */
export type StatusChipVariant = BadgeVariant;

/** @deprecated Use badgeLabels */
export const statusChipLabels = badgeLabels;
