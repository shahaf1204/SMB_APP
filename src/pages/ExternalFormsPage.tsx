import { Link } from 'react-router-dom';
import { FileInput } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { EmptyState } from '../components/ui/EmptyState';
import {
  EXTERNAL_FORM_ACTIVITY_LABELS,
  EXTERNAL_FORM_PROVIDER_LABELS,
  type ExternalFormConnection,
} from '../types/externalForms';
import { useAppStore } from '../store/useAppStore';
import { formatDate } from '../lib/finance';

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
              חברי טפסים קיימים כדי שכל מילוי טופס ייצור פעילות אוטומטית באפליקציה
            </p>
          </div>
          {connections.length > 0 && (
            <Link to="/settings/external-forms/new" className="btn btn-primary btn-sm">
              + חדש
            </Link>
          )}
        </div>

        {connections.length === 0 ? (
          <EmptyState
            icon={FileInput}
            title="עדיין לא חיברת טפסים חיצוניים"
            message="תוכל/י לחבר טופס קיים כדי שכל מילוי טופס ייצור פעילות אוטומטית באפליקציה"
            actionLabel="חיבור טופס חדש"
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
  return (
    <article className="card external-form-card">
      <div className="external-form-card-head">
        <div>
          <strong>{connection.formName}</strong>
          <p className="external-form-card-meta">
            {EXTERNAL_FORM_PROVIDER_LABELS[connection.provider]} ·{' '}
            {EXTERNAL_FORM_ACTIVITY_LABELS[connection.activityType]}
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
      <Link to={`/settings/external-forms/${connection.id}`} className="btn btn-ghost btn-sm">
        ניהול
      </Link>
    </article>
  );
}
