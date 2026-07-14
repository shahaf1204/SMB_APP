import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Icon } from './Icon';
import { Text } from './Text';
import { cn } from '../../design-system/cn';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  /** Primary description text */
  description?: string;
  /** @deprecated Use description */
  message?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * Unified empty state — icon, title, explanation, primary CTA.
 */
export function EmptyState({
  icon,
  title,
  description,
  message,
  actionLabel,
  actionTo,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  const body = description ?? message;

  return (
    <div className={cn('ds-empty', className)}>
      <span className="ds-empty__icon" aria-hidden>
        <Icon icon={icon} size="xl" tone="muted" strokeWidth={1.5} />
      </span>
      <Text variant="h3" as="h3" className="ds-empty__title">
        {title}
      </Text>
      {body && (
        <Text variant="small" tone="muted" className="ds-empty__desc">
          {body}
        </Text>
      )}
      {children}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="ds-empty__action">
          <Button variant="primary">{actionLabel}</Button>
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <Button variant="primary" className="ds-empty__action" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
