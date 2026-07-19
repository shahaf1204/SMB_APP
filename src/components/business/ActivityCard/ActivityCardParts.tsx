import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MapPin, User } from 'lucide-react';
import { cn } from '../../../design-system/cn';
import { Icon } from '../../ds/Icon';
import type { ActivityPaymentStatus, ActivityStatus } from './types';
import {
  activityStatusLabels,
  formatActivityAmount,
  paymentStatusLabels,
} from './types';

export function StatusBadge({
  status,
  label,
}: {
  status: ActivityStatus;
  label: string;
}) {
  return (
    <span className={cn('activity-card__badge', `activity-card__badge--status-${status}`)}>
      {label}
    </span>
  );
}

export function PaymentBadge({
  paymentStatus,
  label,
}: {
  paymentStatus: ActivityPaymentStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        'activity-card__badge',
        'activity-card__payment',
        `activity-card__badge--payment-${paymentStatus}`,
      )}
    >
      {label}
    </span>
  );
}

export function ContextualLabel({ children }: { children: string }) {
  return <span className="activity-card__contextual">{children}</span>;
}

export function UsageLabel({ children }: { children: string }) {
  return <span className="activity-card__usage">{children}</span>;
}

export function TimeAnchor({ children }: { children: string }) {
  return (
    <span className="activity-card__time-anchor" dir="ltr">
      {children}
    </span>
  );
}

export function CardHeader({
  id,
  title,
  activityTypeLabel,
  TypeIcon,
  isHero,
  clientName,
  showClientInHeader,
}: {
  id: string;
  title: string;
  activityTypeLabel?: string | null;
  TypeIcon: LucideIcon;
  isHero: boolean;
  clientName?: string | null;
  showClientInHeader?: boolean;
}) {
  return (
    <header className="activity-card__header">
      <span className="activity-card__type-icon" aria-hidden>
        <TypeIcon size={isHero ? 20 : 18} strokeWidth={1.65} />
      </span>
      <div className="activity-card__head-main">
        {activityTypeLabel && (
          <span className="activity-card__type-label">{activityTypeLabel}</span>
        )}
        <h3 id={`activity-card-title-${id}`} className="activity-card__title">
          {title}
        </h3>
        {showClientInHeader && clientName && (
          <span className="activity-card__client-header">{clientName}</span>
        )}
      </div>
    </header>
  );
}

export function MetaRow({
  icon,
  children,
  wrap,
  dir,
  subtle,
  emphasis,
  className,
}: {
  icon: LucideIcon;
  children: string;
  wrap?: boolean;
  dir?: 'ltr' | 'rtl';
  subtle?: boolean;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'activity-card__meta-row',
        subtle && 'activity-card__meta-row--subtle',
        emphasis && 'activity-card__meta-row--emphasis',
        className,
      )}
    >
      <Icon icon={icon} size="sm" tone="muted" className="activity-card__meta-icon" strokeWidth={1.5} />
      <span
        dir={dir}
        className={cn(
          'activity-card__meta-text',
          wrap && 'activity-card__meta-text--wrap',
        )}
      >
        {children}
      </span>
    </div>
  );
}

export function EmphasizedSchedule({
  dateLabel,
  timeLabel,
  locationLabel,
  showLocation,
}: {
  dateLabel?: string | null;
  timeLabel?: string | null;
  locationLabel?: string | null;
  showLocation: boolean;
}) {
  if (!dateLabel && !timeLabel && !(showLocation && locationLabel)) return null;

  return (
    <div className="activity-card__schedule">
      {(dateLabel || timeLabel) && (
        <div className="activity-card__schedule-primary">
          {dateLabel && <span>{dateLabel}</span>}
          {dateLabel && timeLabel && (
            <span className="activity-card__meta-sep" aria-hidden> · </span>
          )}
          {timeLabel && (
            <span className="activity-card__schedule-time" dir="ltr">
              {timeLabel}
            </span>
          )}
        </div>
      )}
      {showLocation && locationLabel && (
        <MetaRow icon={MapPin} subtle wrap>
          {locationLabel}
        </MetaRow>
      )}
    </div>
  );
}

export function ClientRow({ clientName }: { clientName: string }) {
  return (
    <MetaRow icon={User} className="activity-card__meta-row--client">
      {clientName}
    </MetaRow>
  );
}

export function FinancialRow({
  amount,
  currency,
  paymentStatus,
  paymentStatusLabel,
  emphasis = 'default',
}: {
  amount?: number | string | null;
  currency: string;
  paymentStatus?: ActivityPaymentStatus | null;
  paymentStatusLabel?: string;
  emphasis?: 'default' | 'compact' | 'hero' | 'value';
}) {
  const hasAmount = amount != null && amount !== '';
  if (!hasAmount && !paymentStatus) return null;

  return (
    <div
      className={cn(
        'activity-card__financial',
        emphasis !== 'default' && `activity-card__financial--${emphasis}`,
      )}
    >
      {hasAmount && (
        <span className="activity-card__amount">
          {formatActivityAmount(amount!, currency)}
        </span>
      )}
      {paymentStatus && (
        <PaymentBadge
          paymentStatus={paymentStatus}
          label={paymentStatusLabel ?? paymentStatusLabels[paymentStatus]}
        />
      )}
    </div>
  );
}

