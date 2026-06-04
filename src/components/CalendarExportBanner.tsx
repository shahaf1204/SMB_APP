import type { CalendarExportOutcome } from '../lib/calendarExport';

interface CalendarExportBannerProps {
  outcome: CalendarExportOutcome;
}

export function CalendarExportBanner({ outcome }: CalendarExportBannerProps) {
  if (!outcome.message && !outcome.googleCalendarUrl) return null;

  return (
    <div className="calendar-export-banner" role="status">
      <p className="calendar-export-banner-text">{outcome.message}</p>
      {outcome.googleCalendarUrl && (
        <a
          href={outcome.googleCalendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary calendar-export-banner-btn"
        >
          פתיחת Google Calendar — ואז «שמור»
        </a>
      )}
      {outcome.needsManualSaveInGoogle && (
        <p className="field-hint" style={{ margin: '0.5rem 0 0' }}>
          האירוע נשמר באפליקציה שלנו. ב-Google הוא יתווסף רק אחרי שתלחצו שמור בחלון שלהם.
        </p>
      )}
    </div>
  );
}
