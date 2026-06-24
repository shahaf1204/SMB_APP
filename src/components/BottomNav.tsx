import {
  LayoutDashboard,
  Layers,
  FileText,
  ListTodo,
  Settings,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { to: '/activities', label: 'פעילויות', icon: Layers },
  { to: '/invoices', label: 'חשבוניות', icon: FileText },
  { to: '/today', label: 'משימות', icon: ListTodo },
  { to: '/settings', label: 'הגדרות', icon: Settings },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav-wrap" aria-label="ניווט ראשי">
      <div className="bottom-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive =
            pathname === to ||
            (to === '/activities' &&
              (pathname.startsWith('/engagements') ||
                pathname.startsWith('/create') ||
                pathname.startsWith('/events'))) ||
            (to === '/invoices' && pathname.startsWith('/invoices')) ||
            (to === '/today' && pathname === '/today');

          return (
            <NavLink
              key={to}
              to={to}
              className={isActive ? 'active' : ''}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="nav-icon-wrap">
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.75} />
              </span>
              <span className="nav-label">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
