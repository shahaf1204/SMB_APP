import type { ReactNode } from 'react';
import {
  AppointmentCompactBody,
  CardBody,
  ClientLine,
  ContextHeader,
  FinancialStatusRow,
  LocationMeta,
  MetaLine,
  NextActionSection,
  ProgressSection,
  ScheduleMeta,
  TagRow,
  TimeAnchor,
  TitleRow,
} from './ActivityCardParts';
import { MetaIcons } from './metaIcons';
import type { ActivityCardLayoutContext } from './types';
import { hasProgressData } from './types';

type LayoutRenderer = (ctx: ActivityCardLayoutContext) => ReactNode;

function buildProgressDetail(
  ctx: ActivityCardLayoutContext,
  fallback?: string | null,
): string | null {
  if (ctx.progressDetail) return ctx.progressDetail;
  if (ctx.progressLabel) return ctx.progressLabel;
  if (ctx.stage && ctx.progressPercent != null) {
    return `${ctx.stage} • ${Math.round(ctx.progressPercent)}%`;
  }
  return fallback ?? null;
}

function FinancialFooter({
  ctx,
  progressDetail,
  showBar = true,
  progressTone = 'default' as const,
}: {
  ctx: ActivityCardLayoutContext;
  progressDetail?: string | null;
  showBar?: boolean;
  progressTone?: 'default' | 'journey' | 'usage' | 'project' | 'event';
}) {
  const {
    presentationType,
    amount,
    currency,
    status,
    paymentStatus,
    statusLabel,
    paymentStatusLabel,
    stage,
    nextActionLabel,
    progressPercent,
    showProgress,
  } = ctx;

  const hasProgressContent =
    showProgress && (progressDetail != null || progressPercent != null);

  return (
    <>
      <FinancialStatusRow
        amount={amount}
        currency={currency}
        status={status}
        paymentStatus={paymentStatus}
        statusLabel={statusLabel}
        paymentStatusLabel={paymentStatusLabel}
        stage={stage}
        presentationType={presentationType}
      />
      {nextActionLabel && <NextActionSection>{nextActionLabel}</NextActionSection>}
      {hasProgressContent && (
        <ProgressSection
          detail={progressDetail}
          percent={progressPercent}
          tone={progressTone}
          showBar={showBar && progressPercent != null}
        />
      )}
    </>
  );
}

function renderEvent(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero, isCompact,
    contextualLabel, clientName, dateLabel, timeLabel, locationLabel, showLocation,
    showTags, tags,
  } = ctx;

  const progressDetail = buildProgressDetail(ctx);

  return (
    <CardBody>
      {contextualLabel && (
        <ContextHeader tone="default" icon={MetaIcons.context}>
          {contextualLabel}
        </ContextHeader>
      )}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} isCompact={isCompact} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      <EmphasizedScheduleBlock
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        locationLabel={locationLabel}
        showLocation={!isCompact && showLocation}
      />
      <FinancialFooter ctx={ctx} progressDetail={progressDetail} progressTone="event" />
      {showTags && tags && <TagRow tags={tags} />}
    </CardBody>
  );
}

function EmphasizedScheduleBlock({
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

function renderAppointment(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isCompact, isHero,
    timeLabel, clientName, locationLabel,
  } = ctx;

  if (isCompact) {
    const clientLine = [clientName, locationLabel].filter(Boolean).join(' · ');

    return (
      <CardBody>
        <AppointmentCompactBody
          id={id}
          title={title}
          timeLabel={timeLabel}
          clientName={clientLine || clientName}
          TypeIcon={TypeIcon}
        />
        <FinancialFooter ctx={ctx} />
      </CardBody>
    );
  }

  return (
    <CardBody>
      {timeLabel && <TimeAnchor>{timeLabel}</TimeAnchor>}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      {locationLabel && <LocationMeta>{locationLabel}</LocationMeta>}
      <FinancialFooter ctx={ctx} />
    </CardBody>
  );
}

function renderJourney(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero,
    clientName, stage, contextualLabel, progressDetail, progressPercent, showProgress,
  } = ctx;

  const context = contextualLabel ?? stage ?? 'בתהליך';
  const detail = progressDetail ?? undefined;
  const showBar = progressPercent != null && !(detail?.includes('מתוך') ?? false);

  return (
    <CardBody>
      {context && (
        <ContextHeader tone="accent" icon={MetaIcons.progress}>
          {context}
        </ContextHeader>
      )}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      <FinancialFooter
        ctx={ctx}
        progressDetail={showProgress ? detail : null}
        progressTone="journey"
        showBar={showBar}
      />
    </CardBody>
  );
}

