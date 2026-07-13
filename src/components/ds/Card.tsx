import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../design-system/cn';

export interface CardProps {
  children?: ReactNode;
  className?: string;
  interactive?: boolean;
  href?: string;
  to?: string;
  onClick?: () => void;
}

function CardShell({
  children,
  className,
  interactive,
  href,
  to,
  onClick,
}: CardProps) {
  const classes = cn('ds-card', interactive && 'ds-card--interactive', className);

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}

export function DefaultCard({
  children,
  header,
  footer,
  className,
  ...shell
}: CardProps & { header?: ReactNode; footer?: ReactNode }) {
  return (
    <CardShell className={className} {...shell}>
      {header && <div className="ds-card__header">{header}</div>}
      <div className="ds-card__body">{children}</div>
      {footer && <div className="ds-card__footer">{footer}</div>}
    </CardShell>
  );
}

export type MetricTone = 'primary' | 'success' | 'accent';

export function MetricCard({
  label,
  value,
  hint,
  icon,
  tone = 'primary',
  className,
  ...shell
}: CardProps & {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: MetricTone;
}) {
  return (
    <CardShell className={className} {...shell}>
      <div className="ds-metric-card">
        {icon && (
          <span className={cn('ds-metric-card__icon', `ds-metric-card__icon--${tone}`)}>
            {icon}
          </span>
        )}
        <span className="ds-metric-card__label">{label}</span>
        <span className="ds-metric-card__value">{value}</span>
        {hint && <span className="ds-metric-card__hint">{hint}</span>}
      </div>
    </CardShell>
  );
}

export function ActivityCard({
  title,
  meta,
  aside,
  icon,
  className,
  ...shell
}: CardProps & {
  title: string;
  meta?: string;
  aside?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <CardShell className={className} {...shell}>
      <div className="ds-activity-card">
        {icon && <span className="ds-activity-card__icon">{icon}</span>}
        <div className="ds-activity-card__content">
          <p className="ds-activity-card__title">{title}</p>
          {meta && <p className="ds-activity-card__meta">{meta}</p>}
        </div>
        {aside && <span className="ds-activity-card__aside">{aside}</span>}
      </div>
    </CardShell>
  );
}

export function ClientCard({
  name,
  contact,
  meta,
  revenue,
  avatar,
  side,
  className,
  ...shell
}: CardProps & {
  name: string;
  contact?: string;
  meta?: string;
  revenue?: string;
  avatar?: ReactNode;
  side?: ReactNode;
}) {
  return (
    <CardShell className={className} {...shell}>
      <div className="ds-client-card">
        {avatar && <span className="ds-client-card__avatar">{avatar}</span>}
        <div className="ds-client-card__body">
          <p className="ds-client-card__name">{name}</p>
          {contact && <p className="ds-client-card__contact">{contact}</p>}
          {meta && <p className="ds-client-card__meta">{meta}</p>}
        </div>
        <div className="ds-client-card__side">
          {revenue && <span className="ds-client-card__revenue">{revenue}</span>}
          {side}
        </div>
      </div>
    </CardShell>
  );
}

export function SettingsCard({
  title,
  description,
  icon,
  className,
  ...shell
}: CardProps & {
  title: string;
  description?: string;
  icon: ReactNode;
}) {
  return (
    <CardShell className={className} interactive {...shell}>
      <div className="ds-settings-card">
        <span className="ds-settings-card__icon">{icon}</span>
        <div className="ds-settings-card__body">
          <p className="ds-settings-card__title">{title}</p>
          {description && <p className="ds-settings-card__desc">{description}</p>}
        </div>
        <span className="ds-settings-card__chevron" aria-hidden>
          <ChevronLeft size={20} strokeWidth={1.75} />
        </span>
      </div>
    </CardShell>
  );
}

export function Avatar({
  initials,
  size = 'md',
  className,
}: {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <span className={cn('ds-avatar', `ds-avatar--${size}`, className)}>
      {initials}
    </span>
  );
}
