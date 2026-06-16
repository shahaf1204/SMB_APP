import { Link } from 'react-router-dom';
import type { GroupDashboardStats } from '../lib/engagementFinance';
import { formatCurrency } from '../lib/finance';
import { WEEKDAY_LABELS } from '../lib/engagements';

interface GroupDashboardHeroProps {
  stats: GroupDashboardStats;
}

export function GroupDashboardHero({ stats }: GroupDashboardHeroProps) {
  return (
    <section className="card dashboard-hero dashboard-hero-group">
      <div className="dashboard-hero-head">
        <h2 className="section-title" style={{ margin: 0 }}>
          👥 חוגים
        </h2>
        <Link to="/engagements">הכל</Link>
      </div>

      <div className="dashboard-hero-stats">
        <div className="dashboard-hero-stat">
          <strong>{stats.activeGroups}</strong>
          <span>חוגים פעילים</span>
        </div>
        <div className="dashboard-hero-stat">
          <strong>{stats.totalStudents}</strong>
          <span>תלמידים</span>
        </div>
        <div className="dashboard-hero-stat">
          <strong>{stats.lessonsThisWeek}</strong>
          <span>שיעורים השבוע</span>
        </div>
        <div className="dashboard-hero-stat">
          <strong>{formatCurrency(stats.revenueThisWeek)}</strong>
          <span>הכנסות השבוע</span>
        </div>
      </div>

      {stats.groupsToday.length > 0 ? (
        <ul className="dashboard-hero-alerts dashboard-hero-alerts-today">
          <li className="dashboard-hero-alerts-label">היום בחוגים:</li>
          {stats.groupsToday.map((g) => (
            <li key={g.id}>
              <Link to={`/engagements/${g.id}`}>
                {g.title}
                {g.lessonTime ? ` · ${g.lessonTime}` : ''} — רשמו שיעור
              </Link>
            </li>
          ))}
        </ul>
      ) : stats.activeGroups > 0 ? (
        <p className="field-hint" style={{ margin: '0 0 0.75rem' }}>
          אין חוגים היום ({WEEKDAY_LABELS[new Date().getDay()]})
        </p>
      ) : null}

      <div className="dashboard-hero-actions">
        <Link to="/create/group" className="btn btn-primary">
          + חוג חדש
        </Link>
        {stats.groupsToday.length > 0 && (
          <Link to={`/engagements/${stats.groupsToday[0].id}`} className="btn btn-ghost">
            רשמתי שיעור היום
          </Link>
        )}
      </div>
    </section>
  );
}
