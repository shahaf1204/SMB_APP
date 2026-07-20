import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../design-system/cn';
import { QuickActions } from './ActivityCardActions';
import { PRESENTATION_LAYOUTS } from './presentationLayouts';
import type { ActivityCardProps } from './types';
import {
  hasProgressData,
  presentationDefaultIcons,
} from './types';
import './activity-card.css';

const STATUS_TONE = {
  new: 'new',
  active: 'active',
  waiting: 'waiting',
  completed: 'completed',
  cancelled: 'cancelled',
  needs_attention: 'needs_attention',
} as const;

/**
 * ActivityCard v2 — shared operational card language, presentation-driven layout.
 * See docs/design-system.md §11 ActivityCard v2.
 */
export function ActivityCard({
  id,
  title,
  variant,
  presentationType = 'generic',
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
  contextualLabel,
  nextActionLabel,
  usageLabel,
  deadlineLabel,
  recurrenceLabel,
  nextOccurrenceLabel,
  progressDetail,
}: ActivityCardProps) {
  const isCompact = variant === 'compact';
  const isHero = variant === 'hero';
  const isTimeline = variant === 'timeline';

  const showProgress =
    !isCompact
    && hasProgressData(progressPercent, progressLabel, progressDetail);

  const showLocation = !isCompact && Boolean(locationLabel);
  const visibleTags = tags?.slice(0, 3) ?? [];
  const visibleQuickActions = quickActions?.slice(0, 3) ?? [];
  const showQuickActions = visibleQuickActions.length > 0;
  const showFinancial =
    (amount != null && amount !== '') || Boolean(paymentStatus);

  const TypeIcon: LucideIcon =
    activityTypeIcon ?? presentationDefaultIcons[presentationType];

  const toneClass = status ? STATUS_TONE[status] : undefined;
  const Layout = PRESENTATION_LAYOUTS[presentationType];

  const layoutContext = {
    id,
    title,
    variant,
    presentationType,
    activityTypeLabel,
    activityTypeIcon,
    clientName,
    dateLabel,
    timeLabel,
    locationLabel,
    amount,
    currency,
    status,
    stage,
    paymentStatus,
    progressPercent,
    progressLabel,
    tags: visibleTags,
    statusLabel,
    paymentStatusLabel,
    contextualLabel,
    nextActionLabel,
    usageLabel,
    deadlineLabel,
    recurrenceLabel,
    nextOccurrenceLabel,
    progressDetail,
    isCompact,
    isHero,
    isTimeline,
    TypeIcon,
    showProgress,
    showTags: visibleTags.length > 0,
    showFinancial,
    showLocation,
  };

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
        `activity-card--presentation-${presentationType}`,
        onClick && 'activity-card--interactive',
        toneClass && `activity-card--tone-${toneClass}`,
        className,
      )}
      data-activity-id={id}
      data-presentation-type={presentationType}
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
              {Layout(layoutContext)}
            </button>
          ) : (
            <div className="activity-card__surface">{Layout(layoutContext)}</div>
          )}

          {showQuickActions && (
            <QuickActions actions={visibleQuickActions} />
          )}
        </div>
      </div>
    </article>
  );
}

export type { ActivityCardProps } from './types';
export * from './types';
