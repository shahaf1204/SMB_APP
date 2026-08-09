import { useMemo } from 'react';
import { CalendarExportBanner } from '../../CalendarExportBanner';
import type { CalendarExportOutcome } from '../../../lib/calendarExport';
import { KpiCards, type KpiInsights } from '../../KpiCards';
import { PackageDashboardHero } from './PackageDashboardHero';
import { PackageDashboardQuickActions } from './PackageDashboardQuickActions';
import {
  PackageAttentionSections,
  PackageDashboardEmptyHint,
} from './PackageAttentionSections';
import { PackageQuickGlanceKpis } from './PackageQuickGlanceKpis';
import { PackageBusinessCoachPanel } from './PackageBusinessCoachPanel';
import { PackageSessionsChart } from './PackageSessionsChart';
import { calculateUnifiedTotals } from '../../../lib/engagementFinance';
import { resolveExpenseTrackingMode } from '../../../lib/monthlyExpenses';
import { computePackageOperationalStats } from '../../../lib/package/packageDashboardStats';
import { countNearlyDepleted } from '../../../lib/package/packagePreview';
import { resolvePackageDashboardConfig } from '../../../lib/package/resolvePackageDashboardConfig';
import { useAppStore } from '../../../store/useAppStore';
import '../../../styles/package-workspace.css';
import '../../../styles/business-coach.css';

function formatTrendPct(current: number, previous: number): { delta: string; sub: string } {
  if (previous === 0 && current === 0) return { delta: '—', sub: 'לעומת חודש שעבר' };
  if (previous === 0) return { delta: 'חדש', sub: 'לעומת חודש שעבר' };
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct > 0 ? '+' : '';
  return { delta: `${sign}${pct}%`, sub: 'לעומת חודש שעבר' };
}

interface PackageDashboardViewProps {
  calendarExport?: CalendarExportOutcome;
}

/**
 * Package-primary dashboard hierarchy:
 * 1 Hero → 2 Quick actions → 3 Coach → 4 Financial → 5 Package status → 6 Attention → 7 Chart
 */
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
      profit: formatTrendPct(totals.profit, prevTotals.profit),
      expected: { delta: undefined, sub: '' },
    }),
    [totals, prevTotals],
  );

  const operationalStats = useMemo(
    () => computePackageOperationalStats(engagements, engagementSessions, config, todayIso),
    [engagements, engagementSessions, config, todayIso],
  );

  const nearlyDepletedCount = useMemo(
    () => countNearlyDepleted(engagements, config),
    [engagements, config],
  );

  const glanceStats = useMemo(
    () => ({
      activePackages: operationalStats.activePackages,
      sessionsUsedThisMonth: operationalStats.sessionsUsedThisMonth,
      nearlyDepletedCount,
      packagesExpiringSoon: operationalStats.packagesExpiringSoon,
    }),
    [operationalStats, nearlyDepletedCount],
  );

  return (
    <>
      <PackageDashboardHero />

      {calendarExport && <CalendarExportBanner outcome={calendarExport} />}

      <PackageDashboardEmptyHint />

      <PackageDashboardQuickActions />

      <PackageBusinessCoachPanel />

      <KpiCards
        revenue={totals.revenue}
        expense={totals.expense}
        expectedRevenue={0}
        profit={totals.profit}
        insights={kpiInsights}
        hideExpected
      />

      <PackageQuickGlanceKpis stats={glanceStats} />

      <PackageAttentionSections />

      <PackageSessionsChart engagements={engagements} sessions={engagementSessions} />
    </>
  );
}
