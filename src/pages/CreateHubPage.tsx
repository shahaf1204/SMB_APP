import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import {
  PRIMARY_WORK_MODEL_LABEL,
  resolvePrimaryWorkModel,
  sortCreateOptions,
} from '../lib/workModel';
import { useAppStore } from '../store/useAppStore';

const OPTIONS = [
  {
    to: '/create/event',
    icon: '📅',
    title: 'אירוע בודד',
    desc: 'תאריך אחד, תשלום אחד — צילום, יום הולדת',
  },
  {
    to: '/create/pack',
    icon: '🎫',
    title: 'כרטיסייה',
    desc: 'תשלום מראש · מונה כניסות — סטודיו, אימון',
  },
  {
    to: '/create/project',
    icon: '📋',
    title: 'ליווי / פרויקט',
    desc: 'לאורך זמן · אבני דרך · חשבוניות לפי תפוקה',
  },
  {
    to: '/create/group',
    icon: '👥',
    title: 'חוג / קבוצה',
    desc: 'יום קבוע · תלמידים · תשלום לכל שיעור',
  },
] as const;

export function CreateHubPage() {
  const business = useAppStore((s) => s.business);
  const workModel = resolvePrimaryWorkModel(business);
  const sorted = sortCreateOptions(OPTIONS, workModel);
  const primaryRoute =
    workModel === 'single_event'
      ? '/create/event'
      : workModel === 'session_pack'
        ? '/create/pack'
        : workModel === 'recurring_group'
          ? '/create/group'
          : workModel === 'project'
            ? '/create/project'
            : null;

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">מה יוצרים?</h1>
        <p className="page-subtitle">
          {workModel === 'mixed'
            ? 'בחרו את סוג העבודה'
            : `מומלץ עבור ${PRIMARY_WORK_MODEL_LABEL[workModel]} — אפשר גם שאר הסוגים`}
        </p>

        {primaryRoute && (
          <Link to={primaryRoute} className="btn btn-primary create-hub-primary-btn">
            יצירה מהירה — {PRIMARY_WORK_MODEL_LABEL[workModel]}
          </Link>
        )}

        <div className="create-hub-list">
          {sorted.map((opt) => (
            <Link
              key={opt.to}
              to={opt.to}
              className={`card create-hub-card ${primaryRoute === opt.to ? 'create-hub-card-primary' : ''}`}
            >
              <span className="create-hub-icon" aria-hidden>
                {opt.icon}
              </span>
              <div>
                <strong>
                  {opt.title}
                  {primaryRoute === opt.to && (
                    <span className="create-hub-badge">מומלץ</span>
                  )}
                </strong>
                <p className="create-hub-desc">{opt.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <Link to="/engagements" className="create-hub-link">
          ליוויים, כרטיסיות וחוגים פעילים ←
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
