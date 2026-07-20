import type { ReactNode } from 'react';
import {
  AppointmentCompactBody,
  CardBody,
  ClientLine,
  ContextHeader,
  FinancialStatusRow,
  MetaCompound,
  MetaLine,
  NextActionLine,
  ProgressSection,
  TagRow,
  TimeAnchor,
  TitleRow,
} from './ActivityCardParts';
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

function renderEvent(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero, isCompact,
    contextualLabel, clientName, dateLabel, timeLabel, locationLabel, showLocation,
    amount, currency, status, paymentStatus, statusLabel, paymentStatusLabel,
    progressPercent, showProgress, showTags, tags,
  } = ctx;

  const progressDetail = buildProgressDetail(ctx);

  return (
    <CardBody>
      {contextualLabel && <ContextHeader>{contextualLabel}</ContextHeader>}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} isCompact={isCompact} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      <EmphasizedScheduleBlock
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        locationLabel={locationLabel}
        showLocation={!isCompact && showLocation}
      />
      <FinancialStatusRow
        amount={amount}
        currency={currency}
        status={status}
        paymentStatus={paymentStatus}
        statusLabel={statusLabel}
        paymentStatusLabel={paymentStatusLabel}
      />
      {showProgress && (
        <ProgressSection
          detail={progressDetail}
          percent={progressPercent}
          tone="event"
          showBar={progressPercent != null}
        />
      )}
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
      {(dateLabel || timeLabel) && (
        <MetaCompound
          parts={[
            ...(dateLabel ? [{ text: dateLabel, emphasis: true as const }] : []),
            ...(timeLabel ? [{ text: timeLabel, dir: 'ltr' as const }] : []),
          ]}
        />
      )}
      {showLocation && locationLabel && <MetaLine muted>{locationLabel}</MetaLine>}
    </>
  );
}

function renderAppointment(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isCompact, isHero,
    timeLabel, clientName, locationLabel,
    amount, currency, status, paymentStatus, statusLabel, paymentStatusLabel,
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
        <FinancialStatusRow
          amount={amount}
          currency={currency}
          status={status}
          paymentStatus={paymentStatus}
          statusLabel={statusLabel}
          paymentStatusLabel={paymentStatusLabel}
        />
      </CardBody>
    );
  }

  const clientMeta = [clientName, locationLabel].filter(Boolean).join(' · ');

  return (
    <CardBody>
      {timeLabel && <TimeAnchor>{timeLabel}</TimeAnchor>}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
      {(clientMeta) && <ClientLine>{clientMeta}</ClientLine>}
      <FinancialStatusRow
        amount={amount}
        currency={currency}
        status={status}
        paymentStatus={paymentStatus}
        statusLabel={statusLabel}
        paymentStatusLabel={paymentStatusLabel}
      />
    </CardBody>
  );
}

function renderJourney(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero,
    clientName, stage, contextualLabel, nextActionLabel,
    amount, currency, status, paymentStatus, statusLabel, paymentStatusLabel,
    progressDetail, progressPercent, showProgress,
  } = ctx;

  const context = contextualLabel ?? stage ?? 'בתהליך';

  return (
    <CardBody>
      {context && <ContextHeader tone="accent">{context}</ContextHeader>}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      {showProgress && progressDetail && (
        <ProgressSection
          detail={progressDetail}
          percent={progressPercent}
          tone="journey"
          showBar={progressPercent != null && !progressDetail.includes('מתוך')}
        />
      )}
      {nextActionLabel && <NextActionLine>{nextActionLabel}</NextActionLine>}
      <FinancialStatusRow
        amount={amount}
        currency={currency}
        status={status}
        paymentStatus={paymentStatus}
        statusLabel={statusLabel}
        paymentStatusLabel={paymentStatusLabel}
      />
    </CardBody>
  );
}

