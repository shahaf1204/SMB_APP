import {
  LayoutDashboard,
  Layers,
  FileText,
  MoreHorizontal,
  Users,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'דשבורד', icon: LayoutDashboard },
  { to: '/activities', label: 'פעילויות', icon: Layers },
  { to: '/customers', label: 'לקוחות', icon: Users },
  { to: '/invoices', label: 'חשבוניות', icon: FileText },
  { to: '/more', label: 'עוד', icon: MoreHorizontal },
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
            (to === '/customers' && pathname.startsWith('/customers')) ||
            (to === '/invoices' && pathname.startsWith('/invoices')) ||
            (to === '/more' &&
              (pathname === '/settings' ||
                pathname.startsWith('/settings/') ||
                pathname === '/today' ||
                pathname === '/assistant' ||
                pathname.startsWith('/leads') ||
                pathname === '/more'));

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
