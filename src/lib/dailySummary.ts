import { buildTodayTasks } from './tasks';
import { isInvoiceOverdue } from './invoices';
import type { Event, Invoice, Lead, Task } from '../types/models';

function greetingForHour(hour: number): string {
  if (hour < 12) return 'בוקר טוב';
  if (hour < 17) return 'צהריים טובים';
  if (hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

function countLabel(n: number, one: string, many: string): string {
  return n === 1 ? one : `${n} ${many}`;
}

export interface DailySummary {
  greeting: string;
  emoji: string;
  userName: string;
  bullets: string[];
}

export function buildDailySummary(
  userName: string,
  events: Event[],
  leads: Lead[],
  invoices: Invoice[],
  tasks: Task[],
  dismissedAutoTasks: string[],
): DailySummary {
  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);
  const emoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙';
  const todayIso = new Date().toISOString().slice(0, 10);

  const todayEvents = events.filter((e) => e.eventDate === todayIso);
  const openTasks = buildTodayTasks(leads, events, invoices, tasks, dismissedAutoTasks);
  const overdueInvoices = invoices.filter(isInvoiceOverdue);

  const bullets: string[] = [];

  if (todayEvents.length > 0) {
    bullets.push(countLabel(todayEvents.length, 'אירוע אחד', 'אירועים'));
  }
  if (openTasks.length > 0) {
    bullets.push(countLabel(openTasks.length, 'משימה פתוחה', 'משימות פתוחות'));
  }
  if (overdueInvoices.length > 0) {
    bullets.push(countLabel(overdueInvoices.length, 'חשבונית באיחור', 'חשבוניות באיחור'));
  }

  if (bullets.length === 0) {
    bullets.push('יום שקט — הכל מסודר');
  }

  return { greeting, emoji, userName, bullets };
}
