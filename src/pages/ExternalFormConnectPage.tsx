import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { createId } from '../lib/ids';
import {
  buildWebhookUrl,
  generateSecretKey,
} from '../lib/externalForms/connectionWebhook';
import { FORMS_APP_SPRINT_MAPPING } from '../lib/externalForms/sprintMapping';
import { buildFormsAppMockPayload } from '../lib/externalForms/mockSubmission';
import { registerExternalFormConnection, sendTestWebhook } from '../lib/externalForms/clientApi';
import { refreshFromCloudIfNewer } from '../lib/cloudSync';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

function registerErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'לא ניתן להגיע לשרת — ודאי שהאפליקציה פרוסה ב-Vercel';
    }
    return error.message;
  }
  return 'שגיאה בחיבור — נסו שוב';
}

export function ExternalFormConnectPage() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business)!;
  const user = useAppStore((s) => s.user)!;
  const storeUpsert = useAppStore((s) => s.upsertExternalFormConnection);
  const storeActivate = useAppStore((s) => s.activateExternalFormConnection);

  const [connectionId] = useState(() => createId());
  const [secretKey] = useState(() => generateSecretKey());
  const [formName, setFormName] = useState('');
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<'ok' | 'err' | null>(null);

  const cloudReady = isSupabaseConfigured();
  const webhookUrl = useMemo(
    () => buildWebhookUrl(connectionId, secretKey),
    [connectionId, secretKey],
  );

  const showMessage = (text: string, kind: 'ok' | 'err') => {
    setMessage(text);
    setMessageKind(kind);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showMessage('הועתק!', 'ok');
      setTimeout(() => {
        setMessage(null);
        setMessageKind(null);
      }, 2000);
    } catch {
      showMessage('לא ניתן להעתיק', 'err');
    }
  };

  const buildConnection = (active: boolean) => ({
    id: connectionId,
    businessId: business.id,
    ownerId: user.id,
    provider: 'forms_app' as const,
    formName: formName.trim() || 'Forms.app',
    webhookUrl,
    secretKey,
    activityType: 'event' as const,
    isActive: active,
    fieldMapping: FORMS_APP_SPRINT_MAPPING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissionCount: 0,
  });

  const ensureCloudSession = async (): Promise<boolean> => {
    if (!cloudReady) {
      showMessage('חיבור טפסים דורש התחברות עם אימייל וסיסמה (Supabase)', 'err');
      return false;
    }
    try {
      const { data } = await getSupabase().auth.getSession();
      if (!data.session?.user?.id) {
        showMessage('יש להתחבר עם אימייל וסיסמה לפני חיבור טופס', 'err');
        return false;
      }
      if (data.session.user.id !== user.id) {
        showMessage('זוהה חשבון שונה — התנתקי והתחברי מחדש', 'err');
        return false;
      }
    } catch {
      showMessage('לא ניתן לוודא התחברות לענן', 'err');
      return false;
    }
    return true;
  };

  const connectForm = async () => {
    if (!formName.trim()) {
      showMessage('יש להזין שם טופס', 'err');
      return;
    }
    if (!(await ensureCloudSession())) return;

    setBusy(true);
    setMessage(null);
    setMessageKind(null);
    try {
      storeUpsert(buildConnection(true));
      await storeActivate(connectionId);
      setConnected(true);
      showMessage('החיבור נשמר בשרת — העתיקי את קישור ה-Webhook ל-forms.app', 'ok');
    } catch (e) {
      showMessage(registerErrorMessage(e), 'err');
    } finally {
      setBusy(false);
    }
  };

  const testConnection = async () => {
    if (!formName.trim()) {
      showMessage('יש להזין שם טופס', 'err');
      return;
    }
    if (!(await ensureCloudSession())) return;

    setBusy(true);
    setMessage(null);
    setMessageKind(null);
    const connection = buildConnection(true);

    try {
      storeUpsert(connection);
      await registerExternalFormConnection(connection);

      const payload = buildFormsAppMockPayload();
      const res = await sendTestWebhook(connection, payload);
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        activityId?: string;
      };

      if (!res.ok) {
        showMessage(body.error ?? `השרת החזיר שגיאה (${res.status})`, 'err');
        return;
      }
      if (!body.ok) {
        showMessage(body.error ?? 'השרת קיבל את הבקשה אך לא יצר פעילות', 'err');
        return;
      }

      await refreshFromCloudIfNewer();
      setConnected(true);
      showMessage(
        body.activityId
          ? 'בדיקה הצליחה — נוצרה פעילות בשרת. בדקי במסך פעילויות'
          : 'השרת אישר את הבקשה — רענני את מסך הפעילויות',
        'ok',
      );
    } catch (e) {
      showMessage(registerErrorMessage(e), 'err');
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    navigate('/settings/external-forms');
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings/external-forms" className="back-link">
          ← טפסים חיצוניים
        </Link>
        <h1 className="page-title">חיבור Forms.app</h1>
        <p className="page-subtitle">
          הדביקי את קישור ה-Webhook ב-forms.app — כל מילוי ייצור פעילות אוטומטית
        </p>

        {!cloudReady && (
          <p className="provider-card-error">
            חיבור טפסים אמיתי דורש התחברות עם אימייל וסיסמה (לא רק שם משתמש מקומי).
          </p>
        )}

        <section className="wizard-panel">
          <h2 className="section-title-sm">שלבים</h2>
          <ol className="connect-steps">
            <li>הזיני שם לטופס ולחצי «חיבור טופס» — חייב להופיע «החיבור נשמר בשרת»</li>
            <li>העתיקי את קישור ה-Webhook</li>
            <li>
              ב-forms.app: פתחי את הטופס → Integrations / Webhooks → הוסיפי Webhook → הדביקי
              את הקישור
            </li>
            <li>לחצי «בדיקת חיבור לשרת» — אם הצליח, תופיע פעילות במסך פעילויות</li>
            <li>מילוי אמיתי ב-forms.app יגיע תוך ~30 שניות (או אחרי «רענון מהענן»)</li>
          </ol>

          <div className="field">
            <label htmlFor="form-name">שם הטופס</label>
            <input
              id="form-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="למשל: טופס הזמנת יום הולדת"
            />
          </div>

          <div className="field">
            <label>קישור Webhook</label>
            <div className="webhook-copy-box">
              <code>{webhookUrl}</code>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => void copyText(webhookUrl)}
            >
              העתקת קישור
            </button>
          </div>

          <div className="field">
            <label>סטטוס חיבור</label>
            <span
              className={`provider-status ${connected ? 'provider-status--on' : ''}`}
            >
              {connected ? 'מחובר לשרת' : 'טרם נשמר בשרת'}
            </span>
          </div>

          {message && (
            <p
              className={
                messageKind === 'err' ? 'provider-card-error' : 'field-hint'
              }
            >
              {message}
            </p>
          )}

          <div className="wizard-btn-row">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !formName.trim()}
              onClick={() => void connectForm()}
            >
              חיבור טופס
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy || !formName.trim()}
              onClick={() => void testConnection()}
            >
              בדיקת חיבור לשרת
            </button>
          </div>

          {connected && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={finish}>
              חזרה לרשימת טפסים
            </button>
          )}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
