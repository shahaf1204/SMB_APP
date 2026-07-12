import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileInput } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/ui/EmptyState';
import {
  EXTERNAL_FORM_PROVIDER_LABELS,
  type ExternalFormConnection,
} from '../types/externalForms';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../lib/finance';
import { buildFormsAppMockPayload } from '../lib/externalForms/mockSubmission';
import { refreshFromCloudIfNewer } from '../lib/cloudSync';
import { isSupabaseConfigured } from '../lib/supabase';

export function ExternalFormsPage() {
  const business = useAppStore((s) => s.business)!;
  const connections = useAppStore((s) => s.externalFormConnections).filter(
    (c) => c.businessId === business.id,
  );
  const clearAllExternalFormConnections = useAppStore((s) => s.clearAllExternalFormConnections);
  const [resetBusy, setResetBusy] = useState(false);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [pageMessage, setPageMessage] = useState<string | null>(null);

  const resetAll = () => {
    if (
      !window.confirm(
        'למחוק את כל חיבורי הטפסים ולהתחיל מחדש? פעולה זו לא מוחקת פעילויות שכבר נוצרו.',
      )
    ) {
      return;
    }
    setResetBusy(true);
    clearAllExternalFormConnections();
    setResetBusy(false);
    setPageMessage('כל החיבורים נמחקו — לחצי «+ חיבור טופס» כדי להתחיל מחדש');
  };

  const refreshActivities = async () => {
    setRefreshBusy(true);
    setPageMessage(null);
    try {
      const pulled = await refreshFromCloudIfNewer();
      setPageMessage(
        pulled
          ? 'נמצאו פעילויות חדשות מהענן — בדקי במסך פעילויות'
          : 'אין פעילויות חדשות מהענן כרגע',
      );
    } catch {
      setPageMessage('לא הצלחנו לרענן מהענן — ודאי שאת מחוברת עם אימייל וסיסמה');
    } finally {
      setRefreshBusy(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/sources" className="back-link">
          ← מקורות כניסה
        </Link>
        <div className="page-top-row">
          <div>
            <h1 className="page-title">טפסים חיצוניים</h1>
            <p className="page-subtitle">
              חברי טפסים מ-forms.app — כל מילוי ייצור פעילות אוטומטית
            </p>
          </div>
          <Link to="/sources/forms/new" className="btn btn-primary btn-sm">
            + חיבור טופס
          </Link>
        </div>

        {connections.length === 0 ? (
          <EmptyState
            icon={FileInput}
            title="עדיין לא חיברת טפסים"
            message="חברי טופס forms.app כדי שכל מילוי ייצור פעילות אוטומטית — בלי העתקה ידנית"
            actionLabel="חיבור טופס"
            actionTo="/sources/forms/new"
          />
        ) : (
          <>
            <div className="wizard-btn-row" style={{ marginBottom: '1rem' }}>
              {isSupabaseConfigured() && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={refreshBusy}
                  onClick={() => void refreshActivities()}
                >
                  {refreshBusy ? 'מרענן…' : 'רענון פעילויות מהענן'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={resetBusy}
                onClick={resetAll}
              >
                {resetBusy ? 'מוחק…' : 'התחלה מחדש (מחק הכל)'}
              </button>
            </div>
            <ul className="external-form-list">
              {connections.map((conn) => (
                <li key={conn.id}>
                  <FormConnectionCard connection={conn} />
                </li>
              ))}
            </ul>
            <p className="page-subtitle" style={{ marginTop: '1rem' }}>
              מילוי טופס אמיתי ב-Forms.app יוצר פעילות בענן. לחצי «רענון פעילויות מהענן» או
              פתחי מחדש את האפליקציה כדי לראות פעילויות חדשות.
            </p>
          </>
        )}
        {pageMessage && <p className="field-hint">{pageMessage}</p>}
      </div>
      <BottomNav />
    </div>
  );
}

function FormConnectionCard({ connection }: { connection: ExternalFormConnection }) {
  const processExternalFormSubmission = useAppStore((s) => s.processExternalFormSubmission);
  const removeExternalFormConnection = useAppStore((s) => s.removeExternalFormConnection);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(connection.webhookUrl);
      setMessage('קישור הועתק');
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage('לא ניתן להעתיק');
    }
  };

  const simulateSubmission = async () => {
    setBusy(true);
    setMessage(null);
    const payload = buildFormsAppMockPayload();
    const eventId = processExternalFormSubmission({
      connectionId: connection.id,
      rawPayload: payload,
    });
    setBusy(false);
    setMessage(
      eventId
        ? 'נוצרה פעילות סימולציה מקומית — בדקו במסך פעילויות'
        : 'הסימולציה נכשלה — בדקו את מיפוי השדות',
    );
  };

  const deleteConnection = () => {
    if (!window.confirm(`למחוק את החיבור «${connection.formName}»?`)) return;
    removeExternalFormConnection(connection.id);
  };

  return (
    <article className="card external-form-card">
      <div className="external-form-card-head">
        <div>
          <strong>{connection.formName}</strong>
          <p className="external-form-card-meta">
            {EXTERNAL_FORM_PROVIDER_LABELS[connection.provider]}
          </p>
        </div>
        <span
          className={`provider-status ${connection.isActive ? 'provider-status--on' : ''}`}
        >
          {connection.isActive ? 'פעיל' : 'לא פעיל'}
        </span>
      </div>
      <p className="external-form-card-stats">
        {connection.submissionCount} מילויים מקומיים
        {connection.lastSubmissionAt &&
          ` · אחרון: ${formatDate(connection.lastSubmissionAt.slice(0, 10))}`}
      </p>
      <div className="webhook-copy-box">
        <code>{connection.webhookUrl}</code>
      </div>
      <div className="wizard-btn-row">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => void copyWebhook()}>
          העתקת Webhook
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={busy}
          onClick={() => void simulateSubmission()}
        >
          סימולציה מקומית
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={deleteConnection}>
          מחיקה
        </button>
      </div>
      {message && <p className="field-hint">{message}</p>}
      <Link to={`/sources/forms/${connection.id}`} className="btn btn-ghost btn-sm">
        ניהול
      </Link>
    </article>
  );
}
