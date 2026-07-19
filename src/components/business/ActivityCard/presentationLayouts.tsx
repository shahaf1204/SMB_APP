import type { ReactNode } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import {
  AppointmentCompactBody,
  CardHeader,
  ClientRow,
  ContextualLabel,
  EmphasizedSchedule,
  FinancialRow,
  MetaGroup,
  MetaRow,
  NextAction,
  ProgressBlock,
  RecurrenceRow,
  StageHighlight,
  StatusSection,
  TagsSection,
  TimeAnchor,
  UsageLabel,
} from './ActivityCardParts';
import type { ActivityCardLayoutContext } from './types';

type LayoutRenderer = (ctx: ActivityCardLayoutContext) => ReactNode;

function renderEvent(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, activityTypeLabel, TypeIcon, isHero, isCompact,
    contextualLabel, dateLabel, timeLabel, locationLabel, showLocation,
    clientName, showFinancial, amount, currency, paymentStatus, paymentStatusLabel,
    status, stage, statusLabel, showProgress, progressPercent, progressLabel, progressDetail,
    showTags, tags,
  } = ctx;

  return (
    <>
      {contextualLabel && <ContextualLabel>{contextualLabel}</ContextualLabel>}
      <CardHeader
        id={id}
        title={title}
        activityTypeLabel={activityTypeLabel}
        TypeIcon={TypeIcon}
        isHero={isHero}
      />
      <EmphasizedSchedule
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        locationLabel={locationLabel}
        showLocation={!isCompact && showLocation}
      />
      {showFinancial && (
        <FinancialRow
          amount={amount}
          currency={currency}
          paymentStatus={paymentStatus}
          paymentStatusLabel={paymentStatusLabel}
          emphasis={isHero ? 'hero' : 'value'}
        />
      )}
      {clientName && !isCompact && <ClientRow clientName={clientName} />}
      {isCompact && clientName && (
        <MetaRow icon={Calendar} subtle className="activity-card__meta-row--client">
          {clientName}
        </MetaRow>
      )}
      <StatusSection status={status} stage={stage} statusLabel={statusLabel} />
      {showProgress && (
        <ProgressBlock
          progressPercent={progressPercent}
          progressLabel={progressLabel}
          progressDetail={progressDetail}
        />
      )}
      {showTags && tags && <TagsSection tags={tags} />}
    </>
  );
}

function renderAppointment(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, activityTypeLabel, TypeIcon, isCompact, isHero,
    timeLabel, clientName, dateLabel, locationLabel, showLocation,
    showFinancial, amount, currency, paymentStatus, paymentStatusLabel,
    status, statusLabel, showProgress, progressPercent, progressLabel, progressDetail,
  } = ctx;

  if (isCompact) {
    return (
      <>
        <AppointmentCompactBody
          id={id}
          title={title}
          timeLabel={timeLabel}
          clientName={clientName}
          dateLabel={dateLabel}
          TypeIcon={TypeIcon}
          activityTypeLabel={activityTypeLabel}
        />
        <StatusSection status={status} statusLabel={statusLabel} />
        {showFinancial && (
          <FinancialRow
            amount={amount}
            currency={currency}
            paymentStatus={paymentStatus}
            paymentStatusLabel={paymentStatusLabel}
            emphasis="compact"
          />
        )}
      </>
    );
  }

  return (
    <>
      {timeLabel && <TimeAnchor>{timeLabel}</TimeAnchor>}
      <CardHeader
        id={id}
        title={title}
        activityTypeLabel={activityTypeLabel}
        TypeIcon={TypeIcon}
        isHero={isHero}
      />
      <MetaGroup>
        {clientName && <ClientRow clientName={clientName} />}
        {dateLabel && (
          <MetaRow icon={Calendar} emphasis>
            {dateLabel}
          </MetaRow>
        )}
        {showLocation && locationLabel && (
          <MetaRow icon={MapPin} subtle wrap>
            {locationLabel}
          </MetaRow>
        )}
      </MetaGroup>
      <StatusSection status={status} statusLabel={statusLabel} />
      {showFinancial && (
        <FinancialRow
          amount={amount}
          currency={currency}
          paymentStatus={paymentStatus}
          paymentStatusLabel={paymentStatusLabel}
          emphasis="compact"
        />
      )}
      {showProgress && (
        <ProgressBlock
          progressPercent={progressPercent}
          progressLabel={progressLabel}
          progressDetail={progressDetail}
        />
      )}
    </>
  );
}

