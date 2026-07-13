import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../design-system/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
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

  return (
    <button
      type={type}
      className={cn(
        'ds-btn',
        `ds-btn--${variant}`,
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
