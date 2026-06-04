import { Link } from 'react-router-dom';
import { AddToCalendarButton } from './AddToCalendarButton';
import { getEventDetailFields } from '../lib/eventDetails';
import { eventStatus } from '../lib/eventStatus';
import { getEventRevenueTotal } from '../lib/events';
import type { Category, Event, EventValue } from '../types/models';

interface EventDetailPanelProps {
  event: Event;
  categories: Category[];
  eventValues: EventValue[];
  isSelected: boolean;
  onClose: () => void;
  onToggleSelect: () => void;
  onDelete?: () => void;
}

export function EventDetailPanel({
  event,
  categories,
  eventValues,
  isSelected,
  onClose,
  onToggleSelect,
  onDelete,
}: EventDetailPanelProps) {
  const fields = getEventDetailFields(event, categories, eventValues);
  const status = eventStatus(event.eventDate);
  const revenue = getEventRevenueTotal(event.id, eventValues);

  const handleDelete = () => {
    if (!window.confirm(`למחוק את "${event.title}"?`)) return;
    onDelete?.();
  };

  return (
    <div className="event-detail-panel">
      <div className="event-detail-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 className="event-detail-title">{event.title}</h3>
          <span className={`status-pill status-${status}`}>
            {status === 'past' ? 'עבר' : status === 'today' ? 'היום' : 'עתידי'}
          </span>
        </div>
        <button type="button" className="chip" onClick={onClose}>
          חזרה
        </button>
      </div>

      <dl className="event-detail-fields">
        {fields.map((f) => (
          <div key={f.label} className="event-detail-row">
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="event-detail-actions">
        <Link to={`/events/${event.id}/edit`} className="btn btn-primary">
          עריכה
        </Link>
        <AddToCalendarButton event={event} />
        {revenue > 0 && (
          <Link
            to="/invoices"
            className="btn btn-ghost"
            state={{ fromEventId: event.id }}
          >
            חשבונית
          </Link>
        )}
        <button
          type="button"
          className={`btn ${isSelected ? 'btn-ghost' : 'btn-ghost'}`}
          onClick={onToggleSelect}
        >
          {isSelected ? 'הסר מסינון' : 'סינון גרפים'}
        </button>
        {onDelete && (
          <button type="button" className="btn btn-ghost event-delete-btn" onClick={handleDelete}>
            מחק
          </button>
        )}
      </div>
    </div>
  );
}
