import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ActiveEngagementsCard } from '../components/ActiveEngagementsCard';
import { CalendarExportBanner } from '../components/CalendarExportBanner';
import type { CalendarExportOutcome } from '../lib/calendarExport';
import { BottomNav } from '../components/BottomNav';
import { DashboardCalendar } from '../components/DashboardCalendar';
import { GlobalSearch } from '../components/GlobalSearch';
import { CumulativeFinanceChart } from '../components/CumulativeFinanceChart';
import { KpiCards } from '../components/KpiCards';
import { NextEventCard } from '../components/NextEventCard';
import { PageHeader } from '../components/PageHeader';
import { PeriodFilter } from '../components/PeriodFilter';
import { RevenueChart } from '../components/RevenueChart';
import { SourceBreakdown } from '../components/SourceBreakdown';
import { TrendKpis } from '../components/TrendKpis';
import { getFinancialTrends, countNewLeadsThisWeek } from '../lib/analytics';
import {
  findNextEvent,
  getClientName,
  getEventRevenueTotal,
} from '../lib/events';
import { calculateTotalsByEventIds, filterEventsByPeriod } from '../lib/finance';
import { getCustomerSourceBreakdown } from '../lib/sources';
import { useAppStore } from '../store/useAppStore';
import type { PeriodFilter as PeriodFilterType } from '../types/models';

export function DashboardPage() {
  const location = useLocation();
  const calendarExport = (location.state as { calendarExport?: CalendarExportOutcome } | null)
    ?.calendarExport;

  const user = useAppStore((s) => s.user)!;
  const business = useAppStore((s) => s.business)!;
  const events = useAppStore((s) => s.events);
  const categories = useAppStore((s) => s.categories);
  const eventValues = useAppStore((s) => s.eventValues);
  const leads = useAppStore((s) => s.leads);
  const ensureCustomerSourceCategory = useAppStore((s) => s.ensureCustomerSourceCategory);
  const deleteEvent = useAppStore((s) => s.deleteEvent);

  useEffect(() => {
    ensureCustomerSourceCategory();
  }, [ensureCustomerSourceCategory]);

  const [period, setPeriod] = useState<PeriodFilterType>('thisMonth');
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());

  const periodEvents = useMemo(() => filterEventsByPeriod(events, period), [events, period]);
  const selectedEvents = useMemo(
    () => events.filter((e) => selectedEventIds.has(e.id)),
    [events, selectedEventIds],
  );
  const scopedEvents = selectedEventIds.size > 0 ? selectedEvents : periodEvents;
  const scopedEventIds = useMemo(() => new Set(scopedEvents.map((e) => e.id)), [scopedEvents]);

  const totals = calculateTotalsByEventIds(scopedEventIds, eventValues);
  const trends = useMemo(() => getFinancialTrends(events, eventValues), [events, eventValues]);
  const sourceBreakdown = useMemo(
    () => getCustomerSourceBreakdown(scopedEvents, categories, eventValues),
    [scopedEvents, categories, eventValues],
  );
  const newLeadsCount = countNewLeadsThisWeek(leads);
  const nextEvent = findNextEvent(events);
  const clientName = nextEvent
    ? getClientName(nextEvent.id, categories, eventValues)
    : null;
  const nextAmount = nextEvent ? getEventRevenueTotal(nextEvent.id, eventValues) : 0;

  const applyEventSelection = (ids: string[], mode: 'select' | 'deselect') => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (mode === 'select') next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  return (
    <div className="app-shell">
      <div className="page">
        <PageHeader userName={user.displayName} />
        {calendarExport && <CalendarExportBanner outcome={calendarExport} />}
        <GlobalSearch />
        <NextEventCard event={nextEvent} clientName={clientName} amount={nextAmount} />
        <ActiveEngagementsCard />

        <div className="quick-actions">
          <Link to="/leads" className="quick-action-card">
            <span className="quick-action-value">{newLeadsCount}</span>
            <span className="quick-action-label">לידים חדשים השבוע</span>
          </Link>
          <Link to="/today" className="quick-action-card">
            <span className="quick-action-icon">✅</span>
            <span className="quick-action-label">משימות היום</span>
          </Link>
          <Link to="/invoices" className="quick-action-card">
            <span className="quick-action-icon">🧾</span>
            <span className="quick-action-label">חשבוניות</span>
          </Link>
        </div>

        <PeriodFilter value={period} onChange={setPeriod} />
        <DashboardCalendar
          events={events}
          categories={categories}
          eventValues={eventValues}
          selectedEventIds={selectedEventIds}
          onApplySelection={applyEventSelection}
          onClearSelection={() => setSelectedEventIds(new Set())}
          onDeleteEvent={(id) => {
            deleteEvent(id);
            setSelectedEventIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }}
        />
        {selectedEventIds.size > 0 && (
          <p style={{ margin: '0 0 0.8rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            מסונן לפי {selectedEventIds.size} אירועים שנבחרו מהקלנדר.
          </p>
        )}
        <KpiCards revenue={totals.revenue} expense={totals.expense} profit={totals.profit} />
        <TrendKpis trends={trends} />
        <SourceBreakdown data={sourceBreakdown} />
        <RevenueChart
          revenue={totals.revenue}
          expense={totals.expense}
          profit={totals.profit}
        />
        <CumulativeFinanceChart events={events} eventValues={eventValues} />
        <p
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          {business.name} · {business.businessType}
        </p>
      </div>
      <BottomNav />
    </div>
  );
}
