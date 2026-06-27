import { Calendar, MapPin, Sparkles, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from './ui/EmptyState';
import { FormSourceChip } from './externalForms/FormSourceChip';
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
      <section className="hero-event-card hero-event-card--empty" aria-label="אירוע קרוב">
        <EmptyState
          icon={Calendar}
          title="אין אירועים קרובים"
          message="הוסיפו אירוע כדי לראות אותו כאן"
          actionLabel="+ אירוע חדש"
          actionTo="/create/event"
        />
      </section>
    );
  }

  return (
    <Link to={`/events/${event.id}/edit`} className="hero-event-card" aria-label="אירוע קרוב">
      <div className="hero-event-card-top">
        <span className="hero-event-badge">
          <Sparkles size={12} strokeWidth={2.5} aria-hidden />
          האירוע הבא
        </span>
        <FormSourceChip event={event} />
      </div>
      <p className="hero-event-client">
        <User size={16} strokeWidth={2} aria-hidden />
        <strong>{clientName ?? 'לקוח'}</strong>
      </p>
      <div className="hero-event-meta">
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
      <div className="hero-event-footer">
        <span className="hero-event-amount">{formatCurrency(amount)}</span>
        <span className="hero-event-title">{event.title}</span>
      </div>
    </Link>
  );
}
