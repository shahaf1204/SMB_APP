import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../design-system/cn';
import type { ActivityPaymentStatus, ActivityStatus, ActivityPresentationType } from './types';
import {
  activityStatusLabels,
  formatActivityAmount,
  paymentStatusLabels,
} from './types';
import { amountContextLabelFor } from './financialContext';
import {
  contextIcon,
  locationIcon,
  MetaIcons,
  progressIcon,
} from './metaIcons';

const META_ICON_SIZE = 14;
const META_ICON_STROKE = 1.75;
const INLINE_ICON_SIZE = 12;

/** Semantic icon + text row — base scan pattern for metadata */
export function MetaIconGlyph({
  icon: Icon,
  size = META_ICON_SIZE,
  className,
}: {
  icon: LucideIcon;
  size?: number;
  className?: string;
}) {
  return (
    <Icon
      className={cn('activity-card__meta-icon', className)}
      size={size}
      strokeWidth={META_ICON_STROKE}
      aria-hidden
    />
  );
}

export function MetaItem({
  icon,
  children,
  emphasis,
  muted,
  dir,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  emphasis?: boolean;
  muted?: boolean;
  dir?: 'ltr' | 'rtl';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'activity-card__meta-item',
        emphasis && 'activity-card__meta-item--emphasis',
        muted && 'activity-card__meta-item--muted',
        className,
      )}
    >
      <MetaIconGlyph icon={icon} />
      <span className="activity-card__meta-item-text" dir={dir}>
        {children}
      </span>
    </div>
  );
}

/* ── Shared v2 anatomy — composable sections ── */

