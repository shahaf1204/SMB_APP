import { Calendar, MapPin, Plus, User } from 'lucide-react';
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

function isBirthdayThemed(title: string): boolean {
  return /יום\s*הולדת|birthday|בלון|balloon|🎈|🎂|cake/i.test(title);
}

export function NextEventCard({ event, clientName, amount }: NextEventCardProps) {
  if (!event) {
    return (
      <section className="dash-v2-section dash-v2-section--tight" aria-label="אירוע קרוב">
        <div className="dash-v2-next-event-empty">
          <span className="dash-v2-next-event-empty-icon" aria-hidden>
            <Calendar size={24} strokeWidth={1.5} />
          </span>
          <h2 className="dash-v2-next-event-empty-title">אין אירועים קרובים</h2>
          <p className="dash-v2-next-event-empty-msg">הוסיפו אירוע כדי לראות אותו כאן.</p>
          <Link to="/create/event" className="ds-btn ds-btn--primary ds-btn--sm">
            <Plus size={16} strokeWidth={2} aria-hidden />
            אירוע חדש
          </Link>
        </div>
      </section>
    );
  }

  const chipVariant = eventChipVariant(event.eventDate);

  return (
    <section className="dash-v2-section dash-v2-section--featured" aria-label="אירוע קרוב">
      <Link to={`/events/${event.id}/edit`} className="dash-v2-next-event dash-v2-next-event--featured dash-v2-lift">
        <div className="dash-v2-next-event-badges">
          <StatusChip variant={chipVariant} className="dash-v2-next-event-chip" />
          <FormSourceChip event={event} />
        </div>

        <div className="dash-v2-next-event-main">
          <h3 className="dash-v2-next-event-title">
            {isBirthdayThemed(event.title) && (
              <span className="dash-v2-next-event-emoji" aria-hidden>
                🎈
              </span>
            )}
            {event.title}
          </h3>
          <span className="dash-v2-next-event-price">{formatCurrency(amount)}</span>
        </div>

        <div className="dash-v2-next-event-meta">
          <span className="dash-v2-next-event-meta-item">
            <User size={14} strokeWidth={1.75} aria-hidden />
            {clientName ?? 'לא צוין'}
          </span>
          <span className="dash-v2-next-event-meta-item">
            <Calendar size={14} strokeWidth={1.75} aria-hidden />
            {formatDate(event.eventDate)}
          </span>
          {event.location && (
            <span className="dash-v2-next-event-meta-item">
              <MapPin size={14} strokeWidth={1.75} aria-hidden />
              {event.location}
            </span>
          )}
        </div>
      </Link>
    </section>
  );
}
