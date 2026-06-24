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

function daysAgo(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - d.getTime()) / 86400000);
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekEndIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
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
      subtitle: lead.status === 'new' ? 'ליד חדש' : 'ממתין להמשך',
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
      href: `/events/${event.id}/edit`,
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
        : `למעקב: ${inv.clientName}`,
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

  return [...auto, ...custom].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function buildTodayTasks(
  leads: Lead[],
  events: Event[],
  invoices: Invoice[],
  customTasks: Task[],
  dismissed: string[],
): DailyTaskItem[] {
  return buildDailyTasks(leads, events, invoices, customTasks, dismissed);
}

export function buildUpcomingTasks(customTasks: Task[]): DailyTaskItem[] {
  const today = todayIso();
  return customTasks
    .filter((t) => !t.done && t.dueDate > today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((t) => ({
      id: `custom:${t.id}`,
      title: t.title,
      dueDate: t.dueDate,
      subtitle: new Date(t.dueDate).toLocaleDateString('he-IL'),
      kind: 'custom' as const,
      isDone: false,
    }));
}

export function buildCompletedTasks(
  leads: Lead[],
  events: Event[],
  invoices: Invoice[],
  customTasks: Task[],
  dismissed: string[],
): DailyTaskItem[] {
  const autoDone: DailyTaskItem[] = [];

  for (const id of dismissed) {
    if (id.startsWith('lead:')) {
      const leadId = id.replace('lead:', '');
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        autoDone.push({
          id,
          title: `ליד: ${lead.name}`,
          dueDate: todayIso(),
          kind: 'lead',
          isDone: true,
        });
      }
    } else if (id.startsWith('event:')) {
      const eventId = id.replace('event:', '');
      const event = events.find((e) => e.id === eventId);
      if (event) {
        autoDone.push({
          id,
          title: `אירוע: ${event.title}`,
          dueDate: event.eventDate,
          kind: 'event',
          isDone: true,
        });
      }
    } else if (id.startsWith('invoice:')) {
      const invId = id.replace('invoice:', '');
      const inv = invoices.find((i) => i.id === invId);
      if (inv) {
        autoDone.push({
          id,
          title: `חשבונית: ${inv.clientName}`,
          dueDate: inv.dueDate,
          kind: 'invoice',
          isDone: true,
        });
      }
    }
  }

  const customDone: DailyTaskItem[] = customTasks
    .filter((t) => t.done)
    .map((t) => ({
      id: `custom:${t.id}`,
      title: t.title,
      dueDate: t.dueDate,
      kind: 'custom' as const,
      isDone: true,
    }));

  return [...autoDone, ...customDone].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
}

export function taskCounters(
  leads: Lead[],
  events: Event[],
  invoices: Invoice[],
  customTasks: Task[],
  dismissed: string[],
): { today: number; thisWeek: number; completed: number } {
  const today = todayIso();
  const weekEnd = weekEndIso();
  const todayItems = buildTodayTasks(leads, events, invoices, customTasks, dismissed);
  const upcoming = customTasks.filter((t) => !t.done && t.dueDate > today && t.dueDate <= weekEnd);
  const completed = buildCompletedTasks(leads, events, invoices, customTasks, dismissed);

  return {
    today: todayItems.length,
    thisWeek: todayItems.length + upcoming.length,
    completed: completed.length,
  };
}
