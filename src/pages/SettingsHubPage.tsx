import { Briefcase, ChevronLeft, Database, User, Zap } from 'lucide-react';
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
    to: '/settings/automation',
    label: 'אוטומציות',
    desc: 'AI, יומן ותזכורות',
    icon: Zap,
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

        <ul className="hub-card-list">
          {SETTINGS_SECTIONS.map(({ to, label, desc, icon: Icon }) => (
            <li key={to}>
              <Link to={to} className="hub-card">
                <span className="hub-card-icon" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <span className="hub-card-body">
                  <strong>{label}</strong>
                  <span className="hub-card-desc">{desc}</span>
                </span>
                <ChevronLeft size={18} className="hub-card-chevron" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <BottomNav />
    </div>
  );
}
