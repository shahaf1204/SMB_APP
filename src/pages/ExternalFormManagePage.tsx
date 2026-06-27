import { Link, useParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import {
  EXTERNAL_FORM_ACTIVITY_LABELS,
  EXTERNAL_FORM_PROVIDER_LABELS,
} from '../types/externalForms';
import { appFieldLabel } from '../lib/externalForms/fieldMapping';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../lib/finance';

export function ExternalFormManagePage() {
  const { id } = useParams();
  const connection = useAppStore((s) =>
    s.externalFormConnections.find((c) => c.id === id),
  );
  const submissions = useAppStore((s) =>
    s.externalFormSubmissions.filter((sub) => sub.connectionId === id),
  );
  const retryExternalFormSubmission = useAppStore((s) => s.retryExternalFormSubmission);
  const activateExternalFormConnection = useAppStore((s) => s.activateExternalFormConnection);
  const upsertExternalFormConnection = useAppStore((s) => s.upsertExternalFormConnection);

  if (!connection) {
    return (
      <div className="app-shell">
        <div className="page">
          <Link to="/settings/external-forms" className="back-link">
            ← טפסים
          </Link>
          <p>חיבור לא נמצא</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const toggleActive = async () => {
    const updated = {
      ...connection,
      isActive: !connection.isActive,
      updatedAt: new Date().toISOString(),
    };
    upsertExternalFormConnection(updated);
    if (updated.isActive) await activateExternalFormConnection(connection.id);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to="/settings/external-forms" className="back-link">
          ← טפסים חיצוניים
        </Link>
        <h1 className="page-title">{connection.formName}</h1>
        <p className="page-subtitle">
          {EXTERNAL_FORM_PROVIDER_LABELS[connection.provider]} ·{' '}
          {EXTERNAL_FORM_ACTIVITY_LABELS[connection.activityType]}
        </p>

        <div className="card external-form-manage-summary">
          <p>
            <strong>סטטוס:</strong> {connection.isActive ? 'פעיל' : 'לא פעיל'}
          </p>
          <p>
            <strong>מילויים:</strong> {connection.submissionCount}
          </p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void toggleActive()}>
            {connection.isActive ? 'השהייה' : 'הפעלה'}
          </button>
        </div>

        <section className="connections-category">
          <h2 className="section-title-sm">קישור חיבור לטופס</h2>
          <div className="webhook-copy-box">
            <code>{connection.webhookUrl}</code>
          </div>
        </section>

        <section className="connections-category">
          <h2 className="section-title-sm">מיפוי שדות</h2>
          <ul className="connect-steps">
            {connection.fieldMapping.map((m) => (
              <li key={`${m.externalField}-${m.appField}`}>
                {m.externalField} → {appFieldLabel(m.appField)}
              </li>
            ))}
          </ul>
        </section>

        <section className="connections-category">
          <h2 className="section-title-sm">מילויים אחרונים</h2>
          {submissions.length === 0 ? (
            <p className="empty-state empty-state--compact">טרם התקבלו מילויים</p>
          ) : (
            <ul className="submission-log-list">
              {submissions.slice(0, 20).map((sub) => (
                <li key={sub.id} className="card submission-log-item">
                  <div className="submission-log-head">
                    <span
                      className={`status-chip ${sub.status === 'created' ? 'chip-success' : sub.status === 'failed' ? 'chip-danger' : 'chip-warning'}`}
                    >
                      {sub.status === 'created' ? 'נוצר' : sub.status === 'failed' ? 'נכשל' : sub.status}
                    </span>
                    <span className="submission-log-date">{formatDate(sub.createdAt.slice(0, 10))}</span>
                  </div>
                  {sub.createdActivityId && (
                    <Link to={`/events/${sub.createdActivityId}/edit`} className="text-link-muted">
                      פתיחת פעילות ←
                    </Link>
                  )}
                  {sub.errorMessage && <p className="provider-card-error">{sub.errorMessage}</p>}
                  {sub.status === 'failed' && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => retryExternalFormSubmission(sub.id)}
                    >
                      ניסיון חוזר
                    </button>
                  )}
                  <details className="debug-details">
                    <summary>נתוני הטופס שהתקבלו (debug)</summary>
                    <pre>{JSON.stringify(sub.rawPayload, null, 2)}</pre>
                    <pre>{JSON.stringify(sub.normalizedPayload, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