function renderPackage(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero,
    usageLabel, progressLabel, clientName, dateLabel, showProgress, progressPercent,
  } = ctx;

  const contextHeader = progressLabel ?? undefined;

  return (
    <CardBody>
      {contextHeader && (
        <ContextHeader tone="urgent" icon={MetaIcons.usage}>
          {contextHeader}
        </ContextHeader>
      )}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      {usageLabel && (
        <MetaLine icon={MetaIcons.usage} emphasis>
          {usageLabel}
        </MetaLine>
      )}
      {dateLabel && (
        <MetaLine icon={MetaIcons.expiration} muted>
          {dateLabel}
        </MetaLine>
      )}
      <FinancialFooter
        ctx={ctx}
        progressDetail={
          showProgress && progressPercent != null && !usageLabel ? progressLabel : null
        }
        progressTone="usage"
      />
    </CardBody>
  );
}

function renderProject(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero, isTimeline,
    stage, clientName, deadlineLabel, contextualLabel, progressDetail, showProgress,
  } = ctx;

  const context = contextualLabel ?? deadlineLabel;

  return (
    <CardBody>
      {context && (
        <ContextHeader tone="urgent" icon={MetaIcons.deadline}>
          {context}
        </ContextHeader>
      )}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} isCompact={isTimeline} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      {stage && (
        <MetaLine icon={MetaIcons.stage} emphasis>
          {stage}
        </MetaLine>
      )}
      <FinancialFooter
        ctx={ctx}
        progressDetail={showProgress ? progressDetail : null}
        progressTone="project"
        showBar={false}
      />
    </CardBody>
  );
}

function renderRecurring(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero,
    recurrenceLabel, nextOccurrenceLabel, clientName, usageLabel,
    paymentStatus, paymentStatusLabel, status, statusLabel, nextActionLabel,
    presentationType,
  } = ctx;

  return (
    <CardBody>
      {recurrenceLabel && (
        <ContextHeader tone="accent" icon={MetaIcons.recurrence}>
          {recurrenceLabel}
        </ContextHeader>
      )}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
      {clientName && (
        <MetaLine icon={MetaIcons.participants}>{clientName}</MetaLine>
      )}
      {nextOccurrenceLabel && (
        <MetaLine icon={MetaIcons.nextOccurrence}>
          המפגש הבא: <span dir="ltr">{nextOccurrenceLabel}</span>
        </MetaLine>
      )}
      {usageLabel && (
        <MetaLine icon={MetaIcons.participants} muted>
          {usageLabel}
        </MetaLine>
      )}
      <FinancialStatusRow
        paymentStatus={paymentStatus}
        paymentStatusLabel={paymentStatusLabel}
        status={status}
        statusLabel={statusLabel}
        currency="₪"
        invertPills
        presentationType={presentationType}
      />
      {nextActionLabel && <NextActionSection>{nextActionLabel}</NextActionSection>}
    </CardBody>
  );
}

function renderGeneric(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero, isCompact,
    clientName, dateLabel, timeLabel, locationLabel, showLocation,
    progressLabel, showTags, tags,
  } = ctx;

  return (
    <CardBody>
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} isCompact={isCompact} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      <ScheduleMeta dateLabel={dateLabel} timeLabel={timeLabel} />
      {showLocation && locationLabel && <LocationMeta>{locationLabel}</LocationMeta>}
      <FinancialFooter ctx={ctx} progressDetail={progressLabel} />
      {showTags && tags && <TagRow tags={tags} />}
    </CardBody>
  );
}

export const PRESENTATION_LAYOUTS: Record<
  ActivityCardLayoutContext['presentationType'],
  LayoutRenderer
> = {
  event: renderEvent,
  appointment: renderAppointment,
  journey: renderJourney,
  package: renderPackage,
  project: renderProject,
  recurring: renderRecurring,
  generic: renderGeneric,
};

export { hasProgressData };
