import { useMemo } from 'react';
import { CalendarExportBanner } from '../../CalendarExportBanner';
import type { CalendarExportOutcome } from '../../../lib/calendarExport';
import { KpiCards, type KpiInsights } from '../../KpiCards';
import { PackageDashboardHero } from './PackageDashboardHero';
import { PackageDashboardQuickActions } from './PackageDashboardQuickActions';
import { PackageDashboardSections } from './PackageDashboardSections';
import { PackageOperationalKpis } from './PackageOperationalKpis';
import { PackageSessionsChart } from './PackageSessionsChart';
import { calculateUnifiedTotals } from '../../../lib/engagementFinance';
import { resolveExpenseTrackingMode } from '../../../lib/monthlyExpenses';
import { computePackageOperationalStats } from '../../../lib/package/packageDashboardStats';
import { resolvePackageDashboardConfig } from '../../../lib/package/resolvePackageDashboardConfig';
import { useAppStore } from '../../../store/useAppStore';

function formatTrendPct(current: number, previous: number): { delta: string; sub: string } {
  if (previous === 0 && current === 0) return { delta: '—', sub: 'ללא שינוי' };
  if (previous === 0) return { delta: 'חדש', sub: 'לעומת חודש שעבר' };
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct > 0 ? '+' : '';
  return { delta: `${sign}${pct}%`, sub: 'לעומת חודש שעבר' };
}

interface PackageDashboardViewProps {
  calendarExport?: CalendarExportOutcome;
}

/** Package-primary workspace dashboard — usage and expiration focused. */
export function PackageDashboardView({ calendarExport }: PackageDashboardViewProps) {
  const business = useAppStore((s) => s.business);
  const events = useAppStore((s) => s.events);
  const eventValues = useAppStore((s) => s.eventValues);
  const invoices = useAppStore((s) => s.invoices ?? []);
  const engagements = useAppStore((s) => s.engagements ?? []);
  const engagementSessions = useAppStore((s) => s.engagementSessions ?? []);
  const monthlyExpenses = useAppStore((s) => s.monthlyExpenses ?? []);

  const expenseMode = resolveExpenseTrackingMode(business);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const config = useMemo(() => resolvePackageDashboardConfig(business), [business]);

  const totals = useMemo(
    () =>
      calculateUnifiedTotals(
        events,
        eventValues,
        invoices,
        engagementSessions,
        engagements,
        'thisMonth',
        undefined,
        monthlyExpenses,
        expenseMode,
      ),
    [events, eventValues, invoices, engagementSessions, engagements, monthlyExpenses, expenseMode],
  );

  const prevTotals = useMemo(
    () =>
      calculateUnifiedTotals(
        events,
        eventValues,
        invoices,
        engagementSessions,
        engagements,
        'lastMonth',
        undefined,
        monthlyExpenses,
        expenseMode,
      ),
    [events, eventValues, invoices, engagementSessions, engagements, monthlyExpenses, expenseMode],
  );

  const kpiInsights = useMemo<KpiInsights>(
    () => ({
      revenue: formatTrendPct(totals.revenue, prevTotals.revenue),
      expense: formatTrendPct(totals.expense, prevTotals.expense),
      expected: { delta: undefined, sub: 'הכנסות החודש' },
    }),
    [totals, prevTotals],
  );

  const operationalStats = useMemo(
    () => computePackageOperationalStats(engagements, engagementSessions, config, todayIso),
    [engagements, engagementSessions, config, todayIso],
  );

  return (
    <>
      <PackageDashboardHero />

      {calendarExport && <CalendarExportBanner outcome={calendarExport} />}

      <PackageDashboardSections />

      <hr className="dash-v2-divider" aria-hidden />

      <PackageDashboardQuickActions />

      <hr className="dash-v2-divider" aria-hidden />

      <KpiCards
        revenue={totals.revenue}
        expense={totals.expense}
        expectedRevenue={0}
        insights={kpiInsights}
        hideExpected
      />

      <hr className="dash-v2-divider" aria-hidden />

      <PackageOperationalKpis stats={operationalStats} />

      <hr className="dash-v2-divider" aria-hidden />

      <PackageSessionsChart engagements={engagements} sessions={engagementSessions} />
    </>
  );
}
