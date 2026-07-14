import { Calendar, CalendarClock, MapPin, Plus, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FormSourceChip } from './externalForms/FormSourceChip';
import { StatusChip } from './ds/StatusChip';
import type { StatusChipVariant } from '../design-system/tokens';
import { formatCurrency, formatDate } from '../lib/finance';
import type { Event } from '../types/models';

interface NextEventCardProps {
  event: Event | null;
  clientName: string | null;
  amount: number;
}

function eventChipVariant(eventDate: string): StatusChipVariant {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);

  if (eventDay.getTime() === today.getTime()) return 'today';
  if (eventDay.getTime() === tomorrow.getTime()) return 'tomorrow';
  return 'upcoming';
}

export function NextEventCard({ event, clientName, amount }: NextEventCardProps) {
  if (!event) {
    return (
      <section className="dash-v2-section" aria-label="אירוע קרוב">
        <div className="dash-v2-next-event-empty">
          <span className="dash-v2-next-event-empty-icon" aria-hidden>
            <Calendar size={28} strokeWidth={1.5} />
          </span>
          <h2 className="dash-v2-next-event-empty-title">אין אירועים קרובים</h2>
          <p className="dash-v2-next-event-empty-msg">
            הוסיפו אירוע כדי לראות את הפרטים כאן — תאריך, מיקום ולקוח במקום אחד.
          </p>
          <Link to="/create/event" className="ds-btn ds-btn--primary">
            <Plus size={18} strokeWidth={2} aria-hidden />
            אירוע חדש
          </Link>
        </div>
      </section>
    );
  }

  const chipVariant = eventChipVariant(event.eventDate);

  return (
    <section className="dash-v2-section" aria-label="אירוע קרוב">
      <div className="dash-v2-section-head">
        <h2 className="dash-v2-section-title">האירוע הבא</h2>
      </div>
      <Link to={`/events/${event.id}/edit`} className="dash-v2-next-event">
        <div className="dash-v2-next-event-top">
          <span className="dash-v2-next-event-label">
            <CalendarClock size={12} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: -2, marginInlineEnd: 4 }} />
            האירוע הבא
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusChip variant={chipVariant} />
            <FormSourceChip event={event} />
          </div>
        </div>

        <h3 className="dash-v2-next-event-title">{event.title}</h3>

        <div className="dash-v2-next-event-details">
          <div className="dash-v2-next-event-row">
            <span className="dash-v2-next-event-row-icon" aria-hidden>
              <User size={16} strokeWidth={1.75} />
            </span>
            <span>
              לקוח: <strong>{clientName ?? 'לא צוין'}</strong>
            </span>
          </div>
          <div className="dash-v2-next-event-row">
            <span className="dash-v2-next-event-row-icon" aria-hidden>
              <Calendar size={16} strokeWidth={1.75} />
            </span>
            <span>{formatDate(event.eventDate)}</span>
          </div>
          {event.location && (
            <div className="dash-v2-next-event-row">
              <span className="dash-v2-next-event-row-icon" aria-hidden>
                <MapPin size={16} strokeWidth={1.75} />
              </span>
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <div className="dash-v2-next-event-footer">
          <span className="dash-v2-next-event-price">{formatCurrency(amount)}</span>
          <span className="dash-v2-next-event-cta">לחצו לעריכה ←</span>
        </div>
      </Link>
    </section>
  );
}
