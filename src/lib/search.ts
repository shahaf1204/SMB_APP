import { getClientName } from './events';
import { customerKey } from './customers';
import type {
  Category,
  Engagement,
  Event,
  EventValue,
  Invoice,
  Lead,
  Task,
} from '../types/models';

export type SearchResultKind =
  | 'event'
  | 'lead'
  | 'invoice'
  | 'customer'
  | 'engagement'
  | 'task';

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
  engagements: Engagement[] = [],
  tasks: Task[] = [],
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: SearchResult[] = [];
  const seenCustomers = new Set<string>();

  for (const ev of events) {
    const client = getClientName(ev.id, categories, eventValues) ?? '';
    const hay = `${ev.title} ${ev.location} ${ev.notes} ${client}`.toLowerCase();
    if (!hay.includes(q)) continue;
    results.push({
      kind: 'event',
      id: ev.id,
      title: client || ev.title,
      subtitle: new Date(ev.eventDate).toLocaleDateString('he-IL'),
      href: `/events/${ev.id}/edit`,
    });
    if (client) {
      const key = customerKey(client);
      if (!seenCustomers.has(key)) {
        seenCustomers.add(key);
        results.push({
          kind: 'customer',
          id: key,
          title: client,
          subtitle: 'לקוח',
          href: `/customers/${key}`,
        });
      }
    }
  }

  for (const lead of leads) {
    const hay = `${lead.name} ${lead.phone ?? ''} ${lead.email ?? ''} ${lead.notes}`.toLowerCase();
    if (!hay.includes(q)) continue;
    results.push({
      kind: 'lead',
      id: lead.id,
      title: lead.name,
      subtitle: 'ליד',
      href: `/leads/${lead.id}`,
    });
  }

  for (const inv of invoices) {
    const hay = `${inv.clientName} ${inv.notes} ${inv.invoiceNumber}`.toLowerCase();
    if (!hay.includes(q)) continue;
    results.push({
      kind: 'invoice',
      id: inv.id,
      title: inv.clientName,
      subtitle: `#${inv.invoiceNumber}`,
      href: `/invoices/${inv.id}`,
    });
  }

  for (const eng of engagements) {
    const hay = `${eng.title} ${eng.clientName} ${eng.notes}`.toLowerCase();
    if (!hay.includes(q)) continue;
    results.push({
      kind: 'engagement',
      id: eng.id,
      title: eng.clientName || eng.title,
      subtitle: 'פעילות',
      href: `/engagements/${eng.id}`,
    });
  }

  for (const task of tasks) {
    if (task.done) continue;
    const hay = task.title.toLowerCase();
    if (!hay.includes(q)) continue;
    results.push({
      kind: 'task',
      id: task.id,
      title: task.title,
      subtitle: new Date(task.dueDate).toLocaleDateString('he-IL'),
      href: '/today',
    });
  }

  return results.slice(0, 25);
}
