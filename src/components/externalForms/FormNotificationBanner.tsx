import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

export function FormNotificationBanner() {
  const notifications = useAppStore((s) => s.formNotifications).filter((n) => !n.read);
  const dismissFormNotification = useAppStore((s) => s.dismissFormNotification);

  if (notifications.length === 0) return null;
  const latest = notifications[0];

  return (
    <div className="form-notification-banner" role="status">
      <span>{latest.message}</span>
      {latest.activityId && (
        <Link to={`/events/${latest.activityId}/edit`} className="form-notification-link">
          צפייה
        </Link>
      )}
      <button
        type="button"
        className="form-notification-dismiss"
        onClick={() => dismissFormNotification(latest.id)}
        aria-label="סגור"
      >
        ×
      </button>
    </div>
  );
}
