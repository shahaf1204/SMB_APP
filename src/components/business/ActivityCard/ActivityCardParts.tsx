import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../design-system/cn';
import type { ActivityPaymentStatus, ActivityStatus } from './types';
import {
  activityStatusLabels,
  formatActivityAmount,
  paymentStatusLabels,
} from './types';

/* ── Shared v2 anatomy — composable sections ── */

/** A. Context row — subtle semantic label */
export function ContextHeader({
  children,
  tone = 'default',
}: {
  children: string;
  tone?: 'default' | 'urgent' | 'muted' | 'accent';
}) {
  return (
    <p className={cn('activity-card__context', `activity-card__context--${tone}`)}>
      {children}
    </p>
  );
}

/** B. Title row — icon supports recognition, title dominates */
export function TitleRow({
  id,
  title,
  TypeIcon,
  isHero,
  isCompact,
}: {
  id: string;
  title: string;
  TypeIcon: LucideIcon;
  isHero?: boolean;
  isCompact?: boolean;
}) {
  const iconSize = isCompact ? 15 : isHero ? 17 : 16;

  return (
    <header className="activity-card__title-row">
      <span className="activity-card__icon" aria-hidden>
        <TypeIcon size={iconSize} strokeWidth={1.75} />
      </span>
      <h3
        id={`activity-card-title-${id}`}
        className={cn(
          'activity-card__title',
          isHero && 'activity-card__title--hero',
          isCompact && 'activity-card__title--compact',
        )}
      >
        {title}
      </h3>
    </header>
  );
}

/** C. Client / relationship */
export function ClientLine({ children }: { children: string }) {
  return <p className="activity-card__client">{children}</p>;
}

/** D. Primary operational metadata — typography, no boxes */
export function MetaLine({
  children,
  emphasis,
  muted,
  dir,
}: {
  children: ReactNode;
  emphasis?: boolean;
  muted?: boolean;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <p
      className={cn(
        'activity-card__meta-line',
        emphasis && 'activity-card__meta-line--emphasis',
        muted && 'activity-card__meta-line--muted',
      )}
      dir={dir}
    >
      {children}
    </p>
  );
}

export function MetaCompound({
  parts,
}: {
  parts: Array<{ text: string; dir?: 'ltr' | 'rtl'; muted?: boolean; emphasis?: boolean }>;
}) {
  const visible = parts.filter((p) => p.text);
  if (!visible.length) return null;

  return (
    <p className="activity-card__meta-line">
      {visible.map((part, index) => (
        <span key={`${part.text}-${index}`}>
          {index > 0 && <span className="activity-card__sep" aria-hidden> · </span>}
          <span
            className={cn(
              part.muted && 'activity-card__meta-line--muted',
              part.emphasis && 'activity-card__meta-line--emphasis',
            )}
            dir={part.dir}
          >
            {part.text}
          </span>
        </span>
      ))}
    </p>
  );
}

/** Appointment time anchor — compact contextual emphasis */
export function TimeAnchor({ children, compact }: { children: string; compact?: boolean }) {
  return (
    <p
      className={cn('activity-card__time-anchor', compact && 'activity-card__time-anchor--compact')}
      dir="ltr"
    >
      {children}
    </p>
  );
}

/** E + F. Financial value + operational / payment status */
export function StatusPill({
  status,
  label,
}: {
  status: ActivityStatus;
  label: string;
}) {
  return (
    <span className={cn('activity-card__pill', `activity-card__pill--status-${status}`)}>
      <span className="activity-card__pill-dot" aria-hidden />
      {label}
    </span>
  );
}

export function PaymentPill({
  paymentStatus,
  label,
}: {
  paymentStatus: ActivityPaymentStatus;
  label: string;
}) {
  return (
    <span
      className={cn(
        'activity-card__pill',
        'activity-card__pill--payment',
        `activity-card__pill--payment-${paymentStatus}`,
      )}
    >
      <span className="activity-card__pill-dot" aria-hidden />
      {label}
    </span>
  );
}

export function FinancialStatusRow({
  amount,
  currency,
  status,
  paymentStatus,
  statusLabel,
  paymentStatusLabel,
  stage,
  invertPills,
}: {
  amount?: number | string | null;
  currency: string;
  status?: ActivityStatus | null;
  paymentStatus?: ActivityPaymentStatus | null;
  statusLabel?: string;
  paymentStatusLabel?: string;
  /** Workflow stage as plain text when no operational status */
  stage?: string | null;
  /** Payment before operational — recurring example */
  invertPills?: boolean;
}) {
  const hasAmount = amount != null && amount !== '';
  if (!hasAmount && !status && !paymentStatus && !stage) return null;

  const operational = status ? (
    <StatusPill
      status={status}
      label={statusLabel ?? activityStatusLabels[status]}
    />
  ) : stage ? (
    <span className="activity-card__stage-text">{stage}</span>
  ) : null;

  const payment = paymentStatus ? (
    <PaymentPill
      paymentStatus={paymentStatus}
      label={paymentStatusLabel ?? paymentStatusLabels[paymentStatus]}
    />
  ) : null;

  const pills = invertPills ? (
    <>
      {payment}
      {operational}
    </>
  ) : (
    <>
      {operational}
      {payment}
    </>
  );

  return (
    <div className="activity-card__financial-row">
      {hasAmount && (
        <span className="activity-card__amount">
          {formatActivityAmount(amount!, currency)}
        </span>
      )}
      {(operational || payment) && (
        <div className="activity-card__pill-group">{pills}</div>
      )}
    </div>
  );
}

