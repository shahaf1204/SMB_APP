import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import {
  CREATE_ROUTES,
  isRecommendedCreateRoute,
  resolveWorkModels,
  sortCreateOptions,
  WORK_CONCEPT_LABEL,
  workModelsLabel,
} from '../lib/workModel';
import { useAppStore } from '../store/useAppStore';

const OPTIONS = [
  {
    to: '/create/event',
    id: 'single_event' as const,
    icon: '📅',
    title: 'אירוע בודד',
    desc: 'תאריך אחד, תשלום אחד — צילום, יום הולדת',
  },
  {
    to: '/create/pack',
    id: 'session_pack' as const,
    icon: '🎫',
    title: 'כרטיסייה',
    desc: 'תשלום מראש · מונה כניסות — סטודיו, אימון',
  },
  {
    to: '/create/project',
    id: 'project' as const,
    icon: '📋',
    title: 'ליווי / פרויקט',
    desc: 'לאורך זמן · אבני דרך · חשבוניות לפי תפוקה',
  },
  {
    to: '/create/group',
    id: 'recurring_group' as const,
    icon: '👥',
    title: 'חוג / קבוצה',
    desc: 'יום קבוע · תלמידים · תשלום לכל שיעור',
  },
] as const;

export function CreateHubPage() {
  const business = useAppStore((s) => s.business);
  const workModels = resolveWorkModels(business);
  const sorted = sortCreateOptions(OPTIONS, workModels);
  const multi = workModels.length > 1;

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">מה יוצרים?</h1>
        <p className="page-subtitle">
          {multi
            ? `מותאם ל: ${workModelsLabel(workModels)}`
            : `מותאם ל: ${WORK_CONCEPT_LABEL[workModels[0] ?? 'single_event']}`}
        </p>

        {workModels.length > 0 && (
          <div className="create-hub-quick-row">
            {workModels.map((m) => (
              <Link
                key={m}
                to={CREATE_ROUTES[m]}
                className="btn btn-primary create-hub-quick-btn"
              >
                + {WORK_CONCEPT_LABEL[m]}
              </Link>
            ))}
          </div>
        )}

        <div className="create-hub-list">
          {sorted.map((opt) => {
            const recommended = isRecommendedCreateRoute(opt.to, workModels);
            return (
              <Link
                key={opt.to}
                to={opt.to}
                className={`card create-hub-card ${recommended ? 'create-hub-card-primary' : ''}`}
              >
                <span className="create-hub-icon" aria-hidden>
                  {opt.icon}
                </span>
                <div>
                  <strong>
                    {opt.title}
                    {recommended && <span className="create-hub-badge">בשימוש</span>}
                  </strong>
                  <p className="create-hub-desc">{opt.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <Link to="/engagements" className="create-hub-link">
          ליוויים, כרטיסיות וחוגים פעילים ←
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
