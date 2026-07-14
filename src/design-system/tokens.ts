/**
 * Design system tokens — JS/TS mirror of tokens.css
 */

export const brand = {
  primary: '#4F46E5',
  success: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
} as const;

export const semantic = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const;

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
} as const;

export const shadow = {
  xs: 'var(--ds-shadow-xs)',
  sm: 'var(--ds-shadow-sm)',
  md: 'var(--ds-shadow-md)',
  lg: 'var(--ds-shadow-lg)',
  xl: 'var(--ds-shadow-xl)',
} as const;

export const motion = {
  fast: '150ms',
  base: '200ms',
  slow: '250ms',
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

/** Lucide icon sizes in px */
export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type StatusChipVariant =
  | 'upcoming'
  | 'completed'
  | 'cancelled'
  | 'paid'
  | 'pending'
  | 'vip'
  | 'today'
  | 'tomorrow'
  | 'this-week';

export const statusChipLabels: Record<StatusChipVariant, string> = {
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
