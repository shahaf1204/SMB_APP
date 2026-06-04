import { getClientName } from './events';
import { formatDate } from './finance';
import type { Category, Event, EventValue } from '../types/models';

export interface PastEventOption {
  id: string;
  title: string;
  eventDate: string;
  clientName: string | null;
  label: string;
}

/** אירועים שכבר התקיימו (תאריך ≤ היום), מהחדש לישן */
export function getPastEventsForAssistant(
  events: Event[],
  eventValues: EventValue[],
  categories: Category[],
  limit = 40,
): PastEventOption[] {
  const today = new Date().toISOString().slice(0, 10);

  return events
    .filter((e) => e.eventDate <= today)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate) || b.title.localeCompare(a.title))
    .slice(0, limit)
    .map((e) => {
      const clientName = getClientName(e.id, categories, eventValues);
      const dateLabel = formatDate(e.eventDate);
      const label = clientName
        ? `${dateLabel} · ${e.title} · ${clientName}`
        : `${dateLabel} · ${e.title}`;
      return {
        id: e.id,
        title: e.title,
        eventDate: e.eventDate,
        clientName,
        label,
      };
    });
}
