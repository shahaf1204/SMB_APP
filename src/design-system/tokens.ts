/**
 * Design system tokens — JS/TS access mirror of tokens.css
 * Use for logic, charts, and dynamic styling only.
 * Prefer CSS variables in components.
 */

export const brand = {
  primary: '#2563eb',
  success: '#059669',
  accent: '#7c3aed',
} as const;

export const neutral = {
  0: '#ffffff',
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
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
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  full: '9999px',
} as const;

export const motion = {
  fast: '150ms',
  base: '200ms',
  slow: '250ms',
} as const;

export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

export type StatusChipVariant =
  | 'upcoming'
  | 'completed'
  | 'cancelled'
  | 'paid'
  | 'pending'
  | 'vip';

export const statusChipLabels: Record<StatusChipVariant, string> = {
  upcoming: 'בקרוב',
  completed: 'הושלם',
  cancelled: 'בוטל',
  paid: 'שולם',
  pending: 'ממתין',
  vip: 'VIP',
};
