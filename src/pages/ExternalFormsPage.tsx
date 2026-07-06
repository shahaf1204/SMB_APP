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
import { sendTestWebhook } from '../lib/externalForms/clientApi';
import { processPendingExternalFormSubmissions } from '../lib/externalForms/syncPendingSubmissions';

export function ExternalFormsPage() {
  const business = useAppStore((s) => s.business)!;
  const connections = useAppStore((s) => s.externalFormConnections).filter(
    (c) => c.businessId === business.id,
  );

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings" className="back-link">
          ← הגדרות
        </Link>
        <div className="page-top-row">
          <div>
            <h1 className="page-title">טפסים חיצוניים</h1>
            <p className="page-subtitle">
              חברי טפסים מ-forms.app — כל מילוי ייצור פעילות אוטומטית
            </p>
          </div>
          <Link to="/settings/external-forms/new" className="btn btn-primary btn-sm">
            + חיבור טופס
          </Link>
        </div>

        {connections.length === 0 ? (
          <EmptyState
            icon={FileInput}
            title="עדיין לא חיברת טפסים"
            message="חברי טופס forms.app כדי שכל מילוי ייצור פעילות אוטומטית — בלי העתקה ידנית"
            actionLabel="חיבור טופס"
            actionTo="/settings/external-forms/new"
          />
        ) : (
          <ul className="external-form-list">
            {connections.map((conn) => (
              <li key={conn.id}>
                <FormConnectionCard connection={conn} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function FormConnectionCard({ connection }: { connection: ExternalFormConnection }) {
  const business = useAppStore((s) => s.business)!;
  const processExternalFormSubmission = useAppStore((s) => s.processExternalFormSubmission);
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

    try {
      await sendTestWebhook(connection, payload);
      await processPendingExternalFormSubmissions(business.id, processExternalFormSubmission);
    } catch {
      /* local fallback below */
    }

    const eventId = processExternalFormSubmission({
      connectionId: connection.id,
      rawPayload: payload,
    });

    setBusy(false);
    setMessage(
      eventId
        ? 'נוצרה פעילות — בדקו במסך פעילויות'
        : 'הסימולציה נכשלה — בדקו את מיפוי השדות',
    );
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
        {connection.submissionCount} מילויים
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
          סימולציית Forms.app
        </button>
      </div>
      {message && <p className="field-hint">{message}</p>}
      <Link to={`/settings/external-forms/${connection.id}`} className="btn btn-ghost btn-sm">
        ניהול
      </Link>
    </article>
  );
}
