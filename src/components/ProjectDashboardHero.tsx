import { Link } from 'react-router-dom';
import type { ProjectDashboardStats } from '../lib/engagementFinance';
import { formatCurrency } from '../lib/finance';
import { PERIOD_LABELS } from '../lib/period';
import type { Engagement, Milestone, PeriodFilter } from '../types/models';

interface ProjectDashboardHeroProps {
  stats: ProjectDashboardStats;
  engagements: Engagement[];
  period: PeriodFilter;
}

export function ProjectDashboardHero({
  stats,
  engagements,
  period,
}: ProjectDashboardHeroProps) {
  const periodLabel = PERIOD_LABELS[period];

  const milestoneEngagement = (m: Milestone) =>
    engagements.find((e) => e.id === m.engagementId);

  return (
    <section className="card dashboard-hero dashboard-hero-project">
      <div className="dashboard-hero-head">
        <h2 className="section-title" style={{ margin: 0 }}>
          📋 ליוויים ופרויקטים
        </h2>
        <Link to="/engagements">הכל</Link>
      </div>

      <div className="dashboard-hero-stats">
        <div className="dashboard-hero-stat">
          <strong>{stats.activeProjects}</strong>
          <span>פעילים</span>
        </div>
        <div className="dashboard-hero-stat">
          <strong>{formatCurrency(stats.pendingAmount)}</strong>
          <span>ממתין לגבייה</span>
        </div>
        <div className="dashboard-hero-stat">
          <strong>{formatCurrency(stats.paidInPeriod)}</strong>
          <span>חשבוניות · {periodLabel}</span>
        </div>
      </div>

      {stats.pendingMilestones.length > 0 && (
        <ul className="dashboard-hero-alerts">
          {stats.pendingMilestones.map((m) => {
            const eng = milestoneEngagement(m);
            return (
              <li key={m.id}>
                <Link to={`/engagements/${m.engagementId}`}>
                  {m.name}
                  {eng ? ` · ${eng.clientName}` : ''} — {formatCurrency(m.amount)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="dashboard-hero-actions">
        <Link to="/create/project" className="btn btn-primary">
          + ליווי חדש
        </Link>
        {stats.activeProjects > 0 && (
          <Link to="/engagements" className="btn btn-ghost">
            כל הפרויקטים
          </Link>
        )}
      </div>
    </section>
  );
}
