import type { Event, Invoice, Lead, Task } from '../types/models';

export interface DailyTaskItem {
  id: string;
  title: string;
  subtitle?: string;
  dueDate: string;
  kind: 'lead' | 'event' | 'invoice' | 'custom';
  href?: string;
  isDone: boolean;
}

const MS_DAY = 86400000;

function daysAgo(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - d.getTime()) / MS_DAY);
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildAutoTasks(
  leads: Lead[],
  events: Event[],
  invoices: Invoice[],
  dismissed: Set<string>,
): DailyTaskItem[] {
  const items: DailyTaskItem[] = [];
  const tomorrow = tomorrowIso();
  const today = todayIso();

  for (const lead of leads) {
    if (lead.status !== 'new' && lead.status !== 'contacted') continue;
    const age = daysAgo(lead.createdAt);
    if (lead.status === 'new' && age < 2) continue;
    const id = `lead:${lead.id}`;
    if (dismissed.has(id)) continue;
    items.push({
      id,
      title: `חזרה לליד: ${lead.name}`,
      subtitle: lead.status === 'new' ? 'ליד חדש ללא מענה' : 'ממתין להמשך',
      dueDate: today,
      kind: 'lead',
      href: '/leads',
      isDone: false,
    });
  }

  for (const event of events) {
    if (event.eventDate !== tomorrow) continue;
    const id = `event:${event.id}`;
    if (dismissed.has(id)) continue;
    items.push({
      id,
      title: `אירוע מחר: ${event.title}`,
      subtitle: event.location || undefined,
      dueDate: today,
      kind: 'event',
      href: '/dashboard',
      isDone: false,
    });
  }

  for (const inv of invoices) {
    if (inv.status === 'paid') continue;
    const overdue = inv.dueDate < today;
    const sentOld = inv.status === 'sent' && daysAgo(inv.issuedAt) >= 7;
    if (!overdue && !sentOld && inv.status !== 'draft') continue;
    const id = `invoice:${inv.id}`;
    if (dismissed.has(id)) continue;
    items.push({
      id,
      title: overdue
        ? `חשבונית באיחור: ${inv.clientName}`
        : `למעקב תשלום: ${inv.clientName}`,
      subtitle: `#${inv.invoiceNumber}`,
      dueDate: inv.dueDate,
      kind: 'invoice',
      href: `/invoices/${inv.id}`,
      isDone: false,
    });
  }

  return items;
}

export function buildDailyTasks(
  leads: Lead[],
  events: Event[],
  invoices: Invoice[],
  customTasks: Task[],
  dismissed: string[],
): DailyTaskItem[] {
  const dismissedSet = new Set(dismissed);
  const auto = buildAutoTasks(leads, events, invoices, dismissedSet);
  const today = todayIso();

  const custom: DailyTaskItem[] = customTasks
    .filter((t) => !t.done && t.dueDate <= today)
    .map((t) => ({
      id: `custom:${t.id}`,
      title: t.title,
      dueDate: t.dueDate,
      kind: 'custom' as const,
      isDone: false,
    }));

  const all = [...auto, ...custom];
  return all.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
