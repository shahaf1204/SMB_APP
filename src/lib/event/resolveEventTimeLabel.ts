import type { Category, EventValue } from '../../types/models';

const TIME_CATEGORY_HINTS = ['שעת התחלה', 'שעה', 'time', 'start'];

/** Compact Hebrew date — e.g. "20 באוג׳" */
export function formatEventCompactDate(dateStr: string): string {
  const d = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

/** Resolve optional clock-time label from event category values when available. */
export function resolveEventTimeLabel(
  eventId: string,
  categories: Category[],
  eventValues: EventValue[],
): string | null {
  for (const cat of categories) {
    if (!cat.isActive) continue;
    const name = cat.name.toLowerCase();
    const isTimeCategory = TIME_CATEGORY_HINTS.some(
      (hint) => name.includes(hint.toLowerCase()) || hint.toLowerCase().includes(name),
    );
    if (!isTimeCategory) continue;

    const ev = eventValues.find(
      (v) => v.eventId === eventId && v.categoryId === cat.id,
    );
    if (!ev) continue;

    if (cat.valueType === 'text' && ev.valueText?.trim()) {
      return ev.valueText.trim();
    }

    if (cat.valueType === 'date' && ev.valueDate) {
      const d = new Date(ev.valueDate);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      }
    }
  }

  return null;
}

export function formatEventScheduleLine(
  dateStr: string,
  timeLabel: string | null,
): string {
  const datePart = formatEventCompactDate(dateStr);
  return timeLabel ? `${datePart} · ${timeLabel}` : datePart;
}
