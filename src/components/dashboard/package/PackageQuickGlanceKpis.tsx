import { AlertTriangle, TicketCheck, Timer, TrendingUp, type LucideIcon } from 'lucide-react';

export interface PackageQuickGlanceStats {
  activePackages: number;
  sessionsUsedThisMonth: number;
  nearlyDepletedCount: number;
  packagesExpiringSoon: number;
}

interface PackageQuickGlanceKpisProps {
  stats: PackageQuickGlanceStats;
}

type GlanceKey = keyof PackageQuickGlanceStats;

interface KpiConfig {
  key: GlanceKey;
  label: string;
  icon: LucideIcon;
  variant: 'near' | 'expiring' | 'package' | 'usage';
  tier: 'priority' | 'secondary';
}

const GLANCE_CONFIG: KpiConfig[] = [
  {
    key: 'nearlyDepletedCount',
    label: 'כרטיסיות קרובות לסיום',
    icon: AlertTriangle,
    variant: 'near',
    tier: 'priority',
  },
  {
    key: 'packagesExpiringSoon',
    label: 'כרטיסיות עומדות לפוג',
    icon: Timer,
    variant: 'expiring',
    tier: 'priority',
  },
  {
    key: 'activePackages',
    label: 'כרטיסיות פעילות',
    icon: TicketCheck,
    variant: 'package',
    tier: 'secondary',
  },
  {
    key: 'sessionsUsedThisMonth',
    label: 'מפגשים החודש',
    icon: TrendingUp,
    variant: 'usage',
    tier: 'secondary',
  },
];

function PackageStatusKpi({
  label,
  value,
  icon: Icon,
  variant,
  tier,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  variant: KpiConfig['variant'];
  tier: KpiConfig['tier'];
}) {
  const isPriority = tier === 'priority';
  const hasAttention = isPriority && value > 0;
  const isIdle = isPriority && value === 0;

  return (
    <div
      className={[
        'pkg-status-kpi',
        `pkg-status-kpi--${variant}`,
        isPriority ? 'pkg-status-kpi--priority' : 'pkg-status-kpi--secondary',
        hasAttention ? 'pkg-status-kpi--attention' : '',
        isIdle ? 'pkg-status-kpi--idle' : '',
        !isIdle ? 'dash-v2-lift' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="pkg-status-kpi__icon" aria-hidden>
        <Icon size={isPriority ? 20 : 18} strokeWidth={1.75} />
      </span>
      <span className="pkg-status-kpi__value">{value}</span>
      <span className="pkg-status-kpi__label">{label}</span>
    </div>
  );
}

/** Section 4 — operational package KPIs only (no financial metrics) */
export function PackageQuickGlanceKpis({ stats }: PackageQuickGlanceKpisProps) {
  const priorityKpis = GLANCE_CONFIG.filter((kpi) => kpi.tier === 'priority');
  const secondaryKpis = GLANCE_CONFIG.filter((kpi) => kpi.tier === 'secondary');

  return (
    <section className="dash-v2-section dash-v2-section--tight pkg-status-section" aria-label="מצב הכרטיסיות">
      <div className="dash-v2-section-head dash-v2-section-head--compact">
        <h2 className="dash-v2-section-title">מצב הכרטיסיות</h2>
      </div>
      <div className="pkg-status-grid">
        <div className="pkg-status-priority-row">
          {priorityKpis.map(({ key, label, icon, variant, tier }) => (
            <PackageStatusKpi
              key={key}
              label={label}
              value={stats[key]}
              icon={icon}
              variant={variant}
              tier={tier}
            />
          ))}
        </div>
        <div className="pkg-status-secondary-row">
          {secondaryKpis.map(({ key, label, icon, variant, tier }) => (
            <PackageStatusKpi
              key={key}
              label={label}
              value={stats[key]}
              icon={icon}
              variant={variant}
              tier={tier}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
