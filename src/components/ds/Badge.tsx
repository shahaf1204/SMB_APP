import type { BadgeVariant } from '../../design-system/tokens';
import { badgeLabels, resolveBadgeStatus } from '../../design-system/tokens';
import { cn } from '../../design-system/cn';

export interface BadgeProps {
  /** Canonical or legacy variant — maps to unified status color */
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

/**
 * Unified badge for all status labels across the app.
 * Success · Waiting · Upcoming · Completed · Cancelled
 */
export function Badge({ variant, label, className }: BadgeProps) {
  const status = resolveBadgeStatus(variant);

  return (
    <span className={cn('ds-badge', `ds-badge--${status}`, className)}>
      {label ?? badgeLabels[variant]}
    </span>
  );
}

/** @deprecated Use Badge */
export const StatusChip = Badge;

/** @deprecated Use Badge */
export const Chip = Badge;

export type { BadgeVariant as StatusChipProps_variant };