function renderJourney(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, activityTypeLabel, TypeIcon, isHero,
    clientName, stage, nextActionLabel,
    showFinancial, amount, currency, paymentStatus, paymentStatusLabel,
    status, statusLabel, showProgress, progressPercent, progressLabel, progressDetail,
  } = ctx;

  return (
    <>
      <CardHeader
        id={id}
        title={title}
        activityTypeLabel={activityTypeLabel}
        TypeIcon={TypeIcon}
        isHero={isHero}
        clientName={clientName}
        showClientInHeader
      />
      {stage && <StageHighlight stage={stage} />}
      {showProgress && (
        <ProgressBlock
          progressPercent={progressPercent}
          progressLabel={progressLabel}
          progressDetail={progressDetail}
          tone="journey"
        />
      )}
      {nextActionLabel && <NextAction>{nextActionLabel}</NextAction>}
      {showFinancial && (
        <FinancialRow
          amount={amount}
          currency={currency}
          paymentStatus={paymentStatus}
          paymentStatusLabel={paymentStatusLabel}
          emphasis="value"
        />
      )}
      <StatusSection status={status} statusLabel={statusLabel} />
    </>
  );
}

function renderPackage(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, activityTypeLabel, TypeIcon, isHero,
    usageLabel, clientName, dateLabel,
    showFinancial, amount, currency, paymentStatus, paymentStatusLabel,
    showProgress, progressPercent, progressLabel, showTags, tags,
  } = ctx;

  return (
    <>
      {usageLabel && <UsageLabel>{usageLabel}</UsageLabel>}
      <CardHeader
        id={id}
        title={title}
        activityTypeLabel={activityTypeLabel}
        TypeIcon={TypeIcon}
        isHero={isHero}
      />
      {clientName && <ClientRow clientName={clientName} />}
      {dateLabel && (
        <MetaRow icon={Calendar} subtle>
          {dateLabel}
        </MetaRow>
      )}
      {showFinancial && (
        <FinancialRow
          amount={amount}
          currency={currency}
          paymentStatus={paymentStatus}
          paymentStatusLabel={paymentStatusLabel}
        />
      )}
      {showProgress && (
        <ProgressBlock
          progressPercent={progressPercent}
          progressLabel={progressLabel}
          tone="usage"
        />
      )}
      {showTags && tags && <TagsSection tags={tags} />}
    </>
  );
}

function renderProject(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, activityTypeLabel, TypeIcon, isHero,
    stage, clientName, deadlineLabel,
    showFinancial, amount, currency, paymentStatus, paymentStatusLabel,
    showProgress, progressPercent, progressLabel, progressDetail,
    status, statusLabel,
  } = ctx;

  return (
    <>
      <CardHeader
        id={id}
        title={title}
        activityTypeLabel={activityTypeLabel}
        TypeIcon={TypeIcon}
        isHero={isHero}
      />
      {stage && <StageHighlight stage={stage} />}
      {deadlineLabel && (
        <MetaRow icon={Clock} emphasis>
          {deadlineLabel}
        </MetaRow>
      )}
      {clientName && <ClientRow clientName={clientName} />}
      {showProgress && (
        <ProgressBlock
          progressPercent={progressPercent}
          progressLabel={progressLabel}
          progressDetail={progressDetail}
          tone="project"
        />
      )}
      {showFinancial && (
        <FinancialRow
          amount={amount}
          currency={currency}
          paymentStatus={paymentStatus}
          paymentStatusLabel={paymentStatusLabel}
          emphasis="value"
        />
      )}
      <StatusSection status={status} statusLabel={statusLabel} />
    </>
  );
}

