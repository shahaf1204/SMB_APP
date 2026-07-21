import type { ReactNode } from 'react';
import {
  AppointmentCompactBody,
  buildFinancialRow,
  CardBody,
  CardSection,
  ClientLine,
  ContextHeader,
  LocationMeta,
  MetaLine,
  NextActionSection,
  OperationalFooter,
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

function operationalTail(
  ctx: ActivityCardLayoutContext,
  opts: {
    progressDetail?: string | null;
    showBar?: boolean;
    progressTone?: 'default' | 'journey' | 'usage' | 'project' | 'event';
    progressFirst?: boolean;
    invertPills?: boolean;
  } = {},
) {
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

  const {
    progressDetail,
    showBar = true,
    progressTone = 'default',
    progressFirst = false,
    invertPills,
  } = opts;

  const hasProgressContent =
    showProgress && (progressDetail != null || progressPercent != null);

  return (
    <OperationalFooter
      progressFirst={progressFirst}
      financial={buildFinancialRow({
        presentationType,
        amount,
        currency,
        status,
        paymentStatus,
        statusLabel,
        paymentStatusLabel,
        stage,
        invertPills,
      })}
      nextAction={
        nextActionLabel ? (
          <NextActionSection>{nextActionLabel}</NextActionSection>
        ) : undefined
      }
      progress={
        hasProgressContent ? (
          <ProgressSection
            detail={progressDetail}
            percent={progressPercent}
            tone={progressTone}
            showBar={showBar && progressPercent != null}
          />
        ) : undefined
      }
    />
  );
}

function renderEvent(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero, isCompact,
    contextualLabel, clientName, dateLabel, timeLabel, locationLabel, showLocation,
    showTags, tags,
  } = ctx;

  const progressDetail = buildProgressDetail(ctx);
  const hasSchedule =
    dateLabel || timeLabel || (!isCompact && showLocation && locationLabel);

  return (
    <CardBody>
      {contextualLabel && (
        <CardSection zone="context">
          <ContextHeader tone="urgent" icon={MetaIcons.context}>
            {contextualLabel}
          </ContextHeader>
        </CardSection>
      )}
      <CardSection zone="identity">
        <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} isCompact={isCompact} />
        {clientName && <ClientLine>{clientName}</ClientLine>}
      </CardSection>
      {hasSchedule && (
        <CardSection zone="schedule">
          <ScheduleMeta dateLabel={dateLabel} timeLabel={timeLabel} emphasis />
          {!isCompact && showLocation && locationLabel && (
            <LocationMeta>{locationLabel}</LocationMeta>
          )}
        </CardSection>
      )}
      {operationalTail(ctx, { progressDetail, progressTone: 'event' })}
      {showTags && tags && <TagRow tags={tags} />}
    </CardBody>
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
        <CardSection zone="identity">
          <AppointmentCompactBody
            id={id}
            title={title}
            timeLabel={timeLabel}
            clientName={clientLine || clientName}
            TypeIcon={TypeIcon}
          />
        </CardSection>
        {operationalTail(ctx)}
      </CardBody>
    );
  }

  return (
    <CardBody>
      {timeLabel && (
        <CardSection zone="context">
          <TimeAnchor>{timeLabel}</TimeAnchor>
        </CardSection>
      )}
      <CardSection zone="identity">
        <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
        {clientName && <ClientLine>{clientName}</ClientLine>}
      </CardSection>
      {locationLabel && (
        <CardSection zone="schedule">
          <LocationMeta>{locationLabel}</LocationMeta>
        </CardSection>
      )}
      {operationalTail(ctx)}
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
      <CardSection zone="context">
        <ContextHeader tone="accent" icon={MetaIcons.progress}>
          {context}
        </ContextHeader>
      </CardSection>
      <CardSection zone="identity">
        <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
        {clientName && <ClientLine>{clientName}</ClientLine>}
      </CardSection>
      {operationalTail(ctx, {
        progressDetail: showProgress ? detail : null,
        progressTone: 'journey',
        showBar,
        progressFirst: true,
      })}
    </CardBody>
  );
}

