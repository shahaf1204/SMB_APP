import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAccountSnapshot } from '../lib/accountArchive';
import { findAccountByEmail } from '../lib/accountsRegistry';
import {
  cloudLogin,
  cloudRegister,
  cloudRequestPasswordReset,
  cloudUpdatePassword,
  isSupabaseConfigured,
} from '../lib/cloudAuth';
import { getSupabase } from '../lib/supabase';
import { PasswordInput } from '../components/PasswordInput';
import { useAutoLoginFromRememberMe } from '../hooks/useAutoLoginFromRememberMe';
import { useStoreHydration } from '../hooks/useStoreHydration';
import { clearRememberMe, loadRememberMe, saveRememberMe } from '../lib/rememberMe';
import { useAppStore } from '../store/useAppStore';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(remembered?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!autoLoginReady || !user || mode === 'reset' || mode === 'forgot') return;
    navigateAfterAuth(navigate);
  }, [autoLoginReady, user, navigate, mode]);

  useEffect(() => {
    if (remembered?.enabled) {
      setDisplayName(remembered.displayName);
      setEmail(remembered.email);
    }
  }, [remembered]);

  useEffect(() => {
    if (!cloudEnabled) return;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (hashParams.get('type') === 'recovery') {
      setMode('reset');
      setError(null);
      setInfo(null);
    }

    const supabase = getSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        setError(null);
        setInfo(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [cloudEnabled]);

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

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('יש להזין אימייל');
      return;
    }
    if (!hydrated) return;

    setBusy(true);
    try {
      const result = await cloudRequestPasswordReset(email.trim());
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setInfo(
        'אם קיים חשבון עם האימייל הזה, נשלח אליו קישור לאיפוס סיסמה. בדק/י גם בתיקיית הספאם.',
      );
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (password !== confirmPassword) {
      setError('הסיסמאות לא תואמות');
      return;
    }
    if (!hydrated) return;

    setBusy(true);
    try {
      const result = await cloudUpdatePassword(password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const sessionUser = useAppStore.getState().user!;
      persistRememberMe(sessionUser.displayName, sessionUser.email ?? email.trim().toLowerCase());
      setPassword('');
      setConfirmPassword('');
      navigateAfterAuth(navigate);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setInfo(null);
    setPassword('');
    setConfirmPassword('');
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
        {mode === 'forgot'
          ? 'נשלח אליך קישור לאיפוס סיסמה'
          : mode === 'reset'
            ? 'בחר/י סיסמה חדשה'
            : cloudEnabled
              ? 'הנתונים נשמרים בענן מאובטח — גישה מכל מכשיר'
              : 'הנתונים נשמרים במכשיר — אימייל מקשר בין כניסות'}
      </p>

      {(mode === 'login' || mode === 'register') && (
        <div className="chip-row auth-mode-row">
          <button
            type="button"
            className={`chip ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            התחברות
          </button>
          <button
            type="button"
            className={`chip ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            הרשמה
          </button>
        </div>
      )}

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

      {info && (
        <div className="card auth-info-hint" role="status">
          <p style={{ margin: 0, fontSize: '0.88rem' }}>{info}</p>
        </div>
      )}

      {mode === 'forgot' && cloudEnabled && (
        <form onSubmit={(e) => void handleForgotPassword(e)} className="card">
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
          <button type="submit" className="btn btn-primary" disabled={!hydrated || busy}>
            {!hydrated || busy ? 'טוען…' : 'שליחת קישור לאיפוס'}
          </button>
          <button type="button" className="auth-text-link" onClick={() => switchMode('login')}>
            חזרה להתחברות
          </button>
        </form>
      )}

      {mode === 'reset' && cloudEnabled && (
        <form onSubmit={(e) => void handleResetPassword(e)} className="card">
          <PasswordInput
            id="password"
            label="סיסמה חדשה"
            value={password}
            onChange={setPassword}
            placeholder="לפחות 6 תווים"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <PasswordInput
            id="confirm-password"
            label="אימות סיסמה"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="הקלד/י שוב את הסיסמה"
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button type="submit" className="btn btn-primary" disabled={!hydrated || busy}>
            {!hydrated || busy ? 'טוען…' : 'שמירת סיסמה חדשה'}
          </button>
        </form>
      )}

      {(mode === 'login' || mode === 'register') && (
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
          <PasswordInput
            id="password"
            label="סיסמה"
            value={password}
            onChange={setPassword}
            placeholder={mode === 'register' ? 'לפחות 6 תווים' : 'הסיסמה שלך'}
            required
            minLength={mode === 'register' ? 6 : undefined}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            footer={
              mode === 'login' ? (
                <button
                  type="button"
                  className="auth-text-link"
                  onClick={() => switchMode('forgot')}
                >
                  שכחתי סיסמה
                </button>
              ) : undefined
            }
          />
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
      )}
    </div>
  );
}
