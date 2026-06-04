import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAccountSnapshot } from '../lib/accountArchive';
import { useStoreHydration } from '../hooks/useStoreHydration';
import { loadRememberMe, saveRememberMe } from '../lib/rememberMe';
import { useAppStore } from '../store/useAppStore';

export function AuthPage() {
  const navigate = useNavigate();
  const hydrated = useStoreHydration();
  const login = useAppStore((s) => s.login);
  const remembered = loadRememberMe();

  const [displayName, setDisplayName] = useState(remembered?.displayName ?? '');
  const [email, setEmail] = useState(remembered?.email ?? '');
  const [rememberMe, setRememberMe] = useState(remembered?.enabled ?? true);

  const archiveHint = useMemo(() => {
    if (!hydrated) return null;
    const saved = findAccountSnapshot(displayName, email);
    if (!saved?.business) return null;
    const count = saved.events?.length ?? 0;
    return { businessName: saved.business.name, eventCount: count };
  }, [displayName, email, hydrated]);

  useEffect(() => {
    if (remembered?.enabled) {
      setDisplayName(remembered.displayName);
      setEmail(remembered.email);
    }
  }, [remembered]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    if (rememberMe) {
      saveRememberMe({
        displayName: displayName.trim(),
        email: email.trim(),
        enabled: true,
      });
    }

    if (!hydrated) return;

    login(displayName.trim(), email.trim() || undefined);

    const { business, events } = useAppStore.getState();
    if (business) navigate('/dashboard');
    else if (events.length > 0) navigate('/dashboard');
    else navigate('/onboarding');
  };

  return (
    <div className="page" style={{ paddingTop: '3rem' }}>
      <h1 className="page-title">ניהול עסק</h1>
      <p className="page-subtitle">
        הנתונים נשמרים אוטומטית במכשיר — אין צורך בלחיצה על &quot;שמור&quot;
      </p>

      {archiveHint && (
        <div className="card auth-restore-hint">
          <p style={{ margin: 0, fontSize: '0.88rem' }}>
            נמצאו נתונים שמורים עבור <strong>{archiveHint.businessName}</strong>
            {archiveHint.eventCount > 0 && ` (${archiveHint.eventCount} אירועים)`}.
            התחברות תשחזר אותם.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        <div className="field">
          <label htmlFor="name">שם מלא</label>
          <input
            id="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="לדוגמה: שרה כהן"
            required
            autoComplete="name"
          />
        </div>
        <div className="field">
          <label htmlFor="email">אימייל</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
          />
          <p className="field-hint">
            חובה לאותו אימייל בכל התחברות — אחרת הנתונים לא ייקשרו למכשיר זה
          </p>
        </div>
        <label className="remember-row">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>זכור אותי במכשיר הזה</span>
        </label>
        <button type="submit" className="btn btn-primary" disabled={!hydrated}>
          {!hydrated
            ? 'טוען נתונים…'
            : archiveHint
              ? 'התחברות ושחזור נתונים'
              : 'המשך'}
        </button>
      </form>
    </div>
  );
}
