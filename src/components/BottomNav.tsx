import { NavLink } from 'react-router-dom';

export function BottomNav() {
  return (
    <nav className="bottom-nav bottom-nav-scroll" aria-label="ניווט ראשי">
      <NavLink to="/today" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon" aria-hidden>
          ✅
        </span>
        <span className="nav-label">היום</span>
      </NavLink>
      <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon" aria-hidden>
          📊
        </span>
        <span className="nav-label">דשבורד</span>
      </NavLink>
      <NavLink to="/leads" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon" aria-hidden>
          📣
        </span>
        <span className="nav-label">לידים</span>
      </NavLink>
      <NavLink to="/events/new" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon nav-icon-main" aria-hidden>
          ➕
        </span>
        <span className="nav-label">אירוע</span>
      </NavLink>
      <NavLink to="/assistant" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon" aria-hidden>
          🤖
        </span>
        <span className="nav-label">עוזר</span>
      </NavLink>
      <NavLink to="/invoices" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon" aria-hidden>
          🧾
        </span>
        <span className="nav-label">חשבוניות</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon" aria-hidden>
          ⚙️
        </span>
        <span className="nav-label">הגדרות</span>
      </NavLink>
    </nav>
  );
}