/** A. Context row — subtle semantic label */
export function ContextHeader({
  children,
  tone = 'default',
  icon,
}: {
  children: string;
  tone?: 'default' | 'urgent' | 'muted' | 'accent';
  icon?: LucideIcon;
}) {
  const Icon = icon ?? contextIcon(tone);

  return (
    <p className={cn('activity-card__context', `activity-card__context--${tone}`)}>
      <MetaIconGlyph icon={Icon} size={13} className="activity-card__context-icon" />
      <span>{children}</span>
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
  return <MetaItem icon={MetaIcons.client}>{children}</MetaItem>;
}

/** D. Primary operational metadata — typography, no boxes */
export function MetaLine({
  children,
  emphasis,
  muted,
  dir,
  icon,
}: {
  children: ReactNode;
  emphasis?: boolean;
  muted?: boolean;
  dir?: 'ltr' | 'rtl';
  icon?: LucideIcon;
}) {
  if (icon) {
    return (
      <MetaItem icon={icon} emphasis={emphasis} muted={muted} dir={dir}>
        {children}
      </MetaItem>
    );
  }

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

export function ScheduleMeta({
  dateLabel,
  timeLabel,
  emphasis,
}: {
  dateLabel?: string | null;
  timeLabel?: string | null;
  emphasis?: boolean;
}) {
  if (!dateLabel && !timeLabel) return null;

  return (
    <MetaItem icon={MetaIcons.schedule} emphasis={emphasis}>
      {dateLabel && <span>{dateLabel}</span>}
      {dateLabel && timeLabel && <span className="activity-card__sep" aria-hidden> · </span>}
      {timeLabel && <span dir="ltr">{timeLabel}</span>}
    </MetaItem>
  );
}

export function LocationMeta({ children }: { children: string }) {
  return (
    <MetaItem icon={locationIcon(children)} muted>
      {children}
    </MetaItem>
  );
}

export function MetaCompound({
  parts,
  icon = MetaIcons.schedule,
}: {
  parts: Array<{ text: string; dir?: 'ltr' | 'rtl'; muted?: boolean; emphasis?: boolean }>;
  icon?: LucideIcon;
}) {
  const visible = parts.filter((p) => p.text);
  if (!visible.length) return null;

  return (
    <MetaItem icon={icon}>
      {visible.map((part, index) => (
        <span key={`${part.text}-${index}`}>
          {index > 0 && <span className="activity-card__sep" aria-hidden> · </span>}
          <span
            className={cn(
              part.muted && 'activity-card__meta-item-text--muted',
              part.emphasis && 'activity-card__meta-item-text--emphasis',
            )}
            dir={part.dir}
          >
            {part.text}
          </span>
        </span>
      ))}
    </MetaItem>
  );
}

/** Appointment time anchor — compact contextual emphasis */
export function TimeAnchor({ children, compact }: { children: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        'activity-card__time-anchor-row',
        compact && 'activity-card__time-anchor-row--compact',
      )}
    >
      <MetaIconGlyph
        icon={MetaIcons.time}
        size={compact ? 16 : 18}
        className="activity-card__time-anchor-icon"
      />
      <p
        className={cn('activity-card__time-anchor', compact && 'activity-card__time-anchor--compact')}
        dir="ltr"
      >
        {children}
      </p>
    </div>
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
  presentationType,
  amountContextLabel,
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
  presentationType?: ActivityPresentationType;
  amountContextLabel?: string | null;
}) {
  const hasAmount = amount != null && amount !== '';
  if (!hasAmount && !status && !paymentStatus && !stage) return null;

  const contextLabel =
    hasAmount
      ? (amountContextLabel ?? (presentationType ? amountContextLabelFor(presentationType) : null))
      : null;

  const operational = status ? (
    <StatusPill
      status={status}
      label={statusLabel ?? activityStatusLabels[status]}
    />
  ) : stage ? (
    <span className="activity-card__stage-text">
      <MetaIconGlyph icon={MetaIcons.stage} size={INLINE_ICON_SIZE} className="activity-card__stage-icon" />
      {stage}
    </span>
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
    <div className="activity-card__financial-block">
      <div className="activity-card__financial-row">
        {hasAmount ? (
          <div className="activity-card__amount-stack">
            {contextLabel && (
              <span className="activity-card__amount-label-row">
                <MetaIconGlyph
                  icon={MetaIcons.amount}
                  size={INLINE_ICON_SIZE}
                  className="activity-card__amount-icon"
                />
                <span className="activity-card__amount-label">{contextLabel}</span>
              </span>
            )}
            <span className="activity-card__amount">
              {formatActivityAmount(amount!, currency)}
            </span>
          </div>
        ) : (
          <span aria-hidden />
        )}
        {(operational || payment) && (
          <div className="activity-card__pill-group">{pills}</div>
        )}
      </div>
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

  const Icon = progressIcon(tone);

  return (
    <div className={cn('activity-card__progress', tone !== 'default' && `activity-card__progress--${tone}`)}>
      {detail && (
        <div className="activity-card__progress-header">
          <MetaIconGlyph icon={Icon} size={INLINE_ICON_SIZE} className="activity-card__progress-icon" />
          <span className="activity-card__progress-detail">{detail}</span>
        </div>
      )}
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

/** Next action — drives work, between financial and progress */
export function NextActionSection({ children }: { children: string }) {
  return (
    <div className="activity-card__next-action">
      <span className="activity-card__next-action-label">
        <MetaIconGlyph
          icon={MetaIcons.nextAction}
          size={INLINE_ICON_SIZE}
          className="activity-card__next-action-icon"
        />
        השלב הבא
      </span>
      <p className="activity-card__next-action-text">{children}</p>
    </div>
  );
}

/** @deprecated alias */
export function NextActionLine({ children }: { children: string }) {
  return <NextActionSection>{children}</NextActionSection>;
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
export const NextAction = NextActionSection;
export const TagsSection = TagRow;

export function StageHighlight({ stage }: { stage: string }) {
  return <MetaLine icon={MetaIcons.stage} emphasis>{stage}</MetaLine>;
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
      {stage && !status && (
        <span className="activity-card__stage-text">
          <MetaIconGlyph icon={MetaIcons.stage} size={INLINE_ICON_SIZE} />
          {stage}
        </span>
      )}
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
      <ScheduleMeta dateLabel={dateLabel} timeLabel={timeLabel} emphasis />
      {showLocation && locationLabel && <LocationMeta>{locationLabel}</LocationMeta>}
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
      {recurrenceLabel && (
        <ContextHeader tone="accent" icon={MetaIcons.recurrence}>
          {recurrenceLabel}
        </ContextHeader>
      )}
      {nextOccurrenceLabel && (
        <MetaLine icon={MetaIcons.nextOccurrence} muted>
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
  icon,
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
    <MetaLine dir={dir} emphasis={emphasis} muted={subtle} icon={icon}>
      <span className={className}>{children}</span>
    </MetaLine>
  );
}

export function InlineMeta({
  parts,
  icon = MetaIcons.client,
}: {
  parts: Array<{ text: string; dir?: 'ltr' | 'rtl'; className?: string }>;
  icon?: LucideIcon;
}) {
  return (
    <MetaCompound
      icon={icon}
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
  const hasRemote = Boolean(clientName && /מרחוק|online|zoom/i.test(clientName));

  return (
    <div className="activity-card__appointment-compact">
      {timeLabel && <TimeAnchor compact>{timeLabel}</TimeAnchor>}
      <div className="activity-card__appointment-main">
        <TitleRow id={id} title={title} TypeIcon={TypeIcon} isCompact />
        {clientName && (
          <MetaItem icon={hasRemote ? MetaIcons.remote : MetaIcons.client}>
            {clientName}
          </MetaItem>
        )}
        {dateLabel && (
          <MetaItem icon={MetaIcons.date} muted>
            {dateLabel}
          </MetaItem>
        )}
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
