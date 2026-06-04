import { getClientName, getEventRevenueTotal } from './events';
import type { Category, Event, EventValue, Invoice, Lead } from '../types/models';

export interface CustomerSummary {
  key: string;
  name: string;
  eventIds: string[];
  leadIds: string[];
  invoiceIds: string[];
  totalRevenue: number;
  lastActivity: string;
}

export function customerKey(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase());
}

export function buildCustomerSummaries(
  events: Event[],
  leads: Lead[],
  invoices: Invoice[],
  categories: Category[],
  eventValues: EventValue[],
): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();

  const ensure = (name: string) => {
    const key = customerKey(name);
    let row = map.get(key);
    if (!row) {
      row = {
        key,
        name: name.trim(),
        eventIds: [],
        leadIds: [],
        invoiceIds: [],
        totalRevenue: 0,
        lastActivity: '',
      };
      map.set(key, row);
    }
    return row;
  };

  const touchDate = (row: CustomerSummary, iso: string) => {
    if (!row.lastActivity || iso > row.lastActivity) row.lastActivity = iso;
  };

  for (const event of events) {
    const client = getClientName(event.id, categories, eventValues);
    if (!client) continue;
    const row = ensure(client);
    if (!row.eventIds.includes(event.id)) row.eventIds.push(event.id);
    row.totalRevenue += getEventRevenueTotal(event.id, eventValues);
    touchDate(row, event.eventDate);
  }

  for (const lead of leads) {
    const row = ensure(lead.name);
    if (!row.leadIds.includes(lead.id)) row.leadIds.push(lead.id);
    touchDate(row, lead.createdAt.slice(0, 10));
  }

  for (const inv of invoices) {
    const row = ensure(inv.clientName);
    if (!row.invoiceIds.includes(inv.id)) row.invoiceIds.push(inv.id);
    touchDate(row, inv.issuedAt);
  }

  return [...map.values()].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
}
