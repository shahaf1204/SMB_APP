import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

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
  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">מה יוצרים?</h1>
        <p className="page-subtitle">בחרו את סוג העבודה — אפשר תמיד אירוע בודד בנפרד</p>

        <div className="create-hub-list">
          {OPTIONS.map((opt) => (
            <Link key={opt.to} to={opt.to} className="card create-hub-card">
              <span className="create-hub-icon" aria-hidden>
                {opt.icon}
              </span>
              <div>
                <strong>{opt.title}</strong>
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
