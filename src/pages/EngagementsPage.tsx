import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import {
  activeEngagements,
  ENGAGEMENT_KIND_ICON,
  ENGAGEMENT_KIND_LABEL,
  packProgress,
  WEEKDAY_LABELS,
} from '../lib/engagements';
import { useAppStore } from '../store/useAppStore';

export function EngagementsPage() {
  const engagements = useAppStore((s) => s.engagements);
  const active = activeEngagements(engagements);
  const completed = engagements.filter((e) => e.status !== 'active');

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/create" className="page-back">
          ← יצירה חדשה
        </Link>
        <h1 className="page-title">ליוויים וחוגים</h1>
        <p className="page-subtitle">כרטיסיות · פרויקטים · חוגים קבועים</p>

        {active.length === 0 ? (
          <p className="empty-state">אין ליוויים פעילים — התחילו מ«+ חדש»</p>
        ) : (
          <ul className="engagement-list">
            {active.map((e) => (
              <li key={e.id}>
                <Link to={`/engagements/${e.id}`} className="card engagement-list-row">
                  <span className="engagement-list-icon" aria-hidden>
                    {ENGAGEMENT_KIND_ICON[e.kind]}
                  </span>
                  <div>
                    <strong>{e.title}</strong>
                    <p className="engagement-list-meta">
                      {ENGAGEMENT_KIND_LABEL[e.kind]}
                      {e.kind === 'session_pack' && (
                        <> · {packProgress(e).remaining} נותרו</>
                      )}
                      {e.kind === 'recurring_group' && e.weekday != null && (
                        <> · {WEEKDAY_LABELS[e.weekday]}</>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {completed.length > 0 && (
          <>
            <h2 className="section-title" style={{ marginTop: '1.25rem' }}>
              הסתיים
            </h2>
            <ul className="engagement-list">
              {completed.slice(0, 10).map((e) => (
                <li key={e.id}>
                  <Link to={`/engagements/${e.id}`} className="card engagement-list-row muted">
                    <span>{ENGAGEMENT_KIND_ICON[e.kind]}</span>
                    <div>
                      <strong>{e.title}</strong>
                      <p className="engagement-list-meta">{e.clientName}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
