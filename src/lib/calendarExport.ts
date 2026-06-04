import type { CalendarReminderSettings } from './calendarSettings';
import { remindersEnabled } from './calendarSettings';
import type { Event } from '../types/models';

export type CalendarEventPayload = Pick<Event, 'title' | 'eventDate' | 'location' | 'notes'>;

export interface CalendarExportOutcome {
  message: string;
  googleCalendarUrl?: string;
  /** ב-Google האירוע לא נשמר עד ללחיצה «שמור» בחלון שלהם */
  needsManualSaveInGoogle?: boolean;
  openedNewTab?: boolean;
}

function formatIcsDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** קישור רשמי ליצירת אירוע ב-Google Calendar */
export function buildGoogleCalendarUrl(event: CalendarEventPayload): string {
  const start = formatIcsDate(event.eventDate);
  const endDate = new Date(event.eventDate + 'T12:00:00');
  endDate.setDate(endDate.getDate() + 1);
  const end = formatIcsDate(endDate.toISOString().slice(0, 10));

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    ctz: 'Asia/Jerusalem',
  });
  const details = [event.notes, event.location ? `מיקום: ${event.location}` : '']
    .filter(Boolean)
    .join('\n');
  if (details) params.set('details', details);
  if (event.location?.trim()) params.set('location', event.location.trim());

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function openGoogleCalendarViaLink(url: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function tryOpenGoogleCalendarTab(url: string): boolean {
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) {
      try {
        return !win.closed;
      } catch {
        return true;
      }
    }
  } catch {
    /* fall through */
  }
  openGoogleCalendarViaLink(url);
  return true;
}

const GOOGLE_SAVE_HINT =
  'חשוב: ב-Google Calendar יש ללחוץ «שמור» — בלי זה האירוע לא יופיע ביומן (האפליקציה רק פותחת טיוטה).';

/** ICS עם תזכורות — עובד טוב ב-Apple / Outlook / Google (ייבוא) */
export function buildEventIcs(
  event: CalendarEventPayload,
  settings: CalendarReminderSettings,
): string {
  const start = formatIcsDate(event.eventDate);
  const endDate = new Date(event.eventDate);
  endDate.setDate(endDate.getDate() + 1);
  const end = formatIcsDate(endDate.toISOString().slice(0, 10));
  const uid = `${start}-${escapeIcs(event.title)}@smb-business-app`;

  let alarms = '';
  if (remindersEnabled(settings)) {
    const alarmParts: string[] = [];
    if (settings.reminders === 'dayBefore' || settings.reminders === 'both') {
      alarmParts.push(`BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:תזכורת — ${escapeIcs(event.title)} מחר
END:VALARM`);
    }
    if (settings.reminders === 'sameDay' || settings.reminders === 'both') {
      const hoursBeforeMidnight = Math.max(1, 24 - settings.sameDayHour);
      alarmParts.push(`BEGIN:VALARM
TRIGGER:-PT${hoursBeforeMidnight}H
ACTION:DISPLAY
DESCRIPTION:תזכורת — ${escapeIcs(event.title)} היום
END:VALARM`);
    }
    alarms = alarmParts.join('\n');
  }

  const desc = [event.notes, event.location ? `מיקום: ${event.location}` : '']
    .filter(Boolean)
    .join('\\n');

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SMB Business App//HE
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatIcsDate(new Date().toISOString().slice(0, 10))}T120000Z
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${end}
SUMMARY:${escapeIcs(event.title)}
${desc ? `DESCRIPTION:${escapeIcs(desc)}` : ''}
${event.location ? `LOCATION:${escapeIcs(event.location)}` : ''}
${alarms}
END:VEVENT
END:VCALENDAR`;
}

export function downloadEventIcs(
  event: CalendarEventPayload,
  settings: CalendarReminderSettings,
): void {
  const ics = buildEventIcs(event, settings);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `event-${event.eventDate}-${event.title.slice(0, 20).replace(/\s/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportEventToPersonalCalendar(
  event: CalendarEventPayload,
  settings: CalendarReminderSettings,
): CalendarExportOutcome {
  if (!settings.syncToCalendar) {
    return { message: '' };
  }

  try {
    if (settings.exportMethod === 'ics') {
      downloadEventIcs(event, settings);
      return {
        message:
          'הורד קובץ יומן (.ics). פתחו אותו ובחרו «הוסף ליומן» — כך האירוע יופיע ב-Google Calendar / Apple.',
      };
    }

    const googleCalendarUrl = buildGoogleCalendarUrl(event);
    const openedNewTab = tryOpenGoogleCalendarTab(googleCalendarUrl);

    return {
      message: openedNewTab
        ? `${GOOGLE_SAVE_HINT} אם לא נפתח חלון — השתמשו בכפתור למטה.`
        : `לא נפתח חלון אוטומטית (חסימת דפדפן). ${GOOGLE_SAVE_HINT}`,
      googleCalendarUrl,
      needsManualSaveInGoogle: true,
      openedNewTab,
    };
  } catch {
    return {
      message: 'לא ניתן לפתוח יומן — נסו שיטת קובץ ICS בהגדרות.',
      googleCalendarUrl: buildGoogleCalendarUrl(event),
      needsManualSaveInGoogle: true,
    };
  }
}
