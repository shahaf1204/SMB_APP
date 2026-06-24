import {
  Bot,
  ChevronLeft,
  Database,
  HardDrive,
  ListTodo,
  Settings,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

const MORE_ITEMS = [
  {
    to: '/settings',
    label: 'הגדרות',
    desc: 'עסק, אוטומציות, חשבון',
    icon: Settings,
  },
  {
    to: '/assistant',
    label: 'עוזר AI',
    desc: 'שיחה חכמה ועזרה יומיומית',
    icon: Bot,
    badge: 'Beta',
  },
  {
    to: '/settings/data',
    label: 'ייבוא נתונים',
    desc: 'CSV, גיבוי ושחזור',
    icon: Database,
  },
  {
    to: '/settings/data',
    label: 'גיבויים',
    desc: 'הורדה ושחזור JSON',
    icon: HardDrive,
  },
  {
    to: '/leads',
    label: 'CRM — לידים',
    desc: 'ניהול לידים מ-Meta ובעתיד',
    icon: Users,
    badge: 'בקרוב',
  },
  {
    to: '/today',
    label: 'משימות',
    desc: 'היום, השבוע והושלמו',
    icon: ListTodo,
  },
] as const;

export function MorePage() {
  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">עוד</h1>

        <ul className="hub-card-list hub-card-list--lg">
          {MORE_ITEMS.map(({ to, label, desc, icon: Icon, ...rest }) => (
            <li key={`${to}-${label}`}>
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