function renderPackage(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero,
    usageLabel, progressLabel, clientName, dateLabel, showProgress, progressPercent,
  } = ctx;

  const contextHeader = progressLabel ?? undefined;
  const hasSchedule = usageLabel || dateLabel;

  return (
    <CardBody>
      {contextHeader && (
        <CardSection zone="context">
          <ContextHeader tone="urgent" icon={MetaIcons.usage}>
            {contextHeader}
          </ContextHeader>
        </CardSection>
      )}
      <CardSection zone="identity">
        <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
        {clientName && <ClientLine>{clientName}</ClientLine>}
      </CardSection>
      {hasSchedule && (
        <CardSection zone="schedule">
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
        </CardSection>
      )}
      {operationalTail(ctx, {
        progressDetail:
          showProgress && progressPercent != null && !usageLabel ? progressLabel : null,
        progressTone: 'usage',
      })}
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
        <CardSection zone="context">
          <ContextHeader tone="urgent" icon={MetaIcons.deadline}>
            {context}
          </ContextHeader>
        </CardSection>
      )}
      <CardSection zone="identity">
        <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} isCompact={isTimeline} />
        {clientName && <ClientLine>{clientName}</ClientLine>}
        {stage && (
          <MetaLine icon={MetaIcons.stage} emphasis>
            {stage}
          </MetaLine>
        )}
      </CardSection>
      {operationalTail(ctx, {
        progressDetail: showProgress ? progressDetail : null,
        progressTone: 'project',
        showBar: false,
      })}
    </CardBody>
  );
}

function renderRecurring(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero,
    recurrenceLabel, nextOccurrenceLabel, clientName, usageLabel,
    nextActionLabel, presentationType,
    paymentStatus, paymentStatusLabel, status, statusLabel,
  } = ctx;

  const hasSchedule = nextOccurrenceLabel || clientName || usageLabel;

  return (
    <CardBody>
      {recurrenceLabel && (
        <CardSection zone="context">
          <ContextHeader tone="accent" icon={MetaIcons.recurrence}>
            {recurrenceLabel}
          </ContextHeader>
        </CardSection>
      )}
      <CardSection zone="identity">
        <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
      </CardSection>
      {hasSchedule && (
        <CardSection zone="schedule">
          {nextOccurrenceLabel && (
            <MetaLine icon={MetaIcons.nextOccurrence} emphasis>
              המפגש הבא: <span dir="ltr">{nextOccurrenceLabel}</span>
            </MetaLine>
          )}
          {clientName && (
            <MetaLine icon={MetaIcons.participants}>{clientName}</MetaLine>
          )}
          {usageLabel && (
            <MetaLine icon={MetaIcons.participants} muted>
              {usageLabel}
            </MetaLine>
          )}
        </CardSection>
      )}
      <OperationalFooter
        financial={buildFinancialRow({
          presentationType,
          paymentStatus,
          paymentStatusLabel,
          status,
          statusLabel,
          currency: '₪',
          invertPills: true,
        })}
        nextAction={
          nextActionLabel ? (
            <NextActionSection>{nextActionLabel}</NextActionSection>
          ) : undefined
        }
      />
    </CardBody>
  );
}

function renderGeneric(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero, isCompact,
    clientName, dateLabel, timeLabel, locationLabel, showLocation,
    progressLabel, showTags, tags,
  } = ctx;

  const hasSchedule =
    dateLabel || timeLabel || (showLocation && locationLabel);

  return (
    <CardBody>
      <CardSection zone="identity">
        <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} isCompact={isCompact} />
        {clientName && <ClientLine>{clientName}</ClientLine>}
      </CardSection>
      {hasSchedule && (
        <CardSection zone="schedule">
          <ScheduleMeta dateLabel={dateLabel} timeLabel={timeLabel} />
          {showLocation && locationLabel && <LocationMeta>{locationLabel}</LocationMeta>}
        </CardSection>
      )}
      {operationalTail(ctx, { progressDetail: progressLabel })}
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
