import { cn } from '../../design-system/cn';

export interface DividerProps {
  className?: string;
  /** Accessible label when divider conveys meaning */
  label?: string;
}

/** Subtle section divider */
export function Divider({ className, label }: DividerProps) {
  if (label) {
    return (
      <div className={cn('ds-divider-wrap', className)} role="separator">
        <hr className="ds-divider" aria-hidden />
        <span className="ds-divider__label">{label}</span>
        <hr className="ds-divider" aria-hidden />
      </div>
    );
  }

  return <hr className={cn('ds-divider', className)} aria-hidden />;
}