export function StatusSection({
  status,
  stage,
  statusLabel,
}: {
  status?: ActivityStatus | null;
  stage?: string | null;
  statusLabel?: string;
}) {
  if (!status && !stage) return null;

  return (
    <div className="activity-card__status-row">
      {status && (
        <StatusBadge
          status={status}
          label={statusLabel ?? activityStatusLabels[status]}
        />
      )}
      {stage && <span className="activity-card__stage">{stage}</span>}
    </div>
  );
}

export function StageHighlight({ stage }: { stage: string }) {
  return <span className="activity-card__stage-highlight">{stage}</span>;
}

export function ProgressBlock({
  progressPercent,
  progressLabel,
  progressDetail,
  tone = 'default',
}: {
  progressPercent?: number | null;
  progressLabel?: string | null;
  progressDetail?: string | null;
  tone?: 'default' | 'journey' | 'usage' | 'project';
}) {
  const label = progressDetail ?? progressLabel;
  const clampedPercent =
    progressPercent != null
      ? Math.min(100, Math.max(0, progressPercent))
      : null;

  if (!label && clampedPercent == null) return null;

  return (
    <div className={cn('activity-card__progress', tone !== 'default' && `activity-card__progress--${tone}`)}>
      {label && <span className="activity-card__progress-label">{label}</span>}
      {clampedPercent != null && (
        <div
          className="activity-card__progress-track"
          role="progressbar"
          aria-valuenow={clampedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label ?? undefined}
        >
          <div
            className="activity-card__progress-fill"
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function TagsSection({ tags }: { tags: string[] }) {
  if (!tags.length) return null;

  return (
    <div className="activity-card__tags">
      {tags.map((tag) => (
        <span key={tag} className="activity-card__tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

export function NextAction({ children }: { children: string }) {
  return <p className="activity-card__next-action">{children}</p>;
}

export function RecurrenceRow({
  recurrenceLabel,
  nextOccurrenceLabel,
}: {
  recurrenceLabel?: string | null;
  nextOccurrenceLabel?: string | null;
}) {
  if (!recurrenceLabel && !nextOccurrenceLabel) return null;

  return (
    <div className="activity-card__recurrence">
      {recurrenceLabel && (
        <span className="activity-card__recurrence-pattern">{recurrenceLabel}</span>
      )}
      {nextOccurrenceLabel && (
        <span className="activity-card__recurrence-next">
          המפגש הבא: <span dir="ltr">{nextOccurrenceLabel}</span>
        </span>
      )}
    </div>
  );
}

export function InlineMeta({
  parts,
}: {
  parts: Array<{ text: string; dir?: 'ltr' | 'rtl'; className?: string }>;
}) {
  const visible = parts.filter((p) => p.text);
  if (!visible.length) return null;

  return (
    <div className="activity-card__meta-inline">
      {visible.map((part, index) => (
        <span key={`${part.text}-${index}`}>
          {index > 0 && (
            <span className="activity-card__meta-sep" aria-hidden> · </span>
          )}
          <span className={part.className} dir={part.dir}>
            {part.text}
          </span>
        </span>
      ))}
    </div>
  );
}

export function AppointmentCompactBody({
  id,
  title,
  timeLabel,
  clientName,
  dateLabel,
  TypeIcon,
  activityTypeLabel,
}: {
  id: string;
  title: string;
  timeLabel?: string | null;
  clientName?: string | null;
  dateLabel?: string | null;
  TypeIcon: LucideIcon;
  activityTypeLabel?: string | null;
}) {
  return (
    <div className="activity-card__appointment-compact">
      {timeLabel && <TimeAnchor>{timeLabel}</TimeAnchor>}
      <div className="activity-card__appointment-body">
        <div className="activity-card__header activity-card__header--inline">
          <span className="activity-card__type-icon" aria-hidden>
            <TypeIcon size={16} strokeWidth={1.65} />
          </span>
          <div className="activity-card__head-main">
            {activityTypeLabel && (
              <span className="activity-card__type-label">{activityTypeLabel}</span>
            )}
            <h3 id={`activity-card-title-${id}`} className="activity-card__title">
              {title}
            </h3>
          </div>
        </div>
        <InlineMeta
          parts={[
            { text: clientName ?? '', className: 'activity-card__client-inline' },
            { text: dateLabel ?? '', className: 'activity-card__meta-secondary' },
          ]}
        />
      </div>
    </div>
  );
}

export function MetaGroup({ children }: { children: ReactNode }) {
  return <div className="activity-card__meta">{children}</div>;
}
