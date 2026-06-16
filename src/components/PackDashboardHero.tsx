import { Link } from 'react-router-dom';
import { packProgress } from '../lib/engagements';
import type { PackDashboardStats } from '../lib/engagementFinance';
import { formatCurrency } from '../lib/finance';
import { PERIOD_LABELS } from '../lib/period';
import type { PeriodFilter } from '../types/models';

interface PackDashboardHeroProps {
  stats: PackDashboardStats;
  period: PeriodFilter;
}

export function PackDashboardHero({ stats, period }: PackDashboardHeroProps) {
  const periodLabel = PERIOD_LABELS[period];

  return (
    <section className="card dashboard-hero dashboard-hero-pack">
      <div className="dashboard-hero-head">
        <h2 className="section-title" style={{ margin: 0 }}>
          🎫 כרטיסיות
        </h2>
        <Link to="/engagements">הכל</Link>
      </div>

      <div className="dashboard-hero-stats">
        <div className="dashboard-hero-stat">
          <strong>{stats.activePacks}</strong>
          <span>פעילות</span>
        </div>
        <div className="dashboard-hero-stat">
          <strong>{stats.visitsThisWeek}</strong>
          <span>כניסות השבוע</span>
        </div>
        <div className="dashboard-hero-stat">
          <strong>{formatCurrency(stats.revenueInPeriod)}</strong>
          <span>מכירות · {periodLabel}</span>
        </div>
      </div>

      {stats.lowRemaining.length > 0 && (
        <ul className="dashboard-hero-alerts">
          {stats.lowRemaining.map((p) => (
            <li key={p.id}>
              <Link to={`/engagements/${p.id}`}>
                {p.clientName} — נותרו {packProgress(p).remaining} כניסות
              </Link>
            </li>
          ))}
        </ul>
      )}

      {stats.expiringSoon.length > 0 && (
        <ul className="dashboard-hero-alerts dashboard-hero-alerts-warn">
          {stats.expiringSoon.map((p) => (
            <li key={p.id}>
              <Link to={`/engagements/${p.id}`}>
                {p.title} — תוקף עד{' '}
                {new Date(p.packExpiresAt!).toLocaleDateString('he-IL')}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="dashboard-hero-actions">
        <Link to="/create/pack" className="btn btn-primary">
          + כרטיסייה חדשה
        </Link>
        {stats.activePacks > 0 && (
          <Link to="/engagements" className="btn btn-ghost">
            רשימת כרטיסיות
          </Link>
        )}
      </div>
    </section>
  );
}
