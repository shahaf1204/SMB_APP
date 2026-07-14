import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { iconSize } from '../../design-system/tokens';
import { cn } from '../../design-system/cn';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Required for accessibility */
  'aria-label': string;
}

export function IconButton({
  icon: LucideIcon,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const px = size === 'sm' ? iconSize.sm : size === 'lg' ? iconSize.xl : iconSize.md;

  return (
    <button
      type={type}
      className={cn(
        'ds-icon-btn',
        `ds-icon-btn--${variant}`,
        size !== 'md' && `ds-icon-btn--${size}`,
        className,
      )}
      {...rest}
    >
      <LucideIcon size={px} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
