import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAccountSnapshot } from '../lib/accountArchive';
import { findAccountByEmail } from '../lib/accountsRegistry';
import {
  cloudLogin,
  cloudRegister,
  isSupabaseConfigured,
} from '../lib/cloudAuth';
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
  const cloudEnabled = isSupabaseConfigured();

  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState(remembered?.displayName ?? '');
  const [email, setEmail] = useState(remembered?.email ?? '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(remembered?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (!hydrated || mode !== 'login' || !email.trim() || cloudEnabled) return null;
    const saved = findAccountSnapshot(displayName, email);
    if (!saved || (!saved.business && !(saved.events?.length ?? 0))) return null;
    return {
      businessName: saved.business?.name ?? 'העסק שלך',
      eventCount: saved.events?.length ?? 0,
    };
  }, [displayName, email, hydrated, mode, cloudEnabled]);

  const persistRememberMe = (name: string, mail: string) => {
    if (rememberMe) {
      saveRememberMe({ displayName: name, email: mail, enabled: true });
    } else {
      clearRememberMe();
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!displayName.trim() || !email.trim()) {
      setError('יש למלא שם ואימייל');
      return;
    }
    if (cloudEnabled && password.length < 6) {
      setError('יש לבחור סיסמה של לפחות 6 תווים');
      return;
    }
    if (!hydrated) return;

    setBusy(true);
    try {
      if (cloudEnabled) {
        const result = await cloudRegister(displayName.trim(), email.trim(), password);
        if (!result.ok) {
          setError(result.message);
          return;
        }
      } else {
        const result = register(displayName.trim(), email.trim());
        if (!result.ok) {
          if (result.reason === 'exists') {
            setError('כבר קיים חשבון עם האימייל הזה. עברי ל«התחברות».');
          }
          return;
        }
      }

      persistRememberMe(displayName.trim(), email.trim().toLowerCase());
      navigateAfterAuth(navigate);
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('יש להזין אימייל');
      return;
    }
    if (cloudEnabled && !password) {
      setError('יש להזין סיסמה');
      return;
    }
    if (!hydrated) return;

    setBusy(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();

      if (cloudEnabled) {
        const result = await cloudLogin(trimmedEmail, password);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        const sessionUser = useAppStore.getState().user!;
        persistRememberMe(sessionUser.displayName, trimmedEmail);
      } else {
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
      }

      navigateAfterAuth(navigate);
    } finally {
      setBusy(false);
    }
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
        {cloudEnabled
          ? 'הנתונים נשמרים בענן מאובטח — גישה מכל מכשיר'
          : 'הנתונים נשמרים במכשיר — אימייל מקשר בין כניסות'}
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

      {cloudEnabled && mode === 'login' && (
        <div className="card auth-restore-hint">
          <p style={{ margin: 0, fontSize: '0.88rem' }}>
            יש לך נתונים ישנים במכשיר? התחבר/י עם אותו אימייל — הם יועלו לענן אוטומטית.
          </p>
        </div>
      )}

      {error && (
        <div className="card auth-error-hint" role="alert">
          <p style={{ margin: 0, fontSize: '0.88rem' }}>{error}</p>
        </div>
      )}

      <form
        onSubmit={(e) => void (mode === 'register' ? handleRegister(e) : handleLogin(e))}
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
        </div>

        {cloudEnabled && (
          <div className="field">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'לפחות 6 תווים' : 'הסיסמה שלך'}
              required
              minLength={mode === 'register' ? 6 : undefined}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </div>
        )}

        {mode === 'login' && !cloudEnabled && (
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

        <button type="submit" className="btn btn-primary" disabled={!hydrated || busy}>
          {!hydrated || busy
            ? 'טוען…'
            : mode === 'register'
              ? 'יצירת חשבון חדש'
              : cloudEnabled
                ? 'התחברות'
                : archiveHint
                  ? 'התחברות ושחזור נתונים'
                  : 'התחברות'}
        </button>
      </form>
    </div>
  );
}
