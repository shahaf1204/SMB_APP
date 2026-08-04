import { findNextEvent } from './events';
import { calculateUnifiedTotals } from './engagementFinance';
import {
  filterEventsByPeriod,
  formatDate,
} from './finance';
import { isInvoiceOverdue } from './invoices';
import { resolveExpenseTrackingMode } from './monthlyExpenses';
import { buildDailyTasks } from './tasks';
import type { AppState, Event, Invoice } from '../types/models';

export interface AssistantContextSnapshot {
  businessName: string;
  totalsThisMonth: { revenue: number; expense: number; profit: number };
  totalsAllTime: { revenue: number; expense: number; profit: number };
  eventsThisMonth: number;
  eventsNext7Days: number;
  openLeads: number;
  overdueInvoices: number;
  unpaidInvoices: number;
  unpaidInvoicesTotal: number;
  upcomingEvents: { title: string; date: string }[];
  nextEvent: { title: string; date: string } | null;
  todayTasks: string[];
}

function countEventsNext7Days(events: Event[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + 7);
  const endIso = end.toISOString().slice(0, 10);
  const startIso = today.toISOString().slice(0, 10);
  return events.filter((e) => e.eventDate >= startIso && e.eventDate <= endIso).length;
}

function unpaidInvoiceStats(invoices: Invoice[]): { count: number; total: number } {
  const open = invoices.filter((i) => i.status !== 'paid');
  return {
    count: open.length,
    total: open.reduce((s, i) => s + i.amount, 0),
  };
}

export function buildAssistantContext(state: Pick<
  AppState,
  | 'business'
  | 'events'
  | 'eventValues'
  | 'leads'
  | 'invoices'
  | 'tasks'
  | 'dismissedAutoTasks'
  | 'engagementSessions'
  | 'engagements'
  | 'monthlyExpenses'
>): AssistantContextSnapshot | null {
  const business = state.business;
  if (!business) return null;

  const expenseMode = resolveExpenseTrackingMode(business);
  const monthlyExpenses = state.monthlyExpenses ?? [];
  const sessions = state.engagementSessions ?? [];
  const engagements = state.engagements ?? [];

  const totalsThisMonth = calculateUnifiedTotals(
    state.events,
    state.eventValues,
    state.invoices,
    sessions,
    engagements,
    'thisMonth',
    undefined,
    monthlyExpenses,
    expenseMode,
  );
  const totalsAllTime = calculateUnifiedTotals(
    state.events,
    state.eventValues,
    state.invoices,
    sessions,
    engagements,
    'allTime',
    undefined,
    monthlyExpenses,
    expenseMode,
  );
  const openLeads = state.leads.filter(
    (l) => l.status === 'new' || l.status === 'contacted',
  ).length;
  const overdueInvoices = state.invoices.filter(isInvoiceOverdue).length;
  const unpaid = unpaidInvoiceStats(state.invoices);
  const eventsThisMonth = filterEventsByPeriod(state.events, 'thisMonth').length;
  const eventsNext7Days = countEventsNext7Days(state.events);
  const next = findNextEvent(state.events);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingEvents = state.events
    .filter((e) => new Date(e.eventDate) >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, 5)
    .map((e) => ({ title: e.title, date: e.eventDate }));

  const daily = buildDailyTasks(
    state.leads,
    state.events,
    state.invoices,
    state.tasks,
    state.dismissedAutoTasks,
  );
  const todayTasks = daily
    .filter((t) => !t.isDone)
    .slice(0, 8)
    .map((t) => t.title);

  return {
    businessName: business.name,
    totalsThisMonth,
    totalsAllTime,
    eventsThisMonth,
    eventsNext7Days,
    openLeads,
    overdueInvoices,
    unpaidInvoices: unpaid.count,
    unpaidInvoicesTotal: unpaid.total,
    upcomingEvents,
    nextEvent: next
      ? { title: next.title, date: formatDate(next.eventDate) }
      : null,
    todayTasks,
  };
}

export function formatMonthlySummary(ctx: AssistantContextSnapshot): string {
  const { revenue, expense, profit } = ctx.totalsThisMonth;
  return `סיכום החודש הנוכחי (${ctx.businessName}): הכנסות ${formatMoney(revenue)}, הוצאות ${formatMoney(expense)}, רווח ${formatMoney(profit)}. ${ctx.eventsThisMonth} אירועים החודש.`;
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(n);
}

export function contextToPromptText(ctx: AssistantContextSnapshot): string {
  return [
    `עסק: ${ctx.businessName}`,
    `מצטבר (כל העסק) — הכנסות ${formatMoney(ctx.totalsAllTime.revenue)}, הוצאות ${formatMoney(ctx.totalsAllTime.expense)}, רווח ${formatMoney(ctx.totalsAllTime.profit)}`,
    `החודש הנוכחי — הכנסות ${formatMoney(ctx.totalsThisMonth.revenue)}, הוצאות ${formatMoney(ctx.totalsThisMonth.expense)}, רווח ${formatMoney(ctx.totalsThisMonth.profit)}`,
    `לידים פתוחים: ${ctx.openLeads}`,
    `חשבוניות באיחור: ${ctx.overdueInvoices}, ממתינות לגבייה (לא שולמו): ${ctx.unpaidInvoices} (${formatMoney(ctx.unpaidInvoicesTotal)})`,
    `אירועים ב-7 הימים הקרובים: ${ctx.eventsNext7Days}`,
    ctx.nextEvent
      ? `האירוע הקרוב: ${ctx.nextEvent.title} (${ctx.nextEvent.date})`
      : 'אין אירוע עתידי קרוב',
    ctx.upcomingEvents.length
      ? `אירועים קרובים: ${ctx.upcomingEvents.map((e) => `${e.title} (${e.date})`).join('; ')}`
      : 'אין אירועים עתידיים רשומים',
    ctx.todayTasks.length
      ? `משימות להיום: ${ctx.todayTasks.join('; ')}`
      : 'אין משימות דחופות להיום',
  ].join('\n');
}
