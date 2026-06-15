import { Link } from 'react-router-dom';
import {
  activeEngagements,
  ENGAGEMENT_KIND_ICON,
  packProgress,
  WEEKDAY_LABELS,
} from '../lib/engagements';
import { useAppStore } from '../store/useAppStore';

export function ActiveEngagementsCard() {
  const engagements = activeEngagements(useAppStore((s) => s.engagements));
  const preview = engagements.slice(0, 3);

  if (preview.length === 0) return null;

  return (
    <section className="card dashboard-engagements">
      <div className="dashboard-engagements-head">
        <h2 className="section-title" style={{ margin: 0 }}>
          פעילים עכשיו
        </h2>
        <Link to="/engagements">הכל</Link>
      </div>
      <ul className="dashboard-engagements-list">
        {preview.map((e) => (
          <li key={e.id}>
            <Link to={`/engagements/${e.id}`} className="dashboard-engagement-link">
              <span aria-hidden>{ENGAGEMENT_KIND_ICON[e.kind]}</span>
              <span>{e.title}</span>
              {e.kind === 'session_pack' && (
                <span className="dashboard-engagement-badge">
                  {packProgress(e).remaining} נותרו
                </span>
              )}
              {e.kind === 'recurring_group' && e.weekday != null && (
                <span className="dashboard-engagement-badge">
                  {WEEKDAY_LABELS[e.weekday]}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
