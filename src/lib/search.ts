import { getClientName } from './events';
import type { Category, Event, EventValue, Invoice, Lead } from '../types/models';

export type SearchResultKind = 'event' | 'lead' | 'invoice';

export interface SearchResult {
  kind: SearchResultKind;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export function searchAll(
  query: string,
  events: Event[],
  leads: Lead[],
  invoices: Invoice[],
  categories: Category[],
  eventValues: EventValue[],
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: SearchResult[] = [];

  for (const ev of events) {
    const client = getClientName(ev.id, categories, eventValues) ?? '';
    const hay = `${ev.title} ${ev.location} ${ev.notes} ${client}`.toLowerCase();
    if (!hay.includes(q)) continue;
    results.push({
      kind: 'event',
      id: ev.id,
      title: ev.title,
      subtitle: new Date(ev.eventDate).toLocaleDateString('he-IL'),
      href: `/events/${ev.id}/edit`,
    });
  }

  for (const lead of leads) {
    const hay = `${lead.name} ${lead.phone ?? ''} ${lead.email ?? ''} ${lead.notes}`.toLowerCase();
    if (!hay.includes(q)) continue;
    results.push({
      kind: 'lead',
      id: lead.id,
      title: lead.name,
      subtitle: 'ליד',
      href: '/leads',
    });
  }

  for (const inv of invoices) {
    const hay = `${inv.clientName} ${inv.notes} ${inv.invoiceNumber}`.toLowerCase();
    if (!hay.includes(q)) continue;
    results.push({
      kind: 'invoice',
      id: inv.id,
      title: `#${inv.invoiceNumber} · ${inv.clientName}`,
      subtitle: inv.issuedAt,
      href: `/invoices/${inv.id}`,
    });
  }

  return results.slice(0, 25);
}
