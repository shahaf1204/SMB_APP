import type { LucideIcon } from 'lucide-react';
import { iconSize } from '../../design-system/tokens';
import { cn } from '../../design-system/cn';

export type IconSize = keyof typeof iconSize;
export type IconTone = 'default' | 'muted' | 'primary' | 'success' | 'accent' | 'danger' | 'inverse';

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  tone?: IconTone;
  strokeWidth?: number;
  className?: string;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
}

const toneClass: Record<IconTone, string | undefined> = {
  default: undefined,
  muted: 'ds-icon--muted',
  primary: 'ds-icon--primary',
  success: 'ds-icon--success',
  accent: 'ds-icon--accent',
  danger: 'ds-icon--danger',
  inverse: 'ds-icon--inverse',
};

export function Icon({
  icon: LucideComponent,
  size = 'md',
  tone = 'default',
  strokeWidth = 1.75,
  className,
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
}: IconProps) {
  const px = iconSize[size];

  return (
    <span
      className={cn('ds-icon', toneClass[tone], className)}
      aria-hidden={ariaLabel ? undefined : ariaHidden}
      aria-label={ariaLabel}
    >
      <LucideComponent size={px} strokeWidth={strokeWidth} />
    </span>
  );
}
