import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarExportBanner } from '../components/CalendarExportBanner';
import type { CalendarExportOutcome } from '../lib/calendarExport';
import { BottomNav } from '../components/BottomNav';
import { DashboardInsights } from '../components/dashboard/DashboardInsights';
import { DashboardMetricChart } from '../components/dashboard/DashboardMetricChart';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import { KpiCards } from '../components/KpiCards';
import { NextEventCard } from '../components/NextEventCard';
import { PageHeader } from '../components/PageHeader';
import { buildCustomerSummaries } from '../lib/customers';
import { calculateUnifiedTotals } from '../lib/engagementFinance';
import {
  includesMonthlyExpenses,
  resolveExpenseTrackingMode,
  sumMonthlyExpensesForMonth,
  currentMonthKey,
} from '../lib/monthlyExpenses';
import {
  findNextEvent,
  getClientName,
  getEventRevenueTotal,
} from '../lib/events';
import { useAppStore } from '../store/useAppStore';

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

  const showMonthlyExpensePrompt =
    includesMonthlyExpenses(expenseMode) &&
    sumMonthlyExpensesForMonth(monthlyExpenses, currentMonthKey()) === 0;

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
      <div className="page page-dashboard">
        <PageHeader />
        {calendarExport && <CalendarExportBanner outcome={calendarExport} />}

        <NextEventCard event={nextEvent} clientName={clientName} amount={nextAmount} />

        {showMonthlyExpensePrompt && (
          <Link to="/settings/monthly-expenses" className="card monthly-expense-prompt">
            <strong>לדווח הוצאות חודשיות?</strong>
            <span>הוסיפו שכירות, פרסום ומנויים — לסיכום רווח מדויק</span>
          </Link>
        )}

        <KpiCards
          revenue={totals.revenue}
          expense={totals.expense}
          profit={totals.profit}
          expenseHint={expenseHint}
        />

        <DashboardInsights
          events={events}
          invoices={invoices}
          customerCount={customerCount}
          profit={totals.profit}
          revenue={totals.revenue}
        />

        <DashboardQuickActions />

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
