import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarExportBanner } from '../components/CalendarExportBanner';
import type { CalendarExportOutcome } from '../lib/calendarExport';
import { BottomNav } from '../components/BottomNav';
import { DashboardHero } from '../components/dashboard/DashboardHero';
import { DashboardInsights } from '../components/dashboard/DashboardInsights';
import { DashboardMetricChart } from '../components/dashboard/DashboardMetricChart';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import { KpiCards, type KpiTrend } from '../components/KpiCards';
import { NextEventCard } from '../components/NextEventCard';
import { buildCustomerSummaries } from '../lib/customers';
import { calculateUnifiedTotals } from '../lib/engagementFinance';
import { resolveExpenseTrackingMode } from '../lib/monthlyExpenses';
import {
  findNextEvent,
  getClientName,
  getEventRevenueTotal,
} from '../lib/events';
import { useAppStore } from '../store/useAppStore';
import '../styles/dashboard.css';

function formatTrend(current: number, previous: number): string {
  if (previous === 0 && current === 0) return 'ללא שינוי';
  if (previous === 0) return current > 0 ? 'חדש החודש' : '—';
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct}% מהחודש שעבר`;
}

export function DashboardPage() {
  const location = useLocation();
  const calendarExport = (location.state as { calendarExport?: CalendarExportOutcome } | null)
    ?.calendarExport;

  const events = useAppStore((s) => s.events);
  const business = useAppStore((s) => s.business);
  const monthlyExpenses = useAppStore((s) => s.monthlyExpenses ?? []);
  const leads = useAppStore((s) => s.leads);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const invoices = useAppStore((s) => s.invoices ?? []);
  const engagementSessions = useAppStore((s) => s.engagementSessions ?? []);
  const ensureCustomerSourceCategory = useAppStore((s) => s.ensureCustomerSourceCategory);

  useEffect(() => {
    ensureCustomerSourceCategory();
  }, [ensureCustomerSourceCategory]);

  const expenseMode = resolveExpenseTrackingMode(business);

  const totals = useMemo(
    () =>
      calculateUnifiedTotals(
        events,
        eventValues,
        invoices,
        engagementSessions,
        'thisMonth',
        undefined,
        monthlyExpenses,
        expenseMode,
      ),
    [events, eventValues, invoices, engagementSessions, monthlyExpenses, expenseMode],
  );

  const prevTotals = useMemo(
    () =>
      calculateUnifiedTotals(
        events,
        eventValues,
        invoices,
        engagementSessions,
        'lastMonth',
        undefined,
        monthlyExpenses,
        expenseMode,
      ),
    [events, eventValues, invoices, engagementSessions, monthlyExpenses, expenseMode],
  );

  const trends = useMemo<KpiTrend>(
    () => ({
      revenue: formatTrend(totals.revenue, prevTotals.revenue),
      expense: formatTrend(totals.expense, prevTotals.expense),
      profit: formatTrend(totals.profit, prevTotals.profit),
    }),
    [totals, prevTotals],
  );

  const expenseHint = useMemo(() => {
    const parts: string[] = [];
    if (totals.directExpense != null && totals.directExpense > 0) {
      parts.push(`ישירות ${totals.directExpense.toLocaleString('he-IL')} ₪`);
    }
    if (totals.monthlyExpense != null && totals.monthlyExpense > 0) {
      parts.push(`חודשיות ${totals.monthlyExpense.toLocaleString('he-IL')} ₪`);
    }
    return parts.length ? parts.join(' · ') : undefined;
  }, [totals.directExpense, totals.monthlyExpense]);

  const customerCount = useMemo(
    () => buildCustomerSummaries(events, leads, invoices, categories, eventValues).length,
    [events, leads, invoices, categories, eventValues],
  );

  const nextEvent = findNextEvent(events);
  const clientName = nextEvent
    ? getClientName(nextEvent.id, categories, eventValues)
    : null;
  const nextAmount = nextEvent ? getEventRevenueTotal(nextEvent.id, eventValues) : 0;

  return (
    <div className="app-shell">
      <div className="page page-dashboard page-dashboard-v2">
        <DashboardHero />

        {calendarExport && <CalendarExportBanner outcome={calendarExport} />}

        <hr className="dash-v2-divider" aria-hidden />

        <NextEventCard event={nextEvent} clientName={clientName} amount={nextAmount} />

        <hr className="dash-v2-divider" aria-hidden />

        <KpiCards
          revenue={totals.revenue}
          expense={totals.expense}
          profit={totals.profit}
          expenseHint={expenseHint}
          trends={trends}
        />

        <hr className="dash-v2-divider" aria-hidden />

        <DashboardInsights
          events={events}
          invoices={invoices}
          customerCount={customerCount}
          profit={totals.profit}
          revenue={totals.revenue}
        />

        <hr className="dash-v2-divider" aria-hidden />

        <DashboardQuickActions />

        <hr className="dash-v2-divider" aria-hidden />

        <DashboardMetricChart
          events={events}
          eventValues={eventValues}
          monthlyExpenses={monthlyExpenses}
          period="ytd"
        />
      </div>
      <BottomNav />
    </div>
  );
}
