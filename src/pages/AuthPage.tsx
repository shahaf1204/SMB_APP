import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAccountSnapshot } from '../lib/accountArchive';
import { findAccountByEmail } from '../lib/accountsRegistry';
import { useAutoLoginFromRememberMe } from '../hooks/useAutoLoginFromRememberMe';
import { useStoreHydration } from '../hooks/useStoreHydration';
import { clearRememberMe, loadRememberMe, saveRememberMe } from '../lib/rememberMe';
import { useAppStore } from '../store/useAppStore';

type AuthMode = 'login' | 'register';

function navigateAfterAuth(navigate: ReturnType<typeof useNavigate>) {
  const { business, events } = useAppStore.getState();
  if (business) navigate('/dashboard', { replace: true });
  else if (events.length > 0) navigate('/dashboard', { replace: true });
  else navigate('/onboarding', { replace: true });
}

export function AuthPage() {
  const navigate = useNavigate();
  const hydrated = useStoreHydration();
  const autoLoginReady = useAutoLoginFromRememberMe();
  const user = useAppStore((s) => s.user);
  const register = useAppStore((s) => s.register);
  const loginExisting = useAppStore((s) => s.loginExisting);
  const remembered = loadRememberMe();

  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState(remembered?.displayName ?? '');
  const [email, setEmail] = useState(remembered?.email ?? '');
  const [rememberMe, setRememberMe] = useState(remembered?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoLoginReady || !user) return;
    navigateAfterAuth(navigate);
  }, [autoLoginReady, user, navigate]);

  useEffect(() => {
    if (remembered?.enabled) {
      setDisplayName(remembered.displayName);
      setEmail(remembered.email);
    }
  }, [remembered]);

  const archiveHint = useMemo(() => {
    if (!hydrated || mode !== 'login' || !email.trim()) return null;
    const saved = findAccountSnapshot(displayName, email);
    if (!saved || (!saved.business && !(saved.events?.length ?? 0))) return null;
    return {
      businessName: saved.business?.name ?? 'העסק שלך',
      eventCount: saved.events?.length ?? 0,
    };
  }, [displayName, email, hydrated, mode]);

  const persistRememberMe = (name: string, mail: string) => {
    if (rememberMe) {
      saveRememberMe({ displayName: name, email: mail, enabled: true });
    } else {
      clearRememberMe();
    }
  };

  const handleRegister = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!displayName.trim() || !email.trim()) {
      setError('יש למלא שם ואימייל');
      return;
    }
    if (!hydrated) return;

    const result = register(displayName.trim(), email.trim());
    if (!result.ok) {
      if (result.reason === 'exists') {
        setError('כבר קיים חשבון עם האימייל הזה. עברי ל«התחברות».');
      }
      return;
    }

    persistRememberMe(displayName.trim(), email.trim().toLowerCase());
    navigateAfterAuth(navigate);
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('יש להזין אימייל');
      return;
    }
    if (!hydrated) return;

    const trimmedEmail = email.trim().toLowerCase();
    const result = loginExisting(trimmedEmail, displayName.trim() || undefined);
    if (!result.ok) {
      if (result.reason === 'not_found') {
        setError('לא נמצא חשבון עם האימייל הזה. עברי ל«הרשמה» לפתיחת חשבון חדש.');
      }
      return;
    }

    const record = findAccountByEmail(trimmedEmail);
    const resolvedName = displayName.trim() || record?.displayName || trimmedEmail;
    persistRememberMe(resolvedName, trimmedEmail);
    navigateAfterAuth(navigate);
  };

  if (!autoLoginReady) {
    return (
      <div className="page" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p className="page-subtitle">טוען…</p>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingTop: '3rem' }}>
      <h1 className="page-title">ניהול עסק</h1>
      <p className="page-subtitle">
        הנתונים נשמרים במכשיר — אימייל מקשר בין כניסות
      </p>

      <div className="chip-row auth-mode-row">
        <button
          type="button"
          className={`chip ${mode === 'login' ? 'active' : ''}`}
          onClick={() => {
            setMode('login');
            setError(null);
          }}
        >
          התחברות
        </button>
        <button
          type="button"
          className={`chip ${mode === 'register' ? 'active' : ''}`}
          onClick={() => {
            setMode('register');
            setError(null);
          }}
        >
          הרשמה
        </button>
      </div>

      {archiveHint && (
        <div className="card auth-restore-hint">
          <p style={{ margin: 0, fontSize: '0.88rem' }}>
            נמצאו נתונים שמורים עבור <strong>{archiveHint.businessName}</strong>
            {archiveHint.eventCount > 0 && ` (${archiveHint.eventCount} אירועים)`}.
            התחברות תשחזר אותם.
          </p>
        </div>
      )}

      {error && (
        <div className="card auth-error-hint" role="alert">
          <p style={{ margin: 0, fontSize: '0.88rem' }}>{error}</p>
        </div>
      )}

      <form
        onSubmit={mode === 'register' ? handleRegister : handleLogin}
        className="card"
      >
        {mode === 'register' && (
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
        )}

        <div className="field">
          <label htmlFor="email">אימייל</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            autoComplete="email"
          />
          {mode === 'login' && (
            <p className="field-hint">
              הזיני את אותו אימייל שבו נרשמת — כך ישוחזרו האירועים והעסק
            </p>
          )}
        </div>

        {mode === 'login' && (
          <div className="field">
            <label htmlFor="login-name">שם (אופציונלי)</label>
            <input
              id="login-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="מעדכן את שם התצוגה"
              autoComplete="name"
            />
          </div>
        )}

        <label className="remember-row">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>זכור אותי — כניסה אוטומטית בפעם הבאה</span>
        </label>

        <button type="submit" className="btn btn-primary" disabled={!hydrated}>
          {!hydrated
            ? 'טוען נתונים…'
            : mode === 'register'
              ? 'יצירת חשבון חדש'
              : archiveHint
                ? 'התחברות ושחזור נתונים'
                : 'התחברות'}
        </button>
      </form>
    </div>
  );
}
