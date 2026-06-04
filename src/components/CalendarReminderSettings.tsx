import { useState } from 'react';
import {
  DEFAULT_CALENDAR_SETTINGS,
  loadCalendarSettings,
  saveCalendarSettings,
  type CalendarExportMethod,
  type CalendarReminderSettings,
  type ReminderWhen,
} from '../lib/calendarSettings';
import { ensureNotificationPermission } from '../lib/eventReminders';

export function CalendarReminderSettings() {
  const [settings, setSettings] = useState<CalendarReminderSettings>(() =>
    loadCalendarSettings(),
  );
  const [saved, setSaved] = useState(false);
  const [permMsg, setPermMsg] = useState<string | null>(null);

  const update = (patch: Partial<CalendarReminderSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
    setSaved(false);
  };

  const handleSave = async () => {
    saveCalendarSettings(settings);
    setSaved(true);
    if (settings.reminders !== 'off') {
      const ok = await ensureNotificationPermission();
      setPermMsg(
        ok
          ? 'התראות מאושרות — תקבלו תזכורת כשתפתחו את האפליקציה ביום הרלוונטי.'
          : 'לא אושרו התראות בדפדפן — אפשר לאשר בהגדרות הדפדפן, או לסמוך על תזכורות בקובץ היומן.',
      );
    } else {
      setPermMsg(null);
    }
  };

  return (
    <div className="calendar-settings">
      <label className="calendar-settings-row">
        <input
          type="checkbox"
          checked={settings.syncToCalendar}
          onChange={(e) => update({ syncToCalendar: e.target.checked })}
        />
        <span>פתיחת יומן בעת שמירת אירוע (ב-Google: חובה ללחוץ «שמור» שם)</span>
      </label>

      {settings.syncToCalendar && (
        <div className="field" style={{ marginTop: '0.5rem' }}>
          <label htmlFor="cal-method">איך לפתוח את היומן</label>
          <select
            id="cal-method"
            value={settings.exportMethod}
            onChange={(e) =>
              update({ exportMethod: e.target.value as CalendarExportMethod })
            }
          >
            <option value="google">Google Calendar (בדפדפן)</option>
            <option value="ics">קובץ ICS (Apple / Outlook / ייבוא)</option>
          </select>
          <p className="field-hint">
            Google Calendar לא מקבל אירועים אוטומטית מהאפליקציה — נפתחת טיוטה ויש
            ללחוץ «שמור». אם החלון לא נפתח, יופיע כפתור בדשבורד. קובץ ICS מתאים לייבוא
            ישיר ליומן.
          </p>
        </div>
      )}

      <div className="field" style={{ marginTop: '0.75rem' }}>
        <label htmlFor="remind-when">תזכורות באפליקציה</label>
        <select
          id="remind-when"
          value={settings.reminders}
          onChange={(e) => update({ reminders: e.target.value as ReminderWhen })}
        >
          <option value="off">ללא תזכורות</option>
          <option value="dayBefore">יום לפני האירוע</option>
          <option value="sameDay">ביום האירוע</option>
          <option value="both">יום לפני + ביום האירוע</option>
        </select>
      </div>

      {settings.reminders !== 'off' && (
        <p className="field-hint">
          התראות יוצגו כשתפתחו את האפליקציה (אין שרת ברקע). לתזכורות גם כשהאפליקציה סגורה —
          השתמשו בייצוא ICS עם תזכורות מובנות.
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '0.5rem' }}
        onClick={() => void handleSave()}
      >
        שמירת הגדרות יומן
      </button>
      {saved && <p className="field-hint" style={{ marginTop: '0.35rem' }}>נשמר.</p>}
      {permMsg && <p className="field-hint">{permMsg}</p>}
      <button
        type="button"
        className="btn btn-ghost"
        style={{ width: '100%', marginTop: '0.35rem' }}
        onClick={() => {
          setSettings({ ...DEFAULT_CALENDAR_SETTINGS });
          saveCalendarSettings(DEFAULT_CALENDAR_SETTINGS);
          setSaved(true);
        }}
      >
        איפוס לברירת מחדל
      </button>
    </div>
  );
}
