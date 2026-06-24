import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { flushCloudPush, cloudSignOut } from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export function SettingsAccountPage() {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    const message = isSupabaseConfigured()
      ? 'להתנתק? הנתונים נשמרים בענן.'
      : 'להתנתק? כדי לחזור תצטרכ/י להתחבר שוב.';
    if (!window.confirm(message)) return;

    setLoggingOut(true);
    try {
      if (isSupabaseConfigured()) {
        await flushCloudPush();
        await cloudSignOut();
      }
      logout();
      navigate('/auth', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings" className="back-link">
          ← הגדרות
        </Link>
        <h1 className="page-title">חשבון</h1>

        <section className="card">
          {user?.email && (
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              <strong>{user.displayName}</strong>
              {user.email ? ` · ${user.email}` : ''}
            </p>
          )}
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            מנוי: חינמי
          </p>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%' }}
            disabled={loggingOut}
            onClick={() => void handleLogout()}
          >
            {loggingOut ? 'מתנתק/ת…' : 'התנתקות'}
          </button>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
