import { AlertTriangle, TicketCheck, Timer, TrendingUp } from 'lucide-react';

export interface PackageQuickGlanceStats {
  activePackages: number;
  sessionsUsedThisMonth: number;
  nearlyDepletedCount: number;
  packagesExpiringSoon: number;
}

interface PackageQuickGlanceKpisProps {
  stats: PackageQuickGlanceStats;
}

const GLANCE_CONFIG = [
  {
    key: 'activePackages' as const,
    label: 'כרטיסיות פעילות',
    icon: TicketCheck,
    variant: 'package',
  },
  {
    key: 'sessionsUsedThisMonth' as const,
    label: 'מפגשים שבוצעו החודש',
    icon: TrendingUp,
    variant: 'usage',
  },
  {
    key: 'nearlyDepletedCount' as const,
    label: 'כרטיסיות קרובות לסיום',
    icon: AlertTriangle,
    variant: 'near',
  },
  {
    key: 'packagesExpiringSoon' as const,
    label: 'כרטיסיות עומדות לפוג',
    icon: Timer,
    variant: 'expiring',
  },
];

/** Section 4 — operational package KPIs only (no financial metrics) */
export function PackageQuickGlanceKpis({ stats }: PackageQuickGlanceKpisProps) {
  return (
    <section className="dash-v2-section dash-v2-section--tight" aria-label="מבט מהיר על הכרטיסיות">
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">מבט מהיר על הכרטיסיות</h2>
      </div>
      <div className="dash-v2-kpi-grid dash-v2-kpi-grid--package">
        {GLANCE_CONFIG.map(({ key, label, icon: Icon, variant }) => (
          <div key={key} className={`dash-v2-kpi dash-v2-kpi--${variant} dash-v2-lift`}>
            <span className="dash-v2-kpi-icon" aria-hidden>
              <Icon size={20} strokeWidth={1.75} />
            </span>
            <span className="dash-v2-kpi-value">{stats[key]}</span>
            <span className="dash-v2-kpi-label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
