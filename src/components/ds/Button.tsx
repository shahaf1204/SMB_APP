import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../design-system/cn';

/** Primary · Secondary · Outline · Icon (via IconButton) */
export type ButtonVariant = 'primary' | 'secondary' | 'outline';

/** @deprecated Use outline */
export type LegacyButtonVariant = 'ghost' | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | LegacyButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const resolvedVariant = variant === 'ghost' ? 'outline' : variant;

  return (
    <button
      type={type}
      className={cn(
        'ds-btn',
        `ds-btn--${resolvedVariant}`,
        size !== 'md' && `ds-btn--${size}`,
        fullWidth && 'ds-btn--full',
        loading && 'ds-btn--loading',
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="ds-btn__spinner" aria-hidden />}
      {children}
    </button>
  );
}
