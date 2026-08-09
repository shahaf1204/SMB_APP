import { Package, TicketCheck, TrendingUp, Users } from 'lucide-react';
import type { PackageOperationalStats } from '../../lib/package/packageDashboardStats';

interface PackageActivitySummaryProps {
  stats: PackageOperationalStats;
  packagesSoldThisMonth: number;
}

const SUMMARY_ITEMS = [
  { key: 'sessionsUsedThisMonth' as const, label: 'מפגשים שבוצעו החודש', icon: TrendingUp },
  { key: 'packagesSoldThisMonth' as const, label: 'כרטיסיות שנמכרו החודש', icon: Package },
  { key: 'remainingSessions' as const, label: 'מפגשים שנותרו', icon: Users },
  { key: 'activePackages' as const, label: 'כרטיסיות פעילות', icon: TicketCheck },
];

/** Compact insight strip — no individual package cards */
export function PackageActivitySummary({ stats, packagesSoldThisMonth }: PackageActivitySummaryProps) {
  const values = {
    sessionsUsedThisMonth: stats.sessionsUsedThisMonth,
    packagesSoldThisMonth,
    remainingSessions: stats.remainingSessions,
    activePackages: stats.activePackages,
  };

  return (
    <section className="dash-v2-section dash-v2-section--tight pkg-summary" aria-label="סיכום פעילות">
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">סיכום פעילות</h2>
      </div>
      <div className="pkg-summary-grid">
        {SUMMARY_ITEMS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="pkg-summary-item">
            <Icon size={18} strokeWidth={1.75} aria-hidden className="pkg-summary-item__icon" />
            <span className="pkg-summary-item__value">{values[key]}</span>
            <span className="pkg-summary-item__label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
