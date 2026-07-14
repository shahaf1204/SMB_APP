import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { iconSize } from '../../design-system/tokens';
import { cn } from '../../design-system/cn';

export type IconButtonVariant = 'primary' | 'secondary' | 'outline';

export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Required for accessibility */
  'aria-label': string;
}

/** Icon button — fourth button style in the design system */
export function IconButton({
  icon: LucideIcon,
  variant = 'outline',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const px = size === 'sm' ? iconSize.sm : size === 'lg' ? iconSize.lg : iconSize.md;

  return (
    <button
      type={type}
      className={cn(
        'ds-btn',
        'ds-btn--icon',
        `ds-btn--icon-${variant}`,
        size !== 'md' && `ds-btn--icon-${size}`,
        className,
      )}
      {...rest}
    >
      <LucideIcon size={px} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
