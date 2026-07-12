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
  const hasMissing = (latest.missingFields?.length ?? 0) > 0;

  return (
    <div className="form-notification-banner" role="status">
      <div className="form-notification-body">
        <strong className="form-notification-title">אירוע חדש נכנס אוטומטית</strong>
        <p className="form-notification-message">{latest.message}</p>
        {hasMissing && (
          <p className="form-notification-missing">
            מומלץ לפנות ללקוח להשלמת: {latest.missingFields!.join(', ')}
          </p>
        )}
        {latest.sourceLabel && latest.formName && (
          <p className="form-notification-meta">
            {latest.sourceLabel} · {latest.formName}
          </p>
        )}
      </div>
      <div className="form-notification-actions">
        {latest.activityId && (
          <Link to={`/events/${latest.activityId}/edit`} className="form-notification-link">
            פתיחת אירוע
          </Link>
        )}
        {tel && (
          <a href={tel} className="form-notification-link">
            התקשרי
          </a>
        )}
        <button
          type="button"
          className="form-notification-link form-notification-link--btn"
          onClick={() => markFormNotificationHandled(latest.id)}
        >
          סמן כטופל
        </button>
        <button
          type="button"
          className="form-notification-dismiss"
          onClick={() => dismissFormNotification(latest.id)}
          aria-label="סגור"
        >
          ×
        </button>
      </div>
      {pending.length > 1 && (
        <p className="form-notification-queue">+{pending.length - 1} התראות נוספות</p>
      )}
    </div>
  );
}
