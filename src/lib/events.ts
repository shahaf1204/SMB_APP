import type { Category, Event, EventValue } from '../types/models';
import { createId } from './ids';

const CLIENT_CATEGORY_NAMES = ['שם לקוח', 'לקוח', 'שם מטופל', 'שם מתאמן', 'שם תלמיד'];

export function createEventValuesForEvent(
  event: Event,
  categories: Category[],
): EventValue[] {
  return categories
    .filter((c) => c.isActive)
    .map((category) => ({
      id: createId(),
      eventId: event.id,
      categoryId: category.id,
      businessId: event.businessId,
      userId: event.userId,
      metricRole: category.metricRole,
    }));
}

export function getClientName(
  eventId: string,
  categories: Category[],
  eventValues: EventValue[],
): string | null {
  const clientCats = categories.filter((c) =>
    CLIENT_CATEGORY_NAMES.some((n) => c.name.includes(n) || n.includes(c.name)),
  );
  for (const cat of clientCats) {
    const val = eventValues.find(
      (ev) => ev.eventId === eventId && ev.categoryId === cat.id,
    );
    if (val?.valueText?.trim()) return val.valueText.trim();
  }
  return null;
}

export function getEventRevenueTotal(
  eventId: string,
  eventValues: EventValue[],
): number {
  return eventValues
    .filter((ev) => ev.eventId === eventId)
    .reduce((sum, ev) => sum + (ev.revenueValue ?? 0), 0);
}

export function findNextEvent(events: Event[]): Event | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = events
    .filter((e) => new Date(e.eventDate) >= today)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  return upcoming[0] ?? null;
}

export function applyValueToEventValue(
  ev: EventValue,
  category: Category,
  raw: string | number,
): EventValue {
  const updated = { ...ev };
  switch (category.valueType) {
    case 'text':
      updated.valueText = String(raw);
      break;
    case 'number': {
      const num = typeof raw === 'number' ? raw : Number(raw);
      updated.valueNumber = Number.isFinite(num) ? num : undefined;
      if (category.metricRole === 'revenue') {
        updated.revenueValue = updated.valueNumber;
      } else if (category.metricRole === 'expense') {
        updated.expenseValue = updated.valueNumber;
      }
      break;
    }
    case 'date':
      updated.valueDate = String(raw);
      break;
    case 'duration': {
      const mins = typeof raw === 'number' ? raw : Number(raw);
      updated.valueDuration = Number.isFinite(mins) ? mins : undefined;
      break;
    }
  }
  return updated;
}