/** F. Progress — meaningful label + optional thin bar */
export function ProgressSection({
  detail,
  percent,
  showBar = true,
  tone = 'default',
}: {
  detail?: string | null;
  percent?: number | null;
  showBar?: boolean;
  tone?: 'default' | 'journey' | 'usage' | 'project' | 'event';
}) {
  const clamped =
    percent != null ? Math.min(100, Math.max(0, percent)) : null;

  if (!detail && clamped == null) return null;

  return (
    <div className={cn('activity-card__progress', tone !== 'default' && `activity-card__progress--${tone}`)}>
      {detail && <span className="activity-card__progress-detail">{detail}</span>}
      {showBar && clamped != null && (
        <div
          className="activity-card__progress-track"
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={detail ?? undefined}
        >
          <div
            className="activity-card__progress-fill"
            style={{ width: `${clamped}%` }}
          />
        </div>
      )}
    </div>
  );
}

/** F. Next action / milestone */
export function NextActionLine({ children }: { children: string }) {
  return <p className="activity-card__next">{children}</p>;
}

/** Optional tags — max enforced by parent */
export function TagRow({ tags }: { tags: string[] }) {
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

/** Shared body wrapper — consistent vertical rhythm */
export function CardBody({ children }: { children: ReactNode }) {
  return <div className="activity-card__body">{children}</div>;
}

/* ── Legacy aliases kept for gradual migration inside layouts ── */

export const ContextualLabel = ContextHeader;
export const UsageLabel = ContextHeader;
export const CardHeader = TitleRow;
export const ClientRow = ClientLine;
export const NextAction = NextActionLine;
export const TagsSection = TagRow;

export function StageHighlight({ stage }: { stage: string }) {
  return <MetaLine emphasis>{stage}</MetaLine>;
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
    <div className="activity-card__pill-group activity-card__pill-group--standalone">
      {status && (
        <StatusPill
          status={status}
          label={statusLabel ?? activityStatusLabels[status]}
        />
      )}
      {stage && !status && <span className="activity-card__stage-text">{stage}</span>}
    </div>
  );
}

export function FinancialRow({
  amount,
  currency,
  paymentStatus,
  paymentStatusLabel,
}: {
  amount?: number | string | null;
  currency: string;
  paymentStatus?: ActivityPaymentStatus | null;
  paymentStatusLabel?: string;
  emphasis?: string;
}) {
  return (
    <FinancialStatusRow
      amount={amount}
      currency={currency}
      paymentStatus={paymentStatus}
      paymentStatusLabel={paymentStatusLabel}
    />
  );
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
  return (
    <ProgressSection
      detail={progressDetail ?? progressLabel}
      percent={progressPercent}
      tone={tone}
    />
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
    <>
      {(dateLabel || timeLabel) && (
        <MetaCompound
          parts={[
            { text: dateLabel ?? '' },
            { text: timeLabel ?? '', dir: 'ltr' },
          ]}
        />
      )}
      {showLocation && locationLabel && (
        <MetaLine muted>{locationLabel}</MetaLine>
      )}
    </>
  );
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
    <>
      {recurrenceLabel && <ContextHeader tone="accent">{recurrenceLabel}</ContextHeader>}
      {nextOccurrenceLabel && (
        <MetaLine muted>
          המפגש הבא: <span dir="ltr">{nextOccurrenceLabel}</span>
        </MetaLine>
      )}
    </>
  );
}

export function MetaGroup({ children }: { children: ReactNode }) {
  return <div className="activity-card__meta-group">{children}</div>;
}

export function MetaRow({
  children,
  dir,
  subtle,
  emphasis,
  className,
}: {
  icon?: LucideIcon;
  children: string;
  wrap?: boolean;
  dir?: 'ltr' | 'rtl';
  subtle?: boolean;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <MetaLine
      dir={dir}
      emphasis={emphasis}
      muted={subtle}
      // className passthrough via wrapper if needed
    >
      <span className={className}>{children}</span>
    </MetaLine>
  );
}

export function InlineMeta({
  parts,
}: {
  parts: Array<{ text: string; dir?: 'ltr' | 'rtl'; className?: string }>;
}) {
  return (
    <MetaCompound
      parts={parts.map((p) => ({
        text: p.text,
        dir: p.dir,
        muted: p.className?.includes('meta-secondary'),
      }))}
    />
  );
}

export function AppointmentCompactBody({
  id,
  title,
  timeLabel,
  clientName,
  dateLabel,
  TypeIcon,
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
      {timeLabel && <TimeAnchor compact>{timeLabel}</TimeAnchor>}
      <div className="activity-card__appointment-main">
        <TitleRow id={id} title={title} TypeIcon={TypeIcon} isCompact />
        <MetaCompound
          parts={[
            { text: clientName ?? '' },
            { text: dateLabel ?? '', muted: true },
          ]}
        />
      </div>
    </div>
  );
}

export function StatusBadge({
  status,
  label,
}: {
  status: ActivityStatus;
  label: string;
}) {
  return <StatusPill status={status} label={label} />;
}

export function PaymentBadge({
  paymentStatus,
  label,
}: {
  paymentStatus: ActivityPaymentStatus;
  label: string;
}) {
  return <PaymentPill paymentStatus={paymentStatus} label={label} />;
}
