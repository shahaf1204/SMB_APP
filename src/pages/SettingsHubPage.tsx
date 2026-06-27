import { Briefcase, ChevronLeft, Database, FileInput, Plug, User, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { useAppStore } from '../store/useAppStore';

const SETTINGS_SECTIONS = [
  {
    to: '/settings/business',
    label: 'העסק שלי',
    desc: 'קונספט עבודה, תבניות והגדרות',
    icon: Briefcase,
  },
  {
    to: '/settings/connections',
    label: 'חיבורים',
    desc: 'חשבוניות, יומן, שיווק ותקשורת',
    icon: Plug,
  },
  {
    to: '/settings/external-forms',
    label: 'טפסים חיצוניים',
    desc: 'מילוי טופס → פעילות אוטומטית',
    icon: FileInput,
  },
  {
    to: '/settings/automation',
    label: 'אוטומציות',
    desc: 'AI, יומן ותזכורות',
    icon: Zap,
    badge: 'Beta',
  },
  {
    to: '/settings/data',
    label: 'נתונים',
    desc: 'ייבוא, יצוא וגיבוי',
    icon: Database,
  },
  {
    to: '/settings/account',
    label: 'חשבון',
    desc: 'משתמש, מנוי והתנתקות',
    icon: User,
  },
] as const;

export function SettingsHubPage() {
  const business = useAppStore((s) => s.business)!;

  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">הגדרות</h1>
        <p className="page-subtitle">{business.name}</p>

        <ul className="hub-card-list hub-card-list--lg">
          {SETTINGS_SECTIONS.map(({ to, label, desc, icon: Icon, ...rest }) => (
            <li key={to}>
              <Link to={to} className="hub-card hub-card--lg">
                <span className="hub-card-icon hub-card-icon--lg" aria-hidden>
                  <Icon size={24} strokeWidth={1.75} />
                </span>
                <span className="hub-card-body">
                  <span className="hub-card-title-row">
                    <strong>{label}</strong>
                    {'badge' in rest && rest.badge && (
                      <span className="hub-badge">{rest.badge}</span>
                    )}
                  </span>
                  <span className="hub-card-desc">{desc}</span>
                </span>
                <ChevronLeft size={20} className="hub-card-chevron" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <BottomNav />
    </div>
  );
}
