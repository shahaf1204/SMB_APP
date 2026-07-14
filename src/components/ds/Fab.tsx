import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { iconSize } from '../../design-system/tokens';
import { cn } from '../../design-system/cn';

export type FabPlacement = 'bottom-end' | 'bottom-center';

export interface FabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label?: ReactNode;
  placement?: FabPlacement;
  /** Required for accessibility */
  'aria-label': string;
}

export function Fab({
  icon: LucideIcon,
  label,
  placement = 'bottom-end',
  className,
  type = 'button',
  ...rest
}: FabProps) {
  const extended = label != null;

  return (
    <button
      type={type}
      className={cn(
        'ds-fab',
        extended && 'ds-fab--extended',
        placement === 'bottom-end' && 'ds-fab--bottom-end',
        placement === 'bottom-center' && 'ds-fab--bottom-center',
        className,
      )}
      {...rest}
    >
      <LucideIcon size={iconSize.lg} strokeWidth={2} aria-hidden />
      {extended && <span>{label}</span>}
    </button>
  );
}
