import { Calendar, MapPin, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../lib/finance';
import type { Event } from '../types/models';

interface NextEventCardProps {
  event: Event | null;
  clientName: string | null;
  amount: number;
}

export function NextEventCard({ event, clientName, amount }: NextEventCardProps) {
  if (!event) {
    return (
      <section className="next-event-card next-event-card--empty" aria-label="אירוע קרוב">
        <div className="next-event-card-badge">הבא בתור</div>
        <p className="next-event-empty-text">אין אירועים עתידיים</p>
        <Link to="/create/event" className="btn btn-primary next-event-cta">
          + אירוע חדש
        </Link>
      </section>
    );
  }

  return (
    <Link to={`/events/${event.id}/edit`} className="next-event-card" aria-label="אירוע קרוב">
      <div className="next-event-card-badge">הבא בתור</div>
      <div className="next-event-card-main">
        <p className="next-event-client">
          <User size={15} strokeWidth={2} aria-hidden />
          <strong>{clientName ?? 'לקוח'}</strong>
        </p>
        <div className="next-event-meta">
          <span>
            <Calendar size={14} strokeWidth={2} aria-hidden />
            {formatDate(event.eventDate)}
          </span>
          {event.location && (
            <span>
              <MapPin size={14} strokeWidth={2} aria-hidden />
              {event.location}
            </span>
          )}
        </div>
      </div>
      <div className="next-event-footer">
        <span className="next-event-amount">{formatCurrency(amount)}</span>
        <span className="next-event-link">{event.title}</span>
      </div>
    </Link>
  );
}
