import { Calendar, MapPin, Sparkles, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { relativeDayLabel, weekEventsCopy } from '../../lib/activitiesWeekCopy';
import { FormSourceChip } from '../externalForms/FormSourceChip';
import type { Event } from '../../types/models';

export interface WeekEventItem {
  id: string;
  href: string;
  sortDate: string;
  client: string;
  title: string;
  location?: string;
  dateLabel: string;
  valueLabel: string;
  formBadge?: string;
  event?: Event;
}

interface ThisWeekEventsShowcaseProps {
  items: WeekEventItem[];
  todayIso: string;
  newAutoEventIds?: Set<string>;
}

function WeekEventCard({
  item,
  todayIso,
  featured,
  isNewAuto,
}: {
  item: WeekEventItem;
  todayIso: string;
  featured?: boolean;
  isNewAuto?: boolean;
}) {
  const dayLabel = relativeDayLabel(item.sortDate, todayIso);
  const isToday = item.sortDate === todayIso;

  return (
    <Link
      to={item.href}
      className={`week-event-card ${featured ? 'week-event-card--featured' : ''} ${isToday ? 'week-event-card--today' : ''} ${isNewAuto ? 'week-event-card--new-auto' : ''}`}
    >
      <div className="week-event-card-top">
        <span className={`week-event-day-chip ${isToday ? 'week-event-day-chip--today' : ''}`}>
          {isToday && <Sparkles size={11} strokeWidth={2.5} aria-hidden />}
          {dayLabel}
        </span>
        {isNewAuto && <span className="activity-new-badge">חדש</span>}
        {item.event && <FormSourceChip event={item.event} />}
      </div>
      <p className="week-event-client">
        <User size={15} strokeWidth={2} aria-hidden />
        <strong>{item.client}</strong>
      </p>
      <p className="week-event-title">{item.title}</p>
      <div className="week-event-meta">
        <span>
          <Calendar size={13} strokeWidth={2} aria-hidden />
          {item.dateLabel}
        </span>
        {item.location && (
          <span>
            <MapPin size={13} strokeWidth={2} aria-hidden />
            {item.location}
          </span>
        )}
      </div>
      {item.valueLabel !== '—' && (
        <p className="week-event-amount">{item.valueLabel}</p>
      )}
    </Link>
  );
}

export function ThisWeekEventsShowcase({ items, todayIso, newAutoEventIds }: ThisWeekEventsShowcaseProps) {
  if (items.length === 0) return null;

  const isNewAuto = (item: WeekEventItem) =>
    Boolean(item.event?.id && newAutoEventIds?.has(item.event.id));

  const hasToday = items.some((i) => i.sortDate === todayIso);
  const tomorrow = new Date(`${todayIso}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);
  const hasTomorrow = items.some((i) => i.sortDate === tomorrowIso);

  const { title, subtitle } = weekEventsCopy(items.length, { hasToday, hasTomorrow });

  return (
    <section className="week-events-showcase" aria-label="אירועי השבוע">
      <div className="week-events-showcase-header">
        <div className="week-events-showcase-intro">
          <span className="week-events-showcase-glow" aria-hidden>
            ✦
          </span>
          <div>
            <h2 className="week-events-showcase-title">{title}</h2>
            <p className="week-events-showcase-subtitle">{subtitle}</p>
          </div>
        </div>
        <span className="week-events-showcase-badge">{items.length}</span>
      </div>

      {items.length === 1 ? (
        <WeekEventCard item={items[0]!} todayIso={todayIso} featured isNewAuto={isNewAuto(items[0]!)} />
      ) : (
        <div className="week-events-track" role="list">
          {items.map((item) => (
            <div key={item.id} className="week-events-track-item" role="listitem">
              <WeekEventCard item={item} todayIso={todayIso} isNewAuto={isNewAuto(item)} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
