export type CalendarExportMethod = 'google' | 'ics';

export type ReminderWhen = 'dayBefore' | 'sameDay' | 'both' | 'off';

export interface CalendarReminderSettings {
  syncToCalendar: boolean;
  exportMethod: CalendarExportMethod;
  reminders: ReminderWhen;
  /** שעה ביום שלפני (0–23) */
  dayBeforeHour: number;
  /** שעה ביום האירוע (0–23) */
  sameDayHour: number;
}

const STORAGE_KEY = 'smb-calendar-settings';

export const DEFAULT_CALENDAR_SETTINGS: CalendarReminderSettings = {
  syncToCalendar: false,
  exportMethod: 'google',
  reminders: 'dayBefore',
  dayBeforeHour: 9,
  sameDayHour: 8,
};

export function loadCalendarSettings(): CalendarReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CALENDAR_SETTINGS };
    const p = JSON.parse(raw) as Partial<CalendarReminderSettings>;
    return {
      ...DEFAULT_CALENDAR_SETTINGS,
      ...p,
      exportMethod: p.exportMethod === 'ics' ? 'ics' : 'google',
      reminders:
        p.reminders === 'sameDay' || p.reminders === 'both' || p.reminders === 'off'
          ? p.reminders
          : 'dayBefore',
    };
  } catch {
    return { ...DEFAULT_CALENDAR_SETTINGS };
  }
}

export function saveCalendarSettings(settings: CalendarReminderSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function remindersEnabled(settings: CalendarReminderSettings): boolean {
  return settings.reminders !== 'off';
}
