import { BellRing, Check, ExternalLink, Phone, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  normalizeLegacyNotification,
  phoneTelUri,
} from '../../lib/externalForms/formActivityNotification';

export function FormNotificationBanner() {
  const notifications = useAppStore((s) => s.formNotifications);
  const events = useAppStore((s) => s.events);
  const dismissFormNotification = useAppStore((s) => s.dismissFormNotification);
  const markFormNotificationHandled = useAppStore((s) => s.markFormNotificationHandled);

  const pending = useMemo(() => {
    return notifications
      .filter((n) => !n.read && !n.handled)
      .map((n) => {
        const event = n.activityId ? events.find((e) => e.id === n.activityId) : undefined;
        return normalizeLegacyNotification(n, event);
      });
  }, [notifications, events]);

  if (pending.length === 0) return null;

  const latest = pending[0];
  const tel = phoneTelUri(latest.clientPhone);
  const missing = latest.missingFields ?? [];
  const clientLabel = latest.clientName?.trim() || 'לקוח חדש';
  const sourceLine = [latest.formName, latest.sourceLabel].filter(Boolean).join(' · ');

  const markAllHandled = () => {
    for (const n of pending) markFormNotificationHandled(n.id);
  };

  return (
    <div className="inbound-alert-shell" role="region" aria-label="התראות כניסה">
      <article className="inbound-alert-card">
        <div className="inbound-alert-accent" aria-hidden />
        <div className="inbound-alert-icon-wrap" aria-hidden>
          <BellRing size={20} strokeWidth={2} />
        </div>

        <div className="inbound-alert-main">
          <header className="inbound-alert-header">
            <span className="inbound-alert-badge">נכנס אוטומטית</span>
            {pending.length > 1 && (
              <span className="inbound-alert-count">+{pending.length - 1} נוספות</span>
            )}
            <button
              type="button"
              className="inbound-alert-close"
              onClick={() => dismissFormNotification(latest.id)}
              aria-label="סגירת התראה"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </header>

          <h2 className="inbound-alert-client">{clientLabel}</h2>
          {sourceLine && <p className="inbound-alert-source">{sourceLine}</p>}

          {missing.length > 0 ? (
            <div className="inbound-alert-missing">
              <p className="inbound-alert-missing-title">כדאי להשלים מול הלקוח</p>
              <ul className="inbound-alert-chips">
                {missing.map((field) => (
                  <li key={field} className="inbound-alert-chip">
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="inbound-alert-ok">כל הפרטים העיקריים קיימים — אפשר לאשר את האירוע</p>
          )}
        </div>

        <footer className="inbound-alert-actions">
          {latest.activityId && (
            <Link
              to={`/events/${latest.activityId}/edit`}
              className="btn btn-primary btn-sm inbound-alert-btn"
            >
              <ExternalLink size={16} strokeWidth={2} aria-hidden />
              פתיחת אירוע
            </Link>
          )}
          {tel && (
            <a href={tel} className="btn btn-ghost btn-sm inbound-alert-btn">
              <Phone size={16} strokeWidth={2} aria-hidden />
              התקשרי
            </a>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm inbound-alert-btn"
            onClick={() => (pending.length > 1 ? markAllHandled() : markFormNotificationHandled(latest.id))}
          >
            <Check size={16} strokeWidth={2} aria-hidden />
            {pending.length > 1 ? 'סמן הכל כטופל' : 'סמן כטופל'}
          </button>
        </footer>
      </article>
    </div>
  );
}
