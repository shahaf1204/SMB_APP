import { CUSTOMER_SOURCE_CATEGORY_NAME, leadSourceLabel } from '../data/leadSources';
import type { Category, Event, EventValue } from '../types/models';

export function isSourceCategory(name: string): boolean {
  return name.includes('מקור') || name === CUSTOMER_SOURCE_CATEGORY_NAME;
}

export function getEventCustomerSource(
  eventId: string,
  categories: Category[],
  eventValues: EventValue[],
): string | null {
  const sourceCats = categories.filter((c) => isSourceCategory(c.name));
  for (const cat of sourceCats) {
    const val = eventValues.find(
      (ev) => ev.eventId === eventId && ev.categoryId === cat.id,
    );
    if (val?.valueText?.trim()) {
      const raw = val.valueText.trim();
      return leadSourceLabel(raw) !== raw ? leadSourceLabel(raw) : raw;
    }
  }
  return null;
}

export interface SourceCount {
  source: string;
  count: number;
}

export function getCustomerSourceBreakdown(
  events: Event[],
  categories: Category[],
  eventValues: EventValue[],
): SourceCount[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const src = getEventCustomerSource(event.id, categories, eventValues) ?? 'לא צוין';
    counts.set(src, (counts.get(src) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}
