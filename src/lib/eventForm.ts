import { applyValueToEventValue } from './events';
import { sortCategories } from './categories';
import { createId } from './ids';
import type { Category, Event, EventValue } from '../types/models';

export interface EventFormValues {
  title: string;
  eventDate: string;
  location: string;
  notes: string;
  clientEmail: string;
  clientPhone: string;
  categoryInputs: Record<string, string>;
}

export function eventFormToEventPayload(
  form: EventFormValues,
): Omit<Event, 'id' | 'businessId' | 'userId'> {
  const email = form.clientEmail.trim();
  const phone = form.clientPhone.trim();
  return {
    title: form.title,
    eventDate: form.eventDate,
    location: form.location,
    notes: form.notes,
    ...(email ? { clientEmail: email } : {}),
    ...(phone ? { clientPhone: phone } : {}),
  };
}

export function eventValueToInput(ev: EventValue | undefined, cat: Category): string {
  if (!ev) return '';
  switch (cat.valueType) {
    case 'text':
      return ev.valueText ?? '';
    case 'number':
      if (cat.metricRole === 'revenue' && ev.revenueValue != null) {
        return String(ev.revenueValue);
      }
      if (cat.metricRole === 'expense' && ev.expenseValue != null) {
        return String(ev.expenseValue);
      }
      return ev.valueNumber != null ? String(ev.valueNumber) : '';
    case 'date':
      return ev.valueDate ?? '';
    case 'duration':
      return ev.valueDuration != null ? String(ev.valueDuration) : '';
    default:
      return '';
  }
}

export function buildEventValuesFromInputs(
  eventId: string,
  businessId: string,
  userId: string,
  categories: Category[],
  categoryInputs: Record<string, string>,
  existingValues: EventValue[],
): EventValue[] {
  const active = sortCategories(categories.filter((c) => c.isActive));
  return active.map((cat) => {
    const raw = categoryInputs[cat.id] ?? '';
    const existing = existingValues.find(
      (ev) => ev.eventId === eventId && ev.categoryId === cat.id,
    );
    const base: EventValue = existing
      ? { ...existing }
      : {
          id: createId(),
          eventId,
          categoryId: cat.id,
          businessId,
          userId,
          metricRole: cat.metricRole,
        };
    if (!raw) return base;
    return applyValueToEventValue(
      base,
      cat,
      cat.valueType === 'number' || cat.valueType === 'duration' ? Number(raw) : raw,
    );
  });
}
