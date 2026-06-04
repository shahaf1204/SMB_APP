import { buildGoogleCalendarUrl, downloadEventIcs } from '../lib/calendarExport';
import { loadCalendarSettings } from '../lib/calendarSettings';
import type { CalendarEventPayload } from '../lib/calendarExport';

interface AddToCalendarButtonProps {
  event: CalendarEventPayload;
  className?: string;
}

/** כפתור בלחיצה ידנית — עובד גם כשחלון אוטומטי נחסם */
export function AddToCalendarButton({ event, className }: AddToCalendarButtonProps) {
  const settings = loadCalendarSettings();
  if (!settings.syncToCalendar) return null;

  if (settings.exportMethod === 'ics') {
    return (
      <button
        type="button"
        className={className ?? 'btn btn-ghost'}
        onClick={() => downloadEventIcs(event, settings)}
      >
        הורדת קובץ ליומן
      </button>
    );
  }

  const url = buildGoogleCalendarUrl(event);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? 'btn btn-ghost'}
      style={{ textDecoration: 'none', textAlign: 'center' }}
    >
      הוספה ל-Google Calendar
    </a>
  );
}
