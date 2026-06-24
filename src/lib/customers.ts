import { getClientName, getEventRevenueTotal } from './events';
import type { Category, Event, EventValue, Invoice, Lead } from '../types/models';

export interface CustomerSummary {
  key: string;
  name: string;
  phone?: string;
  email?: string;
  eventIds: string[];
  leadIds: string[];
  invoiceIds: string[];
  activityCount: number;
  totalRevenue: number;
  lastActivity: string;
}

function tryDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function customerKey(name: string): string {
  return encodeURIComponent(name.trim().toLowerCase());
}

/** Match route param to stored customer key (handles Hebrew / URL decoding). */
export function findCustomerByParamKey(
  summaries: CustomerSummary[],
  paramKey: string | undefined,
): CustomerSummary | null {
  if (!paramKey) return null;
  const decodedParam = tryDecode(paramKey).trim().toLowerCase();

  return (
    summaries.find((c) => {
      if (c.key === paramKey) return true;
      if (tryDecode(c.key).trim().toLowerCase() === decodedParam) return true;
      if (c.name.trim().toLowerCase() === decodedParam) return true;
      return false;
    }) ?? null
  );
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
        activityCount: 0,
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
    if (event.clientPhone && !row.phone) row.phone = event.clientPhone;
    if (event.clientEmail && !row.email) row.email = event.clientEmail;
    touchDate(row, event.eventDate);
  }

  for (const lead of leads) {
    const row = ensure(lead.name);
    if (!row.leadIds.includes(lead.id)) row.leadIds.push(lead.id);
    if (lead.phone && !row.phone) row.phone = lead.phone;
    if (lead.email && !row.email) row.email = lead.email;
    touchDate(row, lead.createdAt.slice(0, 10));
  }

  for (const inv of invoices) {
    const row = ensure(inv.clientName);
    if (!row.invoiceIds.includes(inv.id)) row.invoiceIds.push(inv.id);
    if (inv.clientEmail && !row.email) row.email = inv.clientEmail;
    touchDate(row, inv.issuedAt);
  }

  for (const row of map.values()) {
    row.activityCount = row.eventIds.length + row.leadIds.length + row.invoiceIds.length;
  }

  return [...map.values()].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
}
