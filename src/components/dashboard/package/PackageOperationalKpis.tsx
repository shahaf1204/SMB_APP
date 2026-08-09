import { TicketCheck, Timer, TrendingUp, Users } from 'lucide-react';
import { DASHBOARD_METRIC_LABELS_HE } from '../../../config/operatingModelConfig';
import type { PackageOperationalStats } from '../../../lib/package/packageDashboardStats';

interface PackageOperationalKpisProps {
  stats: PackageOperationalStats;
}

const KPI_CONFIG = [
  {
    key: 'activePackages' as const,
    metricId: 'active_packages',
    icon: TicketCheck,
    variant: 'package',
  },
  {
    key: 'remainingSessions' as const,
    metricId: 'remaining_sessions',
    icon: Users,
    variant: 'sessions',
  },
  {
    key: 'sessionsUsedThisMonth' as const,
    metricId: 'sessions_used_this_month',
    icon: TrendingUp,
    variant: 'usage',
  },
  {
    key: 'packagesExpiringSoon' as const,
    metricId: 'packages_expiring_soon',
    icon: Timer,
    variant: 'expiring',
  },
];

export function PackageOperationalKpis({ stats }: PackageOperationalKpisProps) {
  return (
    <section className="dash-v2-section dash-v2-section--tight" aria-label="מדדי כרטיסיות">
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">מדדי כרטיסיות</h2>
      </div>
      <div className="dash-v2-kpi-grid dash-v2-kpi-grid--package">
        {KPI_CONFIG.map(({ key, metricId, icon: Icon, variant }) => (
          <div key={key} className={`dash-v2-kpi dash-v2-kpi--${variant} dash-v2-lift`}>
            <span className="dash-v2-kpi-icon" aria-hidden>
              <Icon size={20} strokeWidth={1.75} />
            </span>
            <span className="dash-v2-kpi-value">{stats[key]}</span>
            <span className="dash-v2-kpi-label">
              {DASHBOARD_METRIC_LABELS_HE[metricId] ?? metricId}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
