import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  Pencil,
  Phone,
  User,
} from 'lucide-react';
import { cn } from '../../../design-system/cn';
import { Icon } from '../../ds/Icon';
import type {
  ActivityCardProps,
  ActivityPaymentStatus,
  ActivityQuickAction,
  ActivityQuickActionType,
  ActivityStatus,
} from './types';
import {
  activityStatusLabels,
  formatActivityAmount,
  hasProgressData,
  paymentStatusLabels,
} from './types';
import './activity-card.css';

const QUICK_ACTION_ICONS: Record<ActivityQuickActionType, LucideIcon> = {
  call: Phone,
  navigate: MapPin,
  edit: Pencil,
  invoice: FileText,
  open: ExternalLink,
};

const STATUS_TONE: Record<ActivityStatus, string> = {
  new: 'new',
  active: 'active',
  waiting: 'waiting',
  completed: 'completed',
  cancelled: 'cancelled',
  needs_attention: 'needs_attention',
};

function StatusBadge({
  status,
  label,
}: {
  status: ActivityStatus;
  label: string;
}) {
  return (
    <span
      className={cn('activity-card__badge', `activity-card__badge--status-${status}`)}
    >
      {label}
    </span>
  );
}

function PaymentBadge({
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

function MetaRow({
  icon,
  children,
  wrap,
  dir,
}: {
  icon: LucideIcon;
  children: string;
  wrap?: boolean;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className="activity-card__meta-row">
      <Icon icon={icon} size="sm" tone="muted" className="activity-card__meta-icon" />
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

function QuickActions({ actions }: { actions: ActivityQuickAction[] }) {
  if (!actions.length) return null;

  return (
    <div className="activity-card__actions" role="group" aria-label="פעולות מהירות">
      {actions.map((action) => {
        const ActionIcon = QUICK_ACTION_ICONS[action.type];
        return (
          <button
            key={`${action.type}-${action.label}`}
            type="button"
            className="activity-card__action"
            aria-label={action.label}
            title={action.label}
            onClick={(event) => {
              event.stopPropagation();
              action.onClick();
            }}
          >
            <ActionIcon size={20} strokeWidth={1.75} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

function ProgressBlock({
  progressPercent,
  progressLabel,
}: {
  progressPercent?: number | null;
  progressLabel?: string | null;
}) {
  const clampedPercent =
    progressPercent != null
      ? Math.min(100, Math.max(0, progressPercent))
      : null;

  return (
    <div className="activity-card__progress">
      {progressLabel && (
        <span className="activity-card__progress-label">{progressLabel}</span>
      )}
      {clampedPercent != null && (
        <div
          className="activity-card__progress-track"
          role="progressbar"
          aria-valuenow={clampedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={progressLabel ?? undefined}
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

/**
 * Generic ActivityCard — represents any service-business activity type.
 * Display-only; does not fetch data. See docs/design-system.md §11.
 */
export function ActivityCard({
  id,
  title,
  variant,
  activityTypeLabel,
  activityTypeIcon,
  clientName,
  dateLabel,
  timeLabel,
  locationLabel,
  amount,
  currency = '₪',
  status,
  stage,
  paymentStatus,
  progressPercent,
  progressLabel,
  tags,
  onClick,
  quickActions,
  statusLabel,
  paymentStatusLabel,
  className,
}: ActivityCardProps) {
  const isCompact = variant === 'compact';
  const isHero = variant === 'hero';
  const isTimeline = variant === 'timeline';
  const showProgress =
    !isCompact && hasProgressData(progressPercent, progressLabel);
  const showLocation = !isCompact && Boolean(locationLabel);
  const showTags = Boolean(tags?.length);
  const showQuickActions = Boolean(quickActions?.length);
  const showFinancial =
    (amount != null && amount !== '') || Boolean(paymentStatus);
  const toneClass = status ? STATUS_TONE[status] : undefined;

  const TypeIcon = activityTypeIcon ?? Calendar;

  const metaInline = isCompact && (clientName || dateLabel || timeLabel);

  const content = (
    <>
      <header className="activity-card__header">
        <span className="activity-card__type-icon" aria-hidden>
          <TypeIcon size={isHero ? 22 : 20} strokeWidth={1.75} />
        </span>
        <div className="activity-card__head-main">
          {activityTypeLabel && (
            <span className="activity-card__type-label">{activityTypeLabel}</span>
          )}
          <h3 id={`activity-card-title-${id}`} className="activity-card__title">
            {title}
          </h3>
          {(status || stage) && (
            <div className="activity-card__badges">
              {status && (
                <StatusBadge
                  status={status}
                  label={statusLabel ?? activityStatusLabels[status]}
                />
              )}
              {stage && (
                <span className="activity-card__stage">{stage}</span>
              )}
            </div>
          )}
        </div>
      </header>

      {(clientName || dateLabel || timeLabel || showLocation) && (
        <div className="activity-card__meta">
          {metaInline ? (
            <div className="activity-card__meta-inline">
              {clientName && <span>{clientName}</span>}
              {clientName && (dateLabel || timeLabel) && (
                <span className="activity-card__meta-sep" aria-hidden>
                  ·
                </span>
              )}
              {dateLabel && <span>{dateLabel}</span>}
              {dateLabel && timeLabel && (
                <span className="activity-card__meta-sep" aria-hidden>
                  ·
                </span>
              )}
              {timeLabel && <span dir="ltr">{timeLabel}</span>}
            </div>
          ) : (
            <>
              {clientName && <MetaRow icon={User}>{clientName}</MetaRow>}
              {dateLabel && <MetaRow icon={Calendar}>{dateLabel}</MetaRow>}
              {timeLabel && (
                <MetaRow icon={Clock} dir="ltr">
                  {timeLabel}
                </MetaRow>
              )}
              {showLocation && locationLabel && (
                <MetaRow icon={MapPin} wrap>
                  {locationLabel}
                </MetaRow>
              )}
            </>
          )}
        </div>
      )}

      {showFinancial && (
        <div className="activity-card__financial">
          {amount != null && amount !== '' && (
            <span className="activity-card__amount">
              {formatActivityAmount(amount, currency)}
            </span>
          )}
          {paymentStatus && (
            <PaymentBadge
              paymentStatus={paymentStatus}
              label={paymentStatusLabel ?? paymentStatusLabels[paymentStatus]}
            />
          )}
        </div>
      )}

      {showProgress && (
        <ProgressBlock
          progressPercent={progressPercent}
          progressLabel={progressLabel}
        />
      )}

      {showTags && (
        <div className="activity-card__tags">
          {tags!.map((tag) => (
            <span key={tag} className="activity-card__tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </>
  );

  const surfaceProps = onClick
    ? {
        type: 'button' as const,
        onClick,
        'aria-labelledby': `activity-card-title-${id}`,
      }
    : {};

  return (
    <article
      className={cn(
        'activity-card',
        `activity-card--${variant}`,
        onClick && 'activity-card--interactive',
        toneClass && `activity-card--tone-${toneClass}`,
        className,
      )}
      data-activity-id={id}
    >
      {isTimeline && (
        <div className="activity-card__timeline-rail" aria-hidden>
          <span className="activity-card__timeline-dot" />
          <span className="activity-card__timeline-line" />
        </div>
      )}

      <div className="activity-card__inner">
        <div className="activity-card__shell">
          {onClick ? (
            <button className="activity-card__surface" {...surfaceProps}>
              {content}
            </button>
          ) : (
            <div className="activity-card__surface">{content}</div>
          )}

          {showQuickActions && (
            <QuickActions actions={quickActions!} />
          )}
        </div>
      </div>
    </article>
  );
}

export type { ActivityCardProps } from './types';
export * from './types';
