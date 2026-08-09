import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { CalendarExportOutcome } from '../lib/calendarExport';
import { BottomNav } from '../components/BottomNav';
import { DefaultDashboardView } from '../components/dashboard/DefaultDashboardView';
import { PackageDashboardView } from '../components/dashboard/package/PackageDashboardView';
import { isPackagePrimaryWorkspace } from '../lib/package/resolvePackageDashboardConfig';
import { useAppStore } from '../store/useAppStore';
import '../styles/dashboard.css';

export function DashboardPage() {
  const location = useLocation();
  const calendarExport = (location.state as { calendarExport?: CalendarExportOutcome } | null)
    ?.calendarExport;

  const business = useAppStore((s) => s.business);

  const isPackageWorkspace = useMemo(
    () => isPackagePrimaryWorkspace(business),
    [business],
  );

  return (
    <div className="app-shell">
      <div
        className={`page page-dashboard page-dashboard-v2${isPackageWorkspace ? ' page-dashboard--package' : ''}`}
      >
        {isPackageWorkspace ? (
          <PackageDashboardView calendarExport={calendarExport} />
        ) : (
          <DefaultDashboardView calendarExport={calendarExport} />
        )}
      </div>
      <BottomNav />
    </div>
  );
}
