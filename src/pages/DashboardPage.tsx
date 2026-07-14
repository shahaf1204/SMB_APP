import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarExportBanner } from '../components/CalendarExportBanner';
import type { CalendarExportOutcome } from '../lib/calendarExport';
import { BottomNav } from '../components/BottomNav';
import { DashboardHero } from '../components/dashboard/DashboardHero';
import { DashboardInsights } from '../components/dashboard/DashboardInsights';
import { DashboardMetricChart } from '../components/dashboard/DashboardMetricChart';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import { KpiCards, type KpiInsights } from '../components/KpiCards';
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

function formatTrendPct(current: number, previous: number): { delta: string; sub: string } {
  if (previous === 0 && current === 0) return { delta: '—', sub: 'ללא שינוי' };
  if (previous === 0) return { delta: 'חדש', sub: 'לעומת חודש שעבר' };
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct > 0 ? '+' : '';
  return { delta: `${sign}${pct}%`, sub: 'לעומת חודש שעבר' };
}

function sumExpectedRevenueNext30Days(
  events: ReturnType<typeof useAppStore.getState>['events'],
  eventValues: ReturnType<typeof useAppStore.getState>['eventValues'],
): { total: number; count: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + 30);

  let total = 0;
  let count = 0;

  for (const event of events) {
    const d = new Date(event.eventDate);
    d.setHours(0, 0, 0, 0);
    if (d >= today && d <= end) {
      total += getEventRevenueTotal(event.id, eventValues);
      count += 1;
    }
  }

  return { total, count };
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

  const forecast = useMemo(
    () => sumExpectedRevenueNext30Days(events, eventValues),
    [events, eventValues],
  );

  const kpiInsights = useMemo<KpiInsights>(
    () => ({
      revenue: formatTrendPct(totals.revenue, prevTotals.revenue),
      expense: formatTrendPct(totals.expense, prevTotals.expense),
      expected: {
        delta: forecast.count > 0 ? `+${forecast.count} אירועים` : undefined,
        sub: '30 הימים הקרובים',
      },
    }),
    [totals, prevTotals, forecast.count],
  );

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
          expectedRevenue={forecast.total}
          insights={kpiInsights}
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
