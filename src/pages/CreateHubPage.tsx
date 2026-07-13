import { Link } from 'react-router-dom';
import { Calendar, ClipboardList, Ticket, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

const OPTIONS: Array<{
  to: string;
  id: 'single_event' | 'session_pack' | 'project' | 'recurring_group';
  icon: LucideIcon;
  title: string;
  desc: string;
}> = [
  {
    to: '/create/event',
    id: 'single_event',
    icon: Calendar,
    title: 'אירוע בודד',
    desc: 'תאריך אחד, תשלום אחד — צילום, יום הולדת',
  },
  {
    to: '/create/pack',
    id: 'session_pack',
    icon: Ticket,
    title: 'כרטיסייה',
    desc: 'תשלום מראש · מונה כניסות — סטודיו, אימון',
  },
  {
    to: '/create/project',
    id: 'project',
    icon: ClipboardList,
    title: 'ליווי / פרויקט',
    desc: 'לאורך זמן · אבני דרך · חשבוניות לפי תפוקה',
  },
  {
    to: '/create/group',
    id: 'recurring_group',
    icon: Users,
    title: 'חוג / קבוצה',
    desc: 'יום קבוע · תלמידים · תשלום לכל שיעור',
  },
];

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
            const Icon = opt.icon;
            return (
              <Link
                key={opt.to}
                to={opt.to}
                className={`card create-hub-card ${recommended ? 'create-hub-card-primary' : ''}`}
              >
                <span className="create-hub-icon-wrap" aria-hidden>
                  <Icon size={22} strokeWidth={2} />
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
