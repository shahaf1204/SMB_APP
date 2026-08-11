import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  paymentStatusLabels,
  type ActivityQuickAction,
} from '../business/ActivityCard';
import { formatCurrency, formatDate } from '../../lib/finance';
import {
  buildEventSummaryQuickActions,
  resolveEventRowStatusLabel,
  resolveEventRowStatusTone,
} from '../../lib/event/mapEventSummaryRow';
import {
  formatEventScheduleLine,
  resolveEventTimeLabel,
} from '../../lib/event/resolveEventTimeLabel';
import type { ActivityRecord } from '../../lib/activities/types';
import type { Category, EventValue } from '../../types/models';

interface EventSummaryRowProps {
  record: ActivityRecord;
  categories: Category[];
  eventValues: EventValue[];
}

function QuickActionButton({ action }: { action: ActivityQuickAction }) {
  return (
    <button
      type="button"
      className={`event-summary-row__action event-summary-row__action--${action.type}`}
      onClick={(e) => {
        e.stopPropagation();
        action.onClick();
      }}
    >
      {action.label}
    </button>
  );
}

/** Compact event list row — high-density browsing with progressive disclosure */
export function EventSummaryRow({
  record,
  categories,
  eventValues,
}: EventSummaryRowProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const timeLabel = resolveEventTimeLabel(record.sourceId, categories, eventValues);
  const scheduleLine = formatEventScheduleLine(record.sortDate, timeLabel);
  const statusLabel = resolveEventRowStatusLabel(record);
  const statusTone = resolveEventRowStatusTone(record);
  const quickActions = buildEventSummaryQuickActions(record, navigate);

  const location = record.location?.trim();
  const metaLine = location ? `${record.title} · ${location}` : record.title;
  const notes = record.event?.notes?.trim();

  return (
    <article
      className={[
        'event-summary-row',
        expanded ? 'event-summary-row--expanded' : '',
        statusTone === 'attention' ? 'event-summary-row--attention' : '',
        statusTone === 'completed' ? 'event-summary-row--completed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="event-summary-row__surface">
        <button
          type="button"
          className="event-summary-row__main"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="event-summary-row__schedule">{scheduleLine}</span>
          <span className="event-summary-row__client">{record.clientName}</span>
          <span className="event-summary-row__meta">{metaLine}</span>
        </button>

        <div className="event-summary-row__aside">
          {record.amount != null && record.amount > 0 && (
            <span className="event-summary-row__amount" dir="ltr">
              {formatCurrency(record.amount)}
            </span>
          )}
          <span className={`event-summary-row__status event-summary-row__status--${statusTone}`}>
            {statusLabel}
          </span>
          <button
            type="button"
            className="event-summary-row__chevron-btn"
            aria-expanded={expanded}
            aria-label={expanded ? 'סגירת פרטים' : 'הצגת פרטים'}
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronDown
              size={18}
              className={`event-summary-row__chevron${expanded ? ' open' : ''}`}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="event-summary-row__details">
          <dl className="event-summary-row__detail-grid">
            <div>
              <dt>תאריך</dt>
              <dd>{formatDate(record.sortDate)}</dd>
            </div>
            {timeLabel && (
              <div>
                <dt>שעה</dt>
                <dd>{timeLabel}</dd>
              </div>
            )}
            {location && (
              <div>
                <dt>מיקום</dt>
                <dd>{location}</dd>
              </div>
            )}
            {record.amount != null && record.amount > 0 && (
              <div>
                <dt>סכום</dt>
                <dd dir="ltr">{formatCurrency(record.amount)}</dd>
              </div>
            )}
            {record.paymentStatus && (
              <div>
                <dt>תשלום</dt>
                <dd>{paymentStatusLabels[record.paymentStatus]}</dd>
              </div>
            )}
            {record.contextualLabel && (
              <div>
                <dt>מועד</dt>
                <dd>{record.contextualLabel}</dd>
              </div>
            )}
            {record.phone?.trim() && (
              <div>
                <dt>טלפון</dt>
                <dd dir="ltr">{record.phone.trim()}</dd>
              </div>
            )}
            {notes && (
              <div className="event-summary-row__detail-full">
                <dt>הערות</dt>
                <dd>{notes}</dd>
              </div>
            )}
          </dl>

          {record.tags.length > 0 && (
            <div className="event-summary-row__tags">
              {record.tags.map((tag) => (
                <span key={tag} className="event-summary-row__tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {quickActions.length > 0 && (
            <div className="event-summary-row__actions">
              {quickActions.map((action) => (
                <QuickActionButton key={action.label} action={action} />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
