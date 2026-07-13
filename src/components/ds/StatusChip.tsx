import type { StatusChipVariant } from '../../design-system/tokens';
import { statusChipLabels } from '../../design-system/tokens';
import { cn } from '../../design-system/cn';

export interface StatusChipProps {
  variant: StatusChipVariant;
  label?: string;
  className?: string;
}

export function StatusChip({ variant, label, className }: StatusChipProps) {
  return (
    <span className={cn('ds-chip', `ds-chip--${variant}`, className)}>
      {label ?? statusChipLabels[variant]}
    </span>
  );
}

/** Generic chip for custom labels / tones */
export type ChipTone = 'neutral' | 'primary' | 'success' | 'accent' | 'warning' | 'danger';

export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span className={cn('ds-chip', `ds-chip--${tone}`, className)}>
      {children}
    </span>
  );
}
