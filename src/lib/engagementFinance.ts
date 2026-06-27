import { activeEngagements, packProgress } from './engagements';
import type { FinancialTotals } from './finance';
import { calculateTotals, calculateTotalsByEventIds, mergeFinancialTotals } from './finance';
import { getPeriodRange } from './period';
import { sumMonthlyExpensesInPeriod } from './monthlyExpenses';
import type {
  Engagement,
  EngagementSession,
  Event,
  EventValue,
  ExpenseTrackingMode,
  Invoice,
  Milestone,
  MonthlyExpense,
  PeriodFilter,
} from '../types/models';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function dateStringInPeriod(dateStr: string, filter: PeriodFilter, now = new Date()): boolean {
  const range = getPeriodRange(filter, now);
  const d = startOfDay(new Date(dateStr));
  if (range.futureOnly) {
    return d >= startOfDay(now);
  }
  if (range.start && d < range.start) return false;
  if (range.end && d > range.end) return false;
  return true;
}

export function engagementRevenueInPeriod(
  invoices: Invoice[],
  sessions: EngagementSession[],
  filter: PeriodFilter,
): number {
  let total = 0;
  for (const inv of invoices) {
    if (!inv.engagementId && !inv.milestoneId) continue;
    if (dateStringInPeriod(inv.issuedAt, filter)) {
      total += inv.amount;
    }
  }
  for (const s of sessions) {
    if (s.revenue > 0 && dateStringInPeriod(s.date, filter)) {
      total += s.revenue;
    }
  }
  return total;
}

export function calculateUnifiedTotals(
  events: Event[],
  eventValues: EventValue[],
  invoices: Invoice[],
  sessions: EngagementSession[],
  filter: PeriodFilter,
  scopedEventIds?: Set<string>,
  monthlyExpenses: MonthlyExpense[] = [],
  expenseMode: ExpenseTrackingMode = 'both',
): FinancialTotals {
  const eventTotals = scopedEventIds
    ? calculateTotalsByEventIds(scopedEventIds, eventValues)
    : calculateTotals(events, eventValues, filter);
  const engagementRevenue = engagementRevenueInPeriod(invoices, sessions, filter);
  const revenue = eventTotals.revenue + engagementRevenue;
  const monthlyTotal = sumMonthlyExpensesInPeriod(monthlyExpenses, filter);
  const merged = mergeFinancialTotals(
    { ...eventTotals, revenue },
    monthlyTotal,
    expenseMode,
  );
  return merged;
}

export interface PackDashboardStats {
  activePacks: number;
  visitsThisWeek: number;
  revenueInPeriod: number;
  lowRemaining: Engagement[];
  expiringSoon: Engagement[];
}

export function getPackDashboardStats(
  engagements: Engagement[],
  sessions: EngagementSession[],
  invoices: Invoice[],
  period: PeriodFilter,
): PackDashboardStats {
  const packs = activeEngagements(engagements).filter((e) => e.kind === 'session_pack');
  const today = new Date();
  const inTwoWeeks = new Date(today);
  inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);

  return {
    activePacks: packs.length,
    visitsThisWeek: sessions.filter(
      (s) =>
        packs.some((p) => p.id === s.engagementId) &&
        dateStringInPeriod(s.date, 'last7'),
    ).length,
    revenueInPeriod: engagementRevenueInPeriod(
      invoices.filter((i) => packs.some((p) => p.id === i.engagementId)),
      [],
      period,
    ),
    lowRemaining: packs.filter((p) => {
      const { remaining, total } = packProgress(p);
      return total > 0 && remaining > 0 && remaining <= 2;
    }),
    expiringSoon: packs.filter((p) => {
      if (!p.packExpiresAt) return false;
      const exp = new Date(p.packExpiresAt);
      return exp >= today && exp <= inTwoWeeks;
    }),
  };
}

export interface GroupDashboardStats {
  activeGroups: number;
  groupsToday: Engagement[];
  totalStudents: number;
  lessonsThisWeek: number;
  revenueThisWeek: number;
}

export function getGroupDashboardStats(
  engagements: Engagement[],
  sessions: EngagementSession[],
): GroupDashboardStats {
  const groups = activeEngagements(engagements).filter((e) => e.kind === 'recurring_group');
  const todayWeekday = new Date().getDay();

  return {
    activeGroups: groups.length,
    groupsToday: groups.filter((g) => g.weekday === todayWeekday),
    totalStudents: groups.reduce((sum, g) => sum + (g.members?.length ?? 0), 0),
    lessonsThisWeek: sessions.filter(
      (s) =>
        groups.some((g) => g.id === s.engagementId) &&
        dateStringInPeriod(s.date, 'last7'),
    ).length,
    revenueThisWeek: sessions
      .filter(
        (s) =>
          groups.some((g) => g.id === s.engagementId) &&
          dateStringInPeriod(s.date, 'last7'),
      )
      .reduce((sum, s) => sum + s.revenue, 0),
  };
}

export interface ProjectDashboardStats {
  activeProjects: number;
  pendingAmount: number;
  paidInPeriod: number;
  pendingMilestones: Milestone[];
}

export function getProjectDashboardStats(
  engagements: Engagement[],
  milestones: Milestone[],
  invoices: Invoice[],
  period: PeriodFilter,
): ProjectDashboardStats {
  const projects = activeEngagements(engagements).filter((e) => e.kind === 'project');
  const projectIds = new Set(projects.map((p) => p.id));
  const projectMilestones = milestones.filter((m) => projectIds.has(m.engagementId));
  const pending = projectMilestones.filter((m) => m.status !== 'paid');

  const paidInPeriod = invoices
    .filter(
      (i) =>
        i.milestoneId &&
        projectMilestones.some((m) => m.id === i.milestoneId) &&
        dateStringInPeriod(i.issuedAt, period),
    )
    .reduce((sum, i) => sum + i.amount, 0);

  return {
    activeProjects: projects.length,
    pendingAmount: pending.reduce((sum, m) => sum + m.amount, 0),
    paidInPeriod,
    pendingMilestones: pending.slice(0, 5),
  };
}
