import { leadSourceLabel } from '../data/leadSources';
import { formatCurrency } from './finance';
import { isSourceCategory } from './sources';
import type { Category, Event, EventValue } from '../types/models';

export interface EventDetailField {
  label: string;
  value: string;
}

function formatValue(category: Category, ev: EventValue): string | null {
  switch (category.valueType) {
    case 'text': {
      const t = ev.valueText?.trim();
      if (!t) return null;
      if (isSourceCategory(category.name)) return leadSourceLabel(t);
      return t;
    }
    case 'number': {
      if (category.metricRole === 'revenue' && ev.revenueValue != null) {
        return formatCurrency(ev.revenueValue);
      }
      if (category.metricRole === 'expense' && ev.expenseValue != null) {
        return formatCurrency(ev.expenseValue);
      }
      if (ev.valueNumber != null) return String(ev.valueNumber);
      return null;
    }
    case 'date':
      return ev.valueDate
        ? new Date(ev.valueDate).toLocaleDateString('he-IL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : null;
    case 'duration':
      return ev.valueDuration != null ? `${ev.valueDuration} דקות` : null;
    default:
      return null;
  }
}

export function getEventDetailFields(
  event: Event,
  categories: Category[],
  eventValues: EventValue[],
): EventDetailField[] {
  const fields: EventDetailField[] = [
    {
      label: 'תאריך אירוע',
      value: new Date(event.eventDate).toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    },
  ];

  if (event.location.trim()) {
    fields.push({ label: 'מיקום', value: event.location.trim() });
  }

  const activeCats = categories.filter((c) => c.isActive);
  for (const cat of activeCats) {
    const val = eventValues.find(
      (ev) => ev.eventId === event.id && ev.categoryId === cat.id,
    );
    if (!val) continue;
    const display = formatValue(cat, val);
    if (display) fields.push({ label: cat.name, value: display });
  }

  if (event.notes.trim()) {
    fields.push({ label: 'הערות', value: event.notes.trim() });
  }

  return fields;
}
