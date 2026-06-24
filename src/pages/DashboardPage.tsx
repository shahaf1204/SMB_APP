import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarExportBanner } from '../components/CalendarExportBanner';
import type { CalendarExportOutcome } from '../lib/calendarExport';
import { BottomNav } from '../components/BottomNav';
import { DashboardMetricChart } from '../components/dashboard/DashboardMetricChart';
import { DashboardQuickActions } from '../components/dashboard/DashboardQuickActions';
import { KpiCards } from '../components/KpiCards';
import { NextEventCard } from '../components/NextEventCard';
import { PageHeader } from '../components/PageHeader';
import { calculateUnifiedTotals } from '../lib/engagementFinance';
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
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const invoices = useAppStore((s) => s.invoices ?? []);
  const engagementSessions = useAppStore((s) => s.engagementSessions ?? []);
  const ensureCustomerSourceCategory = useAppStore((s) => s.ensureCustomerSourceCategory);

  useEffect(() => {
    ensureCustomerSourceCategory();
  }, [ensureCustomerSourceCategory]);

  const totals = useMemo(
    () =>
      calculateUnifiedTotals(
        events,
        eventValues,
        invoices,
        engagementSessions,
        'thisMonth',
      ),
    [events, eventValues, invoices, engagementSessions],
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

        <KpiCards revenue={totals.revenue} expense={totals.expense} profit={totals.profit} />

        <DashboardQuickActions />

        <DashboardMetricChart events={events} eventValues={eventValues} period="ytd" />
      </div>
      <BottomNav />
    </div>
  );
}
