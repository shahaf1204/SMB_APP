import { NavLink, useLocation } from 'react-router-dom';
import { NavIcon } from './NavIcons';

const NAV_ITEMS = [
  { to: '/today', label: 'היום', icon: 'today' as const },
  { to: '/dashboard', label: 'דשבורד', icon: 'dashboard' as const },
  { to: '/leads', label: 'לידים', icon: 'leads' as const },
  { to: '/create', label: 'חדש', icon: 'create' as const, fab: true },
  { to: '/assistant', label: 'עוזר', icon: 'assistant' as const },
  { to: '/invoices', label: 'חשבוניות', icon: 'invoices' as const },
  { to: '/settings', label: 'הגדרות', icon: 'settings' as const },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const createActive =
    pathname.startsWith('/create') || pathname === '/events/new';

  return (
    <nav className="bottom-nav-wrap" aria-label="ניווט ראשי">
      <div className="bottom-nav bottom-nav-scroll">
        {NAV_ITEMS.map((item) => {
          const isActive = item.fab
            ? createActive
            : pathname === item.to || pathname.startsWith(`${item.to}/`);

          if (item.fab) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`bottom-nav-fab ${createActive ? 'active' : ''}`}
                aria-label={item.label}
              >
                <span className="bottom-nav-fab-btn">
                  <NavIcon name="create" />
                </span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={isActive ? 'active' : ''}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="nav-icon-wrap">
                <NavIcon name={item.icon} active={isActive} />
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
