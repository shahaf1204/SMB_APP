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
    desc: 'ניהול לידים (בקרוב: Meta)',
    icon: Users,
  },
  {
    to: '/today',
    label: 'משימות',
    desc: 'היום, עתידיות והושלמו',
    icon: ListTodo,
  },
] as const;

export function MorePage() {
  return (
    <div className="app-shell">
      <div className="page">
        <h1 className="page-title">עוד</h1>

        <ul className="hub-card-list">
          {MORE_ITEMS.map(({ to, label, desc, icon: Icon }) => (
            <li key={`${to}-${label}`}>
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