function renderRecurring(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, activityTypeLabel, TypeIcon, isHero,
    recurrenceLabel, nextOccurrenceLabel, clientName, usageLabel,
    showFinancial, amount, currency, paymentStatus, paymentStatusLabel,
    status, statusLabel, showProgress, progressPercent, progressLabel,
  } = ctx;

  return (
    <>
      <RecurrenceRow
        recurrenceLabel={recurrenceLabel}
        nextOccurrenceLabel={nextOccurrenceLabel}
      />
      <CardHeader
        id={id}
        title={title}
        activityTypeLabel={activityTypeLabel}
        TypeIcon={TypeIcon}
        isHero={isHero}
      />
      {clientName && <ClientRow clientName={clientName} />}
      {usageLabel && <UsageLabel>{usageLabel}</UsageLabel>}
      {showProgress && (
        <ProgressBlock
          progressPercent={progressPercent}
          progressLabel={progressLabel}
          tone="usage"
        />
      )}
      {showFinancial && (
        <FinancialRow
          amount={amount}
          currency={currency}
          paymentStatus={paymentStatus}
          paymentStatusLabel={paymentStatusLabel}
          emphasis="compact"
        />
      )}
      <StatusSection status={status} statusLabel={statusLabel} />
    </>
  );
}

function renderGeneric(ctx: ActivityCardLayoutContext): ReactNode {
  const {
    id, title, activityTypeLabel, TypeIcon, isHero, isCompact,
    clientName, dateLabel, timeLabel, locationLabel, showLocation,
    showFinancial, amount, currency, paymentStatus, paymentStatusLabel,
    status, stage, statusLabel, showProgress, progressPercent, progressLabel,
    showTags, tags,
  } = ctx;

  const metaInline = isCompact && (clientName || dateLabel || timeLabel);

  return (
    <>
      <CardHeader
        id={id}
        title={title}
        activityTypeLabel={activityTypeLabel}
        TypeIcon={TypeIcon}
        isHero={isHero}
      />
      {(clientName || dateLabel || timeLabel || (showLocation && locationLabel)) && (
        <MetaGroup>
          {metaInline ? (
            <div className="activity-card__meta-inline">
              {clientName && (
                <span className="activity-card__client-inline">{clientName}</span>
              )}
              {clientName && (dateLabel || timeLabel) && (
                <span className="activity-card__meta-sep" aria-hidden> · </span>
              )}
              {dateLabel && (
                <span className="activity-card__meta-secondary">{dateLabel}</span>
              )}
              {dateLabel && timeLabel && (
                <span className="activity-card__meta-sep" aria-hidden> · </span>
              )}
              {timeLabel && (
                <span className="activity-card__meta-secondary" dir="ltr">
                  {timeLabel}
                </span>
              )}
            </div>
          ) : (
            <>
              {clientName && <ClientRow clientName={clientName} />}
              <div className="activity-card__meta-secondary-group">
                {dateLabel && (
                  <MetaRow icon={Calendar} subtle>
                    {dateLabel}
                  </MetaRow>
                )}
                {timeLabel && (
                  <MetaRow icon={Clock} dir="ltr" subtle>
                    {timeLabel}
                  </MetaRow>
                )}
                {showLocation && locationLabel && (
                  <MetaRow icon={MapPin} subtle wrap>
                    {locationLabel}
                  </MetaRow>
                )}
              </div>
            </>
          )}
        </MetaGroup>
      )}
      {showFinancial && (
        <FinancialRow
          amount={amount}
          currency={currency}
          paymentStatus={paymentStatus}
          paymentStatusLabel={paymentStatusLabel}
        />
      )}
      <StatusSection status={status} stage={stage} statusLabel={statusLabel} />
      {showProgress && (
        <ProgressBlock
          progressPercent={progressPercent}
          progressLabel={progressLabel}
        />
      )}
      {showTags && tags && <TagsSection tags={tags} />}
    </>
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
