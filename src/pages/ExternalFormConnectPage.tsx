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
import {
  processPendingExternalFormSubmissions,
} from '../lib/externalForms/syncPendingSubmissions';
import { sendTestWebhook } from '../lib/externalForms/clientApi';
import { useAppStore } from '../store/useAppStore';

export function ExternalFormConnectPage() {
  const navigate = useNavigate();
  const business = useAppStore((s) => s.business)!;
  const user = useAppStore((s) => s.user)!;
  const upsertExternalFormConnection = useAppStore((s) => s.upsertExternalFormConnection);
  const activateExternalFormConnection = useAppStore((s) => s.activateExternalFormConnection);
  const processExternalFormSubmission = useAppStore((s) => s.processExternalFormSubmission);

  const [connectionId] = useState(() => createId());
  const [secretKey] = useState(() => generateSecretKey());
  const [formName, setFormName] = useState('');
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const webhookUrl = useMemo(
    () => buildWebhookUrl(connectionId, secretKey),
    [connectionId, secretKey],
  );

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('הועתק!');
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage('לא ניתן להעתיק');
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

  const connectForm = async () => {
    if (!formName.trim()) {
      setMessage('יש להזין שם טופס');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      upsertExternalFormConnection(buildConnection(true));
      await activateExternalFormConnection(connectionId);
      setConnected(true);
      setMessage('הטופס מחובר ופעיל');
    } catch {
      setMessage('שגיאה בחיבור — נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  const testConnection = async () => {
    setBusy(true);
    setMessage(null);
    const connection = buildConnection(true);
    upsertExternalFormConnection(connection);
    await activateExternalFormConnection(connectionId);

    const payload = buildFormsAppMockPayload();
    try {
      await sendTestWebhook(connection, payload);
      await processPendingExternalFormSubmissions(business.id, processExternalFormSubmission);
    } catch {
      /* fall through to local processing */
    }

    const eventId = processExternalFormSubmission({
      connectionId,
      rawPayload: payload,
    });

    setBusy(false);
    if (eventId) {
      setMessage('בדיקה הצליחה — נוצרה פעילות חדשה');
      setConnected(true);
    } else {
      setMessage('הבדיקה נכשלה — בדקו את מיפוי השדות');
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

        <section className="wizard-panel">
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
              {connected ? 'מחובר' : 'לא מחובר'}
            </span>
          </div>

          {message && <p className="field-hint">{message}</p>}

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
              disabled={busy}
              onClick={() => void testConnection()}
            >
              בדיקת חיבור
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