function renderPackage(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero,
    usageLabel, progressLabel, clientName, dateLabel,
    amount, currency, paymentStatus, paymentStatusLabel,
    progressPercent, showProgress,
  } = ctx;

  const contextHeader = progressLabel ?? undefined;

  return (
    <CardBody>
      {contextHeader && <ContextHeader tone="urgent">{contextHeader}</ContextHeader>}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      {usageLabel && <MetaLine emphasis>{usageLabel}</MetaLine>}
      {dateLabel && <MetaLine muted>{dateLabel}</MetaLine>}
      <FinancialStatusRow
        amount={amount}
        currency={currency}
        paymentStatus={paymentStatus}
        paymentStatusLabel={paymentStatusLabel}
      />
      {showProgress && progressPercent != null && !usageLabel && (
        <ProgressSection
          detail={progressLabel}
          percent={progressPercent}
          tone="usage"
          showBar
        />
      )}
    </CardBody>
  );
}

function renderProject(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero, isTimeline,
    stage, clientName, deadlineLabel, contextualLabel, nextActionLabel,
    amount, currency, status, paymentStatus, statusLabel, paymentStatusLabel,
    progressDetail, progressPercent, showProgress,
  } = ctx;

  const context = contextualLabel ?? deadlineLabel;

  return (
    <CardBody>
      {context && <ContextHeader tone="urgent">{context}</ContextHeader>}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} isCompact={isTimeline} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      {stage && <MetaLine emphasis>{stage}</MetaLine>}
      {nextActionLabel && <NextActionLine>{nextActionLabel}</NextActionLine>}
      {showProgress && progressDetail && (
        <ProgressSection
          detail={progressDetail}
          percent={progressPercent}
          tone="project"
          showBar={false}
        />
      )}
      <FinancialStatusRow
        amount={amount}
        currency={currency}
        status={status}
        paymentStatus={paymentStatus}
        statusLabel={statusLabel}
        paymentStatusLabel={paymentStatusLabel}
      />
    </CardBody>
  );
}

function renderRecurring(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero,
    recurrenceLabel, nextOccurrenceLabel, clientName, usageLabel,
    paymentStatus, paymentStatusLabel, status, statusLabel,
  } = ctx;

  return (
    <CardBody>
      {recurrenceLabel && <ContextHeader tone="accent">{recurrenceLabel}</ContextHeader>}
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      {nextOccurrenceLabel && (
        <MetaLine>
          המפגש הבא: <span dir="ltr">{nextOccurrenceLabel}</span>
        </MetaLine>
      )}
      {usageLabel && <MetaLine muted>{usageLabel}</MetaLine>}
      <FinancialStatusRow
        paymentStatus={paymentStatus}
        paymentStatusLabel={paymentStatusLabel}
        status={status}
        statusLabel={statusLabel}
        currency="₪"
        invertPills
      />
    </CardBody>
  );
}

function renderGeneric(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, TypeIcon, isHero, isCompact,
    clientName, dateLabel, timeLabel, locationLabel, showLocation,
    amount, currency, status, stage, paymentStatus, statusLabel, paymentStatusLabel,
    progressPercent, progressLabel, showProgress, showTags, tags,
  } = ctx;

  return (
    <CardBody>
      <TitleRow id={id} title={title} TypeIcon={TypeIcon} isHero={isHero} isCompact={isCompact} />
      {clientName && <ClientLine>{clientName}</ClientLine>}
      {(dateLabel || timeLabel) && (
        <MetaCompound
          parts={[
            { text: dateLabel ?? '' },
            { text: timeLabel ?? '', dir: 'ltr' },
          ]}
        />
      )}
      {showLocation && locationLabel && <MetaLine muted>{locationLabel}</MetaLine>}
      <FinancialStatusRow
        amount={amount}
        currency={currency}
        status={status}
        paymentStatus={paymentStatus}
        statusLabel={statusLabel}
        paymentStatusLabel={paymentStatusLabel}
        stage={stage}
      />
      {showProgress && (
        <ProgressSection detail={progressLabel} percent={progressPercent} />
      )}
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
